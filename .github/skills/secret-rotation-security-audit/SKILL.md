---
name: secret-rotation-security-audit
description: Audit and safely modify secret-rotation behavior in this repository. Use when changing key rotation logic, scanning for leaked keys, or validating rotation commands.
---

Use this process for secret-rotation work:

1. Scope changes to `src/secret-rotator/index.ts` and related command paths unless broader changes are required.
2. Before and after edits, run repository-provided rotation commands as needed:
- `npm run scan-key`
- `npm run verify-key`
- `npm run list-keys`
3. If rotation behavior changed, run `npm run rotate-key` only in controlled test fixtures or non-production material.
4. Ensure key-like strings, tokens, and credentials are never committed; run secret scanning on changed files before commit.
5. Validate TypeScript quality gates after changes:
- `npm run lint`
- `npm run build`
