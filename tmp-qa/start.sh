#!/bin/bash
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
  mkdir -p "$ROOT/server"
  cp "$ROOT/.env" "$ROOT/server/.env"
fi

mkdir -p "$ROOT/server/public/uploads" "$ROOT/server/public/clinics"

if [ -f "$ROOT/app.pid" ]; then
  old="$(cat "$ROOT/app.pid" 2>/dev/null || true)"
  if [ -n "${old:-}" ]; then
    kill "$old" 2>/dev/null || true
    pkill -P "$old" 2>/dev/null || true
  fi
  rm -f "$ROOT/app.pid"
fi
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi
sleep 1

cd "$ROOT/server"
NODE_BIN="$(command -v node)"
nohup setsid "$NODE_BIN" --env-file-if-exists=.env --import tsx src/main.ts >> "$ROOT/app.log" 2>&1 < /dev/null &
echo $! > "$ROOT/app.pid"
sleep 2
if ! kill -0 "$(cat "$ROOT/app.pid")" 2>/dev/null; then
  echo "failed to start" >&2
  tail -n 40 "$ROOT/app.log" >&2
  exit 1
fi
if ! ss -tln | grep -q ":${PORT} "; then
  echo "port ${PORT} not listening" >&2
  tail -n 40 "$ROOT/app.log" >&2
  exit 1
fi
echo "started pid=$(cat "$ROOT/app.pid") port=$PORT"
