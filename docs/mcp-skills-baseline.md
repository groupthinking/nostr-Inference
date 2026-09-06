# MCP and Skills Baseline for `nostr-Inference`

This document makes the MCP/skills guidance concrete for this repository.

## Repository profile used for this baseline

### Tree snapshot

- `.github/workflows/publish-registry.yml`
- `schema.json`
- `src/iol/index.ts`
- `src/decentralized/bootstrap.ts`
- `src/secret-rotator/index.ts`
- `src/nostr-types.ts`
- `src/nostr-registry-types.rs`
- `prisma/schema.prisma`
- `package.json`
- `Cargo.toml`

### Dependency snapshot

- Node runtime dependencies: `zod`, `rx-nostr`, `nostr-tools`
- Node dev dependencies: `typescript`, `@types/node`, `eslint`, `@typescript-eslint/*`, `prisma`, `ts-node`
- Rust dependencies: `serde`, `serde_json`

### Readme alignment

`README.md` defines this repository as a Nostr interoperability and edge/cloud orchestration foundation, not a production inference service.

## Skills added for this repository

The following project skills were added under `.github/skills/`:

1. `gh-fix-ci`
- Repo-specific workflow for debugging Actions failures using workflow-run and job-log inspection.
- Tailored to `.github/workflows/publish-registry.yml` and TypeScript/Prisma validation.

2. `security-threat-model`
- Repo-specific threat-model workflow focused on Nostr event integrity, schema integrity, secret rotation, and workflow trust boundaries.

3. `mcp-capability-negotiation`
- Workflow to determine whether native MCP is implemented and verify baseline capability negotiation expectations.

## MCP usage assessment (2026-07-28 spec)

### Current state in this repository

- No native MCP server/client implementation is present in runtime source files.
- No direct in-repo usage of `server/discover` or `_meta.io.modelcontextprotocol/clientCapabilities` was found.

### Baseline MCP capability negotiation status

- Baseline MCP tool access is functional through the host environment (GitHub MCP integration).
- Functional verification completed by:
  - listing workflow runs (`actions_list`, `list_workflow_runs`)
  - retrieving job log status (`get_job_logs`)

### Capability-negotiation requirements referenced

From MCP 2026-07-28 `server/discover`:

- clients send per-request `_meta` including protocol version and client capabilities
- servers return supported versions and capabilities
- clients and servers must respect declared capabilities

## Decision and next steps

Given current project scope, MCP is operational for maintenance workflows via host integrations, while native MCP runtime support is not yet implemented in this repository.

If native MCP support is later required, start with:

1. Introduce a minimal MCP server endpoint exposing `server/discover`.
2. Add a client request wrapper that always includes `_meta` protocol version and `clientCapabilities`.
3. Add tests that assert capability advertisement and unsupported-version behavior.
