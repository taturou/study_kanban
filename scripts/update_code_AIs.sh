#!/usr/bin/env bash
set -euo pipefail

echo "=== AI CLI updater (codex / gemini / copilot) ==="

print_version() {
  local label="$1" pkg="$2" bin="$3"
  echo "[${label}]"
  if command -v "$bin" >/dev/null 2>&1; then
    "$bin" --version 2>/dev/null || true
  fi
  npm list -g --depth=0 "$pkg" 2>/dev/null | sed -n 's/.*── //p'
  echo
}

echo "Before:"
print_version "codex" "@openai/codex" "codex"
print_version "gemini" "@google/gemini-cli" "gemini"
print_version "copilot" "@github/copilot" "copilot"

echo "Updating via npm..."
npm install -g @openai/codex @google/gemini-cli @github/copilot

echo
echo "After:"
print_version "codex" "@openai/codex" "codex"
print_version "gemini" "@google/gemini-cli" "gemini"
print_version "copilot" "@github/copilot" "copilot"

echo "Done."
