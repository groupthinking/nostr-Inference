---
name: security-threat-model
description: Use when asked to threat model this repository's Nostr registry, orchestration layer, secret rotation, or schema publishing workflow.
---

# Threat model for `nostr-Inference`

Create a repository-grounded threat model focused on realistic abuse paths.

## Repository context to include

- Nostr schema/codegen artifacts: `schema.json`, `src/nostr-types.ts`, `src/nostr-registry-types.rs`
- Orchestration layer: `src/iol/index.ts`
- Decentralized registry bootstrap: `src/decentralized/bootstrap.ts`
- Secret rotation tooling: `src/secret-rotator/index.ts`
- Publish workflow: `.github/workflows/publish-registry.yml`

## Threat-model workflow

1. Identify trust boundaries:
   - local edge runtime,
   - cloud execution path,
   - Nostr relays/events,
   - developer workstation/CI pipeline,
   - database integration (`prisma/schema.prisma`).
2. Enumerate high-value assets:
   - signing keys and secrets,
   - event integrity,
   - schema integrity,
   - orchestration policy decisions.
3. Enumerate attacker goals and abuse paths:
   - malicious event injection,
   - schema poisoning,
   - secret exfiltration via tooling,
   - CI/workflow tampering,
   - denial of service through oversized or malformed payloads.
4. Rank each threat by likelihood and impact.
5. Recommend concrete mitigations mapped to files/components.

## Quality bar

- Anchor every claim to repository evidence.
- Keep assumptions explicit.
- Separate current controls from recommended controls.
