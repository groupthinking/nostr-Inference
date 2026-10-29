#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
preflight_script="$script_dir/preflight-schema-change.sh"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

repo_dir="$tmp_dir/repo"
mkdir -p "$repo_dir/.github/workflows"
cd "$repo_dir"

git init -q
git config user.name "Test User"
git config user.email "test@example.com"

cat > package.json <<'EOF'
{
  "name": "preflight-test",
  "private": true,
  "scripts": {
    "lint": "echo lint",
    "build": "echo build"
  }
}
EOF

cat > schema.json <<'EOF'
{
  "version": 1
}
EOF

cat > .github/workflows/publish-registry.yml <<'EOF'
name: publish-registry
on: [push]
jobs: {}
EOF

git add package.json schema.json .github/workflows/publish-registry.yml
git commit -q -m "initial"

cat > schema.json <<'EOF'
{
  "version": 2
}
EOF
git add schema.json
git commit -q -m "schema change in non-HEAD commit"

echo "unrelated change" > notes.txt
git add notes.txt
git commit -q -m "latest commit does not touch schema"

test_output="$tmp_dir/preflight-output.txt"
bash "$preflight_script" "$repo_dir" >"$test_output"

if ! grep -q "^schema\\.json$" "$test_output"; then
  echo "Expected change summary to include schema.json when origin/main is unavailable."
  echo "--- output ---"
  cat "$test_output"
  exit 1
fi

echo "PASS: multi-commit fallback includes schema.json changes without origin/main."
