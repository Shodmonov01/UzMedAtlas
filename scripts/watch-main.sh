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

if [ ! -f "$SRC/package.json" ] || ! grep -q '"name": "uzmedatlas"' "$SRC/package.json"; then
  echo "$(date -Is) skip: not uzmedatlas"
  exit 0
fi

mkdir -p "$APP/public/uploads" "$APP/scripts" "$APP/prisma" "$APP/back/prisma" "$APP/back/public/uploads"
# keep the live SQLite if we are moving from the old Next.js tree
if [ -f "$APP/prisma/dev.db" ] && [ ! -f "$APP/back/prisma/dev.db" ]; then
  cp "$APP/prisma/dev.db" "$APP/back/prisma/dev.db"
fi

rsync -a --delete \
  --exclude node_modules \
  --exclude front/node_modules \
  --exclude back/node_modules \
  --exclude front/dist \
  --exclude .env \
  --exclude .next \
  --exclude "*.db" \
  --exclude public/uploads \
  --exclude back/public/uploads \
  --exclude watch.log \
  --exclude app.log \
  --exclude app.pid \
  "$SRC/" "$APP/"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
cd "$APP"
if [ ! -f .env ]; then
  echo "missing $APP/.env" >&2
  exit 1
fi
cp "$APP/.env" "$APP/back/.env"

if [ -d "$APP/front" ] && [ -d "$APP/back" ]; then
  npm install --prefix back
  npm install --prefix front
  (cd "$APP/back" && npx prisma generate && npx prisma db push)
  npm run build --prefix front
else
  npm install
  npx prisma generate
  npx prisma db push
  npm run build
fi

mkdir -p "$APP/scripts"
if [ -f "$BIN/start.sh" ]; then
  cp "$BIN/start.sh" "$APP/scripts/start.sh"
elif [ -f "$APP/scripts/start.sh" ]; then
  true
fi
chmod +x "$APP/scripts/start.sh"
bash "$APP/scripts/start.sh"
echo "$(date -Is) done"
