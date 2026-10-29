---
name: github-actions-failure-debugging
description: Debug failing GitHub Actions workflows for this repository, especially registry publish and agent automation runs. Use when CI, workflow, build, or PR automation failures are reported.
---

To debug failing GitHub Actions workflows in this repository, follow this process:

1. List recent workflow runs and identify failing runs first.
2. Retrieve failed job logs for the failing run and summarize the first actionable root cause.
3. Map the failure to repository-specific behavior:
- `.github/workflows/publish-registry.yml` only triggers on `schema.json` changes.
- The publish job currently emits a readiness message and can fail due to workflow syntax, checkout issues, or branch context.
- Dynamic agent workflows can fail from lint/build issues introduced in PRs.
4. Reproduce locally when relevant:
- Run `npm run lint` for TypeScript/static checks.
- Run `npm run build` for compile validation.
5. Fix the smallest possible scope and rerun the same validations.
6. Confirm the fix by checking a new workflow run status and failed-job logs if still failing.
