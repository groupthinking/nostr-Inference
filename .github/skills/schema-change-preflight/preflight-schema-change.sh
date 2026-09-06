#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:-$(git rev-parse --show-toplevel)}"
cd "$repo_root"

if [[ ! -f "schema.json" ]]; then
  echo "ERROR: schema.json not found. Run from the nostr-Inference repository root or pass repo root explicitly."
  exit 1
fi

echo "== Repository check =="
echo "repo: $repo_root"

echo "== Change summary =="
base_ref=""
if git rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
  base_ref="$(git merge-base HEAD origin/main 2>/dev/null || true)"
fi
if [[ -n "$base_ref" ]]; then
  git diff --name-only "$base_ref"..HEAD | grep -E "^(schema\.json|\.github/workflows/publish-registry\.yml)$" || true
elif git rev-parse --verify --quiet HEAD~1 >/dev/null 2>&1; then
  git diff --name-only HEAD~1..HEAD | grep -E "^(schema\.json|\.github/workflows/publish-registry\.yml)$" || true
else
  git status --short -- schema.json .github/workflows/publish-registry.yml || true
fi

echo "== Lint =="
npm run lint

echo "== Build =="
npm run build

echo "Preflight completed successfully."
