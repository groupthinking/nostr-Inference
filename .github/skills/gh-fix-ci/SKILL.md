---
name: gh-fix-ci
description: Use when asked to debug or fix failing GitHub Actions checks for this repository. Focus on the publish-registry workflow and TypeScript build/lint verification.
---

# Debug CI for `groupthinking/nostr-Inference`

Use this workflow when PR checks fail or a workflow run is red.

## Repository context

- Repository: `groupthinking/nostr-Inference`
- Primary workflow: `.github/workflows/publish-registry.yml`
- Trigger: `push` changes to `schema.json`
- Local validation commands:
  - `npm run build`
  - `npm run lint`
  - `npm test`
  - `npx prisma generate` (when schema-related files are touched)

## Workflow

1. List recent runs with `actions_list` (`list_workflow_runs`) for `groupthinking/nostr-Inference`.
2. For failed runs, fetch logs with `get_job_logs` (`failed_only=true`, or by specific job ID).
3. Identify whether failure is in:
   - workflow trigger/configuration,
   - repository files (`schema.json`, TypeScript sources), or
   - tooling/dependency drift.
4. Reproduce locally with the relevant npm/prisma command.
5. Apply the smallest safe fix and re-run local checks.
6. Summarize root cause, exact file changes, and verification commands.

## Output expectations

- Include failing run URL or run ID.
- Quote the key error lines from logs.
- Provide a concrete fix plan before implementation when scope is uncertain.
