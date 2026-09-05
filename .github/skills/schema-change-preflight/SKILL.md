---
name: schema-change-preflight
description: Run a repeatable preflight for schema and workflow-sensitive changes in this repo. Use when `schema.json`, workflow files, or schema-derived TypeScript/Rust/Prisma artifacts are modified.
---

When asked to validate schema-related changes, run `preflight-schema-change.sh` from this skill directory.

Usage:

```bash
./preflight-schema-change.sh [repo-root]
```

Expected behavior:

1. Verify this is the `nostr-Inference` repository and `schema.json` is present.
2. Show whether `schema.json` or `.github/workflows/publish-registry.yml` changed.
3. Run repository validations used for CI confidence:
- `npm run lint`
- `npm run build`
4. Report pass/fail clearly so follow-up fixes can be applied quickly.
