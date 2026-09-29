#!/bin/bash
# Rebuild and restart UzMedAtlas. Never seeds (seed can wipe/overwrite data).
set -euo pipefail
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

ROOT="${UZMED_ROOT:-$HOME/uzmedatlas}"
BIN="${UZMED_BIN:-$HOME/uzmedatlas-bin}"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "missing $ROOT/.env" >&2
  exit 1
fi

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"

mkdir -p "$ROOT/server/public/uploads" "$ROOT/server/public/clinics" "$ROOT/server/prisma"
cp "$ROOT/.env" "$ROOT/server/.env"

npm install --prefix server
npm install --prefix client
(cd "$ROOT/server" && npx prisma generate --schema prisma/schema.prisma && npx prisma db push --schema prisma/schema.prisma)
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$ROOT/server/prisma/dev.db" ]; then
  sqlite3 "$ROOT/server/prisma/dev.db" "UPDATE Clinic SET status='published' WHERE published=1 AND IFNULL(status,'') != 'published';" || true
fi
npm run build --prefix client
npm run build --prefix server

mkdir -p "$ROOT/scripts"
if [ -f "$BIN/start.sh" ]; then
  cp "$BIN/start.sh" "$ROOT/scripts/start.sh"
fi
chmod +x "$ROOT/scripts/start.sh"
bash "$ROOT/scripts/start.sh"
