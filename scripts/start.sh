#!/bin/bash
# Start the split React + Express app on PORT (default 8082).
set -euo pipefail
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

ROOT="${UZMED_ROOT:-$HOME/uzmedatlas}"
cd "$ROOT"

PORT="${PORT:-8082}"
HOST="${HOST:-0.0.0.0}"
export PORT HOST

if [ -f "$ROOT/.env" ]; then
  mkdir -p "$ROOT/back"
  cp "$ROOT/.env" "$ROOT/back/.env"
fi

if [ -f "$ROOT/app.pid" ]; then
  kill "$(cat "$ROOT/app.pid")" 2>/dev/null || true
  rm -f "$ROOT/app.pid"
fi
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi
sleep 1

cd "$ROOT/back"
nohup npx tsx src/index.ts >> "$ROOT/app.log" 2>&1 &
echo $! > "$ROOT/app.pid"
echo "started pid=$(cat "$ROOT/app.pid") port=$PORT"
