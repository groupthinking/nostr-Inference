# nostr-Inference



Nostr schemas + registry events
              ↓
     edge / cloud / hybrid
        task orchestration

Nostr registry-of-kinds → full codegen (JSON Schema, TS/Zod, Rust, DB) + decentralized events (kind 30078) + **Inference Orchestration Layer** (Edge-Cloud Continuum for browser extensions).

## Project purpose and intended outcome

This project is an interoperability and orchestration foundation for AI-capable applications that use Nostr. It keeps the Nostr registry-of-kinds usable across TypeScript, Rust, JSON Schema, and PostgreSQL, then provides a place to route work between local/edge execution and cloud execution.

The intended outcome is a deployable, privacy-aware edge/cloud orchestration layer in which:

- applications validate and exchange compatible Nostr events;
- registry changes can be discovered through signed, decentralized kind `30078` events; and
- task placement can account for complexity, privacy, urgency, data volume, and available resources.

This repository is currently a foundation and reference implementation, not a production inference service. The orchestration metrics, resource monitoring, execution coordinator, and registry publishing workflow contain placeholders and should be hardened before production use.

### Position relative to existing solutions

The project is complementary to centralized AI orchestration frameworks and hosted inference platforms rather than a direct replacement for them. Those solutions generally optimize model access and managed execution; this project focuses on Nostr-native interoperability, decentralized registry discovery, and a policy point for choosing edge, cloud, or hybrid execution. Its future success should therefore be measured by reliable cross-runtime schemas, useful placement decisions, privacy and latency improvements over cloud-only execution, and adoption by applications that need a portable decentralized control plane.

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

## MCP and Agent Skills

- MCP/skills baseline and capability-negotiation assessment: `docs/mcp-skills-baseline.md`
- Project skills for Copilot-compatible agents:
  - `.github/skills/gh-fix-ci/SKILL.md`
  - `.github/skills/security-threat-model/SKILL.md`
  - `.github/skills/mcp-capability-negotiation/SKILL.md`

Last updated: March 10, 2026
