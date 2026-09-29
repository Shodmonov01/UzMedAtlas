#!/bin/bash
# Pull origin/main and restart UzMedAtlas on :8082.
# Cron: */2 * * * * bash $HOME/uzmedatlas-bin/watch-main.sh
set -euo pipefail

SRC="${UZMED_SRC:-$HOME/uzmedatlas-src}"
APP="${UZMED_ROOT:-$HOME/uzmedatlas}"
BIN="${UZMED_BIN:-$HOME/uzmedatlas-bin}"
REPO="${UZMED_REPO:-https://github.com/Shodmonov01/UzMedAtlas.git}"
LOG="${UZMED_WATCH_LOG:-$HOME/uzmedatlas/watch.log}"

mkdir -p "$(dirname "$LOG")" "$APP"
exec >>"$LOG" 2>&1

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if [ ! -d "$SRC/.git" ]; then
  git clone --branch main --single-branch "$REPO" "$SRC"
fi

cd "$SRC"
git fetch origin main
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "$(date -Is) deploy $LOCAL -> $REMOTE"
git reset --hard origin/main

if [ ! -d "$SRC/server" ] || [ ! -d "$SRC/client" ] || [ ! -f "$SRC/server/package.json" ]; then
  echo "$(date -Is) skip: missing client/server layout"
  exit 0
fi

mkdir -p \
  "$APP/server/public/uploads" \
  "$APP/server/public/clinics" \
  "$APP/server/prisma" \
  "$APP/scripts"

# Keep live SQLite when migrating from old Express tree
if [ -f "$APP/back/prisma/dev.db" ] && [ ! -f "$APP/server/prisma/dev.db" ]; then
  cp "$APP/back/prisma/dev.db" "$APP/server/prisma/dev.db"
fi
if [ -f "$APP/prisma/dev.db" ] && [ ! -f "$APP/server/prisma/dev.db" ]; then
  cp "$APP/prisma/dev.db" "$APP/server/prisma/dev.db"
fi

rsync -a --delete \
  --exclude node_modules \
  --exclude client/node_modules \
  --exclude server/node_modules \
  --exclude client/dist \
  --exclude server/dist \
  --exclude .env \
  --exclude "*.db" \
  --exclude server/public/uploads \
  --exclude server/public/clinics \
  --exclude watch.log \
  --exclude app.log \
  --exclude app.pid \
  --exclude back \
  --exclude front \
  --exclude .next \
  "$SRC/" "$APP/"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
cd "$APP"
if [ ! -f .env ]; then
  echo "missing $APP/.env" >&2
  exit 1
fi
cp "$APP/.env" "$APP/server/.env"

npm install --prefix server
npm install --prefix client
(cd "$APP/server" && npx prisma generate --schema prisma/schema.prisma && npx prisma db push --schema prisma/schema.prisma)
# Keep previously published clinics visible after status column is added
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$APP/server/prisma/dev.db" ]; then
  sqlite3 "$APP/server/prisma/dev.db" "UPDATE Clinic SET status='published' WHERE published=1 AND IFNULL(status,'') != 'published';" || true
fi
npm run build --prefix client
npm run build --prefix server

if [ -f "$BIN/start.sh" ]; then
  cp "$BIN/start.sh" "$APP/scripts/start.sh"
fi
chmod +x "$APP/scripts/start.sh"
bash "$APP/scripts/start.sh"
echo "$(date -Is) done"
