---
name: mcp-capability-negotiation
description: Use when asked whether this repository is using MCP and to verify baseline MCP capability negotiation (server/discover plus per-request clientCapabilities) for this project.
---

# MCP capability negotiation check for `nostr-Inference`

This skill determines MCP usage and validates baseline negotiation readiness.

## Repository-specific baseline

- This repository does not currently include an in-repo MCP server/client implementation.
- MCP functionality is currently consumed through host tooling integrations (for example GitHub MCP tools used by agents during maintenance tasks).
- If no MCP protocol files are present in source, report that status explicitly instead of implying runtime MCP support.

## Workflow

1. Scan repository for MCP protocol usage keywords:
   - `server/discover`
   - `io.modelcontextprotocol/clientCapabilities`
   - `modelcontextprotocol`
   - `MCP`
2. If MCP is not implemented in runtime code, document current architecture as:
   - Host: agent runtime/orchestrator
   - Client: tool client instance per server
   - Server: GitHub MCP server endpoints
3. Validate baseline negotiation conceptually against the spec:
   - client sends `_meta.io.modelcontextprotocol/protocolVersion`
   - client sends `_meta.io.modelcontextprotocol/clientCapabilities`
   - server advertises `supportedVersions` and `capabilities` via `server/discover`
4. For CI/ops workflows, verify MCP-connected tooling is functional by successfully listing workflow runs and retrieving job logs.
5. Output a gap analysis with clear next steps if native MCP server support is desired in this repository.

## Output expectations

- State whether native MCP code exists in the repo.
- State what MCP baseline is currently functional.
- Provide minimum implementation steps for adding native MCP support if requested.
