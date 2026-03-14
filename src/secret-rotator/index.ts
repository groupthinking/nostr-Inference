import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanLocation {
  name: string;
  filePath: string;
}

export interface RotateOptions {
  dryRun?: boolean;
  createBackups?: boolean;
  keychain?: boolean;       // upsert macOS Keychain (default true)
  keychainPrefix?: string;  // e.g. "openclaw-env" → service = "openclaw-env:KEY_NAME"
  reload?: string[];        // launchctl plist labels to bootout+bootstrap after rotation
  verbose?: boolean;
}

export interface ScanResult {
  file: string;
  line: number;
  snippet: string;
}

export interface VerifyResult {
  location: string;
  found: boolean;
  masked: string; // first 4 + last 4 chars
}

// ---------------------------------------------------------------------------
// Default scan directories (covers most dev setups on macOS / Linux)
// ---------------------------------------------------------------------------

const HOME = process.env.HOME || process.env.USERPROFILE || '/tmp';

const DEFAULT_SCAN_DIRS = [
  path.join(HOME, '.config'),                   // XDG-style configs
  path.join(HOME, '.openclaw'),                 // openclaw-specific
  path.join(HOME, '.aws'),                      // AWS credentials
  path.join(HOME, '.docker'),                   // Docker configs
  path.join(HOME, 'Library/LaunchAgents'),      // macOS launch agents
];

// Individual dotfiles to check (avoids walking all of $HOME)
const DOTFILES = [
  '.zshrc', '.zprofile', '.bashrc', '.bash_profile', '.profile',
  '.env', '.env.local',
].map(f => path.join(HOME, f));

const SCANNABLE_EXTENSIONS = new Set([
  '.env', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.plist', '.xml', '.conf', '.sh', '.bash', '.zsh', '.fish',
  '.ts', '.js', '.py', '.rb', '.properties',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv',
]);

// ---------------------------------------------------------------------------
// SecretRotator — general-purpose, works for any key in any project
// ---------------------------------------------------------------------------

export class SecretRotator {

