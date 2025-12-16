#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$REPO_ROOT/.devcontainer/config"
APPEND_DIR="$CONFIG_DIR/append"
REPLACE_DIR="$CONFIG_DIR/replace"

append_config() {
  local source_file="$1"
  local target="$2"
  local relative_path="$3"
  local sentinel_begin="# >>> devcontainer config begin: $relative_path"
  local sentinel_end="# <<< devcontainer config end: $relative_path"

  mkdir -p "$(dirname "$target")"
  touch "$target"

  local tmp
  tmp="$(mktemp)"

  awk -v begin="$sentinel_begin" -v end="$sentinel_end" '
    $0 == begin {inside=1; next}
    $0 == end {inside=0; next}
    !inside {print}
  ' "$target" > "$tmp"

  if [ -s "$tmp" ] && [ "$(tail -c 1 "$tmp" 2>/dev/null || echo)" != $'\n' ]; then
    echo >> "$tmp"
  fi

  {
    echo "$sentinel_begin"
    cat "$source_file"
    echo "$sentinel_end"
  } >> "$tmp"

  mv "$tmp" "$target"
}

replace_config() {
  local source_file="$1"
  local target="$2"

  mkdir -p "$(dirname "$target")"

  if [ -f "$target" ] && cmp -s "$source_file" "$target"; then
    return
  fi

  cp "$source_file" "$target"
}

process_append_configs() {
  [ -d "$APPEND_DIR" ] || return

  find "$APPEND_DIR" -type f ! -name ".gitkeep" -print0 | while IFS= read -r -d '' source_file; do
    local relative_path="${source_file#"$APPEND_DIR/"}"
    local target="$HOME/$relative_path"

    append_config "$source_file" "$target" "$relative_path"
  done
}

process_replace_configs() {
  [ -d "$REPLACE_DIR" ] || return

  find "$REPLACE_DIR" -type f ! -name ".gitkeep" -print0 | while IFS= read -r -d '' source_file; do
    local relative_path="${source_file#"$REPLACE_DIR/"}"
    local target="$HOME/$relative_path"

    replace_config "$source_file" "$target"
  done
}

main() {
  process_replace_configs
  process_append_configs
}

main
