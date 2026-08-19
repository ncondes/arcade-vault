#!/usr/bin/env bash
# PostToolUse (Write|Edit): formatea con Prettier y aplica autofixes de ESLint
# al archivo recién tocado. Sale con 2 si ESLint deja errores, para que Claude los vea.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
file="$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')"

[ -n "$file" ] && [ -f "$file" ] || exit 0

# Solo archivos dentro del proyecto, y nunca dentro de artefactos/dependencias.
case "$file" in
  "$ROOT"/node_modules/* | "$ROOT"/.next/* | "$ROOT"/references/*) exit 0 ;;
  "$ROOT"/*) ;;
  *) exit 0 ;;
esac

cd "$ROOT" || exit 0

# 1) Prettier: --ignore-unknown salta extensiones sin parser (.mp3, .ico, .env...)
./node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$file" >/dev/null 2>&1

# 2) ESLint: solo lo que ESLint entiende. Markdown/CSS/JSON se quedan con Prettier.
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
    # --max-warnings 0: en eslint-config-next reglas como no-unused-vars son "warning",
    # y sin esto ESLint saldría 0 y nunca las veríamos.
    out="$(./node_modules/.bin/eslint --fix --max-warnings 0 "$file" 2>&1)"
    status=$?
    if [ "$status" -ne 0 ]; then
      printf 'ESLint dejó problemas sin resolver en %s:\n%s\n' "$file" "$out" >&2
      exit 2
    fi
    ;;
esac

exit 0