  // ── SCAN: find every file that references a key name ──────────────
  scan(keyName: string, extraDirs: string[] = []): ScanResult[] {
    const dirs = [...DEFAULT_SCAN_DIRS, ...extraDirs].filter(d => fs.existsSync(d));
    const results: ScanResult[] = [];

    const scanFile = (filePath: string) => {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 512_000) return; // skip files > 500 KB
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach((line, idx) => {
          if (line.includes(keyName)) {
            results.push({ file: filePath, line: idx + 1, snippet: line.trim().slice(0, 120) });
          }
        });
      } catch { /* skip unreadable files */ }
    };

    // 1. Check individual dotfiles in $HOME
    for (const f of DOTFILES) {
      if (fs.existsSync(f)) scanFile(f);
    }

    // 2. Walk config directories
    for (const dir of dirs) {
      this.walkDir(dir, scanFile);
    }

    return results;
  }

  // ── ROTATE: update key value everywhere it appears ────────────────
  async rotate(keyName: string, newValue: string, options: RotateOptions = {}) {
    const {
      dryRun = false,
      createBackups = true,
      keychain = true,
      keychainPrefix = 'openclaw-env',
      reload = [],
      verbose = true,
    } = options;

    const label = dryRun ? '(DRY RUN) ' : '';
    console.log(`\n🔄 ${label}Rotating ${keyName}\n`);

    // 1. Discover every file that mentions this key
    const hits = this.scan(keyName);
    const uniqueFiles = [...new Set(hits.map(h => h.file))];

    if (uniqueFiles.length === 0) {
      console.log('   ⚠️  No files found containing this key.');
    }

    // 2. Update each file
    let updated = 0;
    for (const filePath of uniqueFiles) {
      try {
        if (createBackups) {
          const backup = `${filePath}.bak.${Date.now()}`;
          fs.copyFileSync(filePath, backup);
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const regex = new RegExp(`(${this.escapeRegex(keyName)}\\s*[=:]\\s*["']?)[^"'\\n,}]+(["']?)`, 'g');
        const replaced = content.replace(regex, `$1${newValue}$2`);

        if (replaced !== content) {
          if (!dryRun) fs.writeFileSync(filePath, replaced);
          updated++;
          if (verbose) console.log(`   ✅ ${this.shortPath(filePath)}`);
        }
      } catch (e) {
        console.error(`   ⚠️  ${this.shortPath(filePath)} failed:`, (e as Error).message);
      }
    }

    // 3. macOS Keychain
    if (keychain && process.platform === 'darwin') {
      await this.upsertKeychain(keychainPrefix, keyName, newValue, dryRun);
    }

    // 4. Reload launchctl services
    if (!dryRun && reload.length > 0) {
      await this.reloadServices(reload);
    }

    console.log(`\n✅ Done — ${updated} file(s) updated${keychain ? ' + Keychain' : ''}.\n`);
  }

  // ── VERIFY: confirm the current value in every location ───────────
  verify(keyName: string, expectedPrefix?: string): VerifyResult[] {
    const hits = this.scan(keyName);
    const results: VerifyResult[] = [];

    const uniqueFiles = [...new Set(hits.map(h => h.file))];
    for (const filePath of uniqueFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = new RegExp(`${this.escapeRegex(keyName)}\\s*[=:]\\s*["']?([^"'\\n,}]+)["']?`);
        const match = content.match(regex);
        const val = match?.[1] || '';
        const masked = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-4) : '****';
        const found = expectedPrefix ? val.startsWith(expectedPrefix) : val.length > 0;
        results.push({ location: this.shortPath(filePath), found, masked });
      } catch { /* skip */ }
    }

    // Check Keychain
    if (process.platform === 'darwin') {
      try {
        const val = execSync(
          `security find-generic-password -s "openclaw-env:${keyName}" -w 2>/dev/null`,
          { encoding: 'utf8' }
        ).trim();
        const masked = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-4) : '****';
        results.push({ location: `Keychain (openclaw-env:${keyName})`, found: val.length > 0, masked });
      } catch {
        results.push({ location: `Keychain (openclaw-env:${keyName})`, found: false, masked: '(not set)' });
      }
    }

    return results;
  }

  // ── LIST: show all known API keys across the system ───────────────
  list(): { keyName: string; locations: number }[] {
    const keyPattern = /\b([A-Z][A-Z0-9_]*(?:_API_KEY|_SECRET|_TOKEN|_KEY|_PASSWORD))\b/g;
    const keyMap = new Map<string, Set<string>>();

    const scanFile = (filePath: string) => {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 512_000) return;
        const content = fs.readFileSync(filePath, 'utf8');
        let m: RegExpExecArray | null;
        while ((m = keyPattern.exec(content)) !== null) {
          const key = m[1];
          if (!keyMap.has(key)) keyMap.set(key, new Set());
          keyMap.get(key)!.add(filePath);
        }
      } catch { /* skip */ }
    };

    for (const f of DOTFILES) {
      if (fs.existsSync(f)) scanFile(f);
    }
    for (const dir of DEFAULT_SCAN_DIRS.filter(d => fs.existsSync(d))) {
      this.walkDir(dir, scanFile);
    }

    return Array.from(keyMap.entries())
      .map(([keyName, files]) => ({ keyName, locations: files.size }))
      .sort((a, b) => b.locations - a.locations);
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private async upsertKeychain(prefix: string, keyName: string, newValue: string, dryRun: boolean) {
    const service = `${prefix}:${keyName}`;
    if (dryRun) {
      console.log(`   [DRY] Would upsert Keychain → ${service}`);
      return;
    }
    try {
      execSync(`security add-generic-password -U -s "${service}" -a "" -w "${newValue}"`);
      console.log(`   🔑 Keychain ${service} updated`);
    } catch (e) {
      console.error(`   ⚠️  Keychain ${service} failed:`, (e as Error).message);
    }
  }

  private async reloadServices(labels: string[]) {
    const uid = execSync('id -u', { encoding: 'utf8' }).trim();
    for (const label of labels) {
      try {
        execSync(`launchctl bootout gui/${uid}/${label} 2>/dev/null || true`, { stdio: 'ignore' });
        await new Promise(r => setTimeout(r, 1500));
        const plistPath = path.join(HOME, 'Library/LaunchAgents', `${label}.plist`);
        if (fs.existsSync(plistPath)) {
          execSync(`launchctl bootstrap gui/${uid} "${plistPath}"`, { stdio: 'ignore' });
          console.log(`   ♻️  Reloaded ${label}`);
        }
      } catch (e) {
        console.error(`   ⚠️  Reload ${label} failed:`, (e as Error).message);
      }
    }
  }

  private walkDir(dir: string, callback: (filePath: string) => void, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && depth > 0 && entry.isDirectory()) continue;
        if (SKIP_DIRS.has(entry.name)) continue;

        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.walkDir(full, callback, depth + 1, maxDepth);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const basename = entry.name;
          if (SCANNABLE_EXTENSIONS.has(ext) || basename.startsWith('.env') || basename.startsWith('.zsh') || basename.startsWith('.bash')) {
            callback(full);
          }
        }
      }
    } catch { /* permission denied, etc. */ }
  }

  private shortPath(p: string): string {
    return p.startsWith(HOME) ? '~' + p.slice(HOME.length) : p;
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
  🔑 Secret Rotator — rotate any API key everywhere, in one command.

  Usage:
    npm run rotate-key -- rotate  <KEY_NAME> '<new-value>'  [--dry-run] [--no-keychain] [--reload label1,label2]
    npm run rotate-key -- scan    <KEY_NAME>
    npm run rotate-key -- verify  <KEY_NAME>
    npm run rotate-key -- list

  Commands:
    rotate   Find & replace KEY_NAME in every config file + macOS Keychain
    scan     Show every file that contains KEY_NAME (no changes)
    verify   Check current value of KEY_NAME in all locations (masked)
    list     Discover all API key names across your system

  Examples:
    npm run rotate-key -- rotate  GEMINI_API_KEY    'AIza...'
    npm run rotate-key -- rotate  OPENAI_API_KEY    'sk-...'
    npm run rotate-key -- rotate  ANTHROPIC_API_KEY 'sk-ant-...' --dry-run
    npm run rotate-key -- scan    PERPLEXITY_API_KEY
    npm run rotate-key -- verify  GEMINI_API_KEY
    npm run rotate-key -- list
`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const rotator = new SecretRotator();

  const flagIndex = (name: string) => args.indexOf(name);
  const hasFlag = (name: string) => flagIndex(name) !== -1;
  const flagValue = (name: string) => { const i = flagIndex(name); return i !== -1 ? args[i + 1] : undefined; };

  switch (cmd) {
    case 'rotate': {
      const key = args[1];
      const value = args[2];
      if (!key || !value) { printUsage(); process.exit(1); }

      const reloadLabels = flagValue('--reload')?.split(',') ?? [];
      rotator.rotate(key, value, {
        dryRun: hasFlag('--dry-run'),
        keychain: !hasFlag('--no-keychain'),
        reload: reloadLabels,
      });
      break;
    }
    case 'scan': {
      const key = args[1];
      if (!key) { printUsage(); process.exit(1); }
      const results = rotator.scan(key);
      if (results.length === 0) {
        console.log(`\n   No files found containing "${key}".\n`);
      } else {
        console.log(`\n   🔍 Found ${key} in ${results.length} location(s):\n`);
        for (const r of results) {
          console.log(`   ${r.file}:${r.line}`);
          console.log(`      ${r.snippet}\n`);
        }
      }
      break;
    }
    case 'verify': {
      const key = args[1];
      if (!key) { printUsage(); process.exit(1); }
      const results = rotator.verify(key);
      console.log(`\n   🔍 Verification for ${key}:\n`);
      for (const r of results) {
        const icon = r.found ? '✅' : '❌';
        console.log(`   ${icon} ${r.location}  →  ${r.masked}`);
      }
      console.log('');
      break;
    }
    case 'list': {
      const keys = rotator.list();
      console.log(`\n   🗝️  Discovered ${keys.length} API key(s):\n`);
      for (const k of keys) {
        console.log(`   ${k.keyName}  (${k.locations} file${k.locations > 1 ? 's' : ''})`);
      }
      console.log('');
      break;
    }
    default:
      printUsage();
  }
}
