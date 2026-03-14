# nostr-Inference

Nostr registry-of-kinds → full codegen (JSON Schema, TS/Zod, Rust, DB) + decentralized events (kind 30078) + **Inference Orchestration Layer** (Edge-Cloud Continuum for browser extensions).

## What's inside (everything we built)
- `#1` `schema.json` — Official expanded JSON Schema (28+ kinds)
- `#2` `src/nostr-types.ts` — TypeScript + Zod (React/Next.js ready)
- `#3` `src/iol/index.ts` — Full Inference Orchestration Layer (Task Analyzer → Result Fuser) + Nostr bootstrap
- `#4` `src/nostr-registry-types.rs` — Rust serde structs + zero-copy validation
- `#5` `prisma/schema.prisma` — Prisma + PostgreSQL JSONB models with imeta indexes
- `#6` `src/decentralized/bootstrap.ts` — Kind 30078 living registry events
- `#7` `.github/workflows/publish-registry.yml` — Auto-publishes 30078 event on changes

Everything stays in sync with https://github.com/nostr-protocol/registry-of-kinds/schema.yaml.

## Quick start
```bash
git clone https://github.com/groupthinking/nostr-Inference.git
cd nostr-Inference
npm install          # TS + IOL
cargo build          # Rust (optional)
npx prisma generate  # DB (optional)
```
Last updated: March 10, 2026
