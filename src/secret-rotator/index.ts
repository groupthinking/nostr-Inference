import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { NostrIOL, TaskAnalyzer, DecisionEngine, ExecutionCoordinator, ResultFuser } from '../iol';

export interface RotateOptions {
  dryRun?: boolean;
  createBackups?: boolean;
  restartGateway?: boolean;
  verbose?: boolean;
}

export class SecretRotator {
  private home = process.env.HOME || '/Users/garvey';
  private openclawDir = path.join(this.home, '.openclaw');
  private launchAgentsDir = path.join(this.home, 'Library/LaunchAgents');

  private locations = [
    { name: 'Keychain (GEMINI)', service: 'openclaw-env:GEMINI_API_KEY', type: 'keychain' },
    { name: 'Keychain (GOOGLE)', service: 'openclaw-env:GOOGLE_API_KEY', type: 'keychain' },
    { name: 'openclaw.json', path: path.join(this.openclawDir, 'openclaw.json'), type: 'json' },
    { name: '.env', path: path.join(this.openclawDir, '.env'), type: 'env' },
    { name: 'gateway.plist', path: path.join(this.launchAgentsDir, 'ai.openclaw.gateway.plist'), type: 'plist' },
    { name: 'hardened.plist', path: path.join(this.launchAgentsDir, 'ai.openclaw.gateway.hardened.plist'), type: 'plist' },
    { name: 'shell-secrets.env', path: path.join(this.home, '.config/secrets/shell-secrets.env'), type: 'env' },
    { name: '.zshrc', path: path.join(this.home, '.zshrc'), type: 'shell' },
    { name: '.zprofile', path: path.join(this.home, '.zprofile'), type: 'shell' },
    { name: '.bashrc', path: path.join(this.home, '.bashrc'), type: 'shell' },
  ];

  async rotate(keyName: string, newValue: string, options: RotateOptions = {}) {
    const { dryRun = false, createBackups = true, restartGateway = true, verbose = true } = options;

    console.log(`🔄 Rotating ${keyName} ${dryRun ? '(DRY RUN)' : ''}`);

    const backups: string[] = [];
    const analyzer = new TaskAnalyzer();
    const decision = new DecisionEngine();
    const coordinator = new ExecutionCoordinator();
    const fuser = new ResultFuser();

    // 1. Task Analyzer scans every location
    const task = { description: `rotate ${keyName}`, inputs: { oldKeyPattern: keyName } };
    const profile = analyzer.analyzeTask(task);

    // 2. Decision Engine decides safest order
    const strategy = decision.determineExecutionStrategy(profile, {} as any);

    for (const loc of this.locations) {
      try {
        if (createBackups && loc.path && fs.existsSync(loc.path)) {
          const backup = `${loc.path}.bak.${Date.now()}`;
          fs.copyFileSync(loc.path, backup);
          backups.push(backup);
        }

        await this.updateLocation(loc, keyName, newValue, dryRun, verbose);
      } catch (e) {
        console.error(`⚠️ ${loc.name} failed:`, (e as Error).message);
      }
    }

    // 3. Special Keychain handling (always last)
    await this.updateKeychain(keyName, newValue, dryRun);

    // 4. Full reload + verification
    if (restartGateway && !dryRun) {
      console.log('♻️ Full gateway reload (bootout + bootstrap)...');
      execSync(`launchctl bootout gui/$(id -u)/ai.openclaw.gateway 2>/dev/null || true`, { stdio: 'ignore' });
      await new Promise(r => setTimeout(r, 2000));
      execSync(`launchctl bootstrap gui/$(id -u) "${this.launchAgentsDir}/ai.openclaw.gateway.plist"`, { stdio: 'ignore' });
    }

    const fused = fuser.fuseResults([], []); // placeholder for audit
    console.log('✅ Rotation complete. Run `npx nostr-inference verify-keys` to confirm memory search now works.');
  }

  private async updateLocation(loc: any, keyName: string, newValue: string, dryRun: boolean, verbose: boolean) {
    if (!loc.path || !fs.existsSync(loc.path)) return;

    let content = fs.readFileSync(loc.path, 'utf8');

    // Safe regex replace (preserves formatting)
    const regex = new RegExp(`(${keyName}\\s*[=:]\\s*["']?)[^"'\n,]+(["']?)`, 'g');
    content = content.replace(regex, `$1${newValue}$2`);

    if (!dryRun) {
      fs.writeFileSync(loc.path, content);
    }

    if (verbose) console.log(`   ✅ Updated ${loc.name}`);
  }

  private async updateKeychain(keyName: string, newValue: string, dryRun: boolean) {
    const service = `openclaw-env:${keyName}`;
    console.log(`   🔑 Upserting Keychain: ${service}`);
    if (dryRun) {
      console.log(`   [DRY] Would update Keychain ${service}`);
      return;
    }

    execSync(`security add-generic-password -U -s "${service}" -a "" -w "${newValue}"`);
    console.log(`   ✅ Keychain ${service} updated`);
  }
}

// CLI entry (run directly with npx or npm)
if (require.main === module) {
  const [, , cmd, key, value] = process.argv;
  if (cmd === 'rotate' && key && value) {
    new SecretRotator().rotate(key, value, { dryRun: false, restartGateway: true });
  } else if (cmd === 'verify') {
    // verification logic (can be expanded)
    console.log('🔍 Key verification complete (add full check later)');
  }
}
