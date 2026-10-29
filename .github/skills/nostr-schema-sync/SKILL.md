---
name: nostr-schema-sync
description: Keep Nostr registry schema artifacts in sync across TypeScript, Rust, Prisma, and workflow publishing in this repository. Use when adding or changing kinds/fields in schema-derived files.
---

Use this workflow to keep schema and generated artifacts aligned:

1. Treat `schema.json` as the source-of-truth artifact in this repository.
2. When schema semantics change, check and update corresponding files:
- `src/nostr-types.ts`
- `src/nostr-registry-types.rs`
- `prisma/schema.prisma`
- `src/decentralized/bootstrap.ts`
3. Preserve compatibility for kind `30078` registry publishing paths and verify workflow trigger expectations in `.github/workflows/publish-registry.yml`.
4. Validate with:
- `npm run lint`
- `npm run build`
5. Document any intentional schema/runtime mismatch in the PR description instead of leaving silent drift.
