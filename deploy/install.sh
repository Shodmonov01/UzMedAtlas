#!/usr/bin/env bash
# One-time install, run as the existing application user. Keeps its other cron jobs.
set -Eeuo pipefail
umask 077
APP=$(readlink -f "${UZMED_ROOT:-$HOME/uzmedatlas}")
SRC=$(readlink -f "${UZMED_SRC:-$HOME/uzmedatlas-src}")
STATE="${UZMED_DEPLOY_STATE:-$HOME/uzmedatlas-autodeploy}"
BIN="$HOME/uzmedatlas-bin"
mkdir -p "$STATE/shared/client-env" "$STATE/releases" "$STATE/backups" "$BIN"
exec 9>"$STATE/deploy.lock"
flock -n 9
if [ ! -L "$STATE/current" ]; then
  test -d "$APP/server" && test ! -L "$APP/server"
  test -d "$APP/client" && test ! -L "$APP/client"
  LEGACY="$STATE/legacy-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir "$LEGACY"
  # Resolve before moving the directories; never print environment values.
  node --env-file="$APP/server/.env" --input-type=module - "$APP" "$LEGACY" "$STATE" <<'NODE'
import fs from 'node:fs'; import path from 'node:path';
const [app,legacy,state]=process.argv.slice(2);
const url=process.env.DATABASE_URL;
if(!url?.startsWith('file:')) throw Error('This installation expects SQLite');
const file=url.slice(5).split('?')[0];
let db=fs.realpathSync(path.resolve(app,'server/prisma',file));
if(db.startsWith(app+'/server/')) db=legacy+'/server/'+db.slice((app+'/server/').length);
fs.symlinkSync(db,state+'/shared/database.sqlite');
const env=fs.readFileSync(app+'/server/.env','utf8');
const updated=env.replace(/^\s*(?:export\s+)?DATABASE_URL\s*=.*$/m,'DATABASE_URL='+JSON.stringify('file:'+state+'/shared/database.sqlite'));
if(env===updated && !env.includes('file:'+state+'/shared/database.sqlite')) throw Error('DATABASE_URL entry not found');
fs.writeFileSync(state+'/shared/server.env',updated,{mode:0o600});
NODE
  for file in "$APP/client/.env" "$APP/client/.env.local" "$APP/client/.env.production" "$APP/client/.env.production.local"; do
    [ ! -f "$file" ] || cp -p "$file" "$STATE/shared/client-env/"
  done
  # The initial legacy release is the first rollback target and holds shared data.
  ln -s "$LEGACY" "$STATE/current"
  mv "$APP/server" "$LEGACY/server"
  ln -s "$STATE/current/server" "$APP/server"
  mv "$APP/client" "$LEGACY/client"
  ln -s "$STATE/current/client" "$APP/client"
  ln -s "$LEGACY/server/public" "$STATE/shared/public"
fi
install -m 700 "$(dirname "$0")/watch-main.sh" "$BIN/autodeploy-main.sh"
CRON=$(mktemp)
trap 'rm -f "$CRON"' EXIT
crontab -l 2>/dev/null | grep -v '# uzmedatlas-autodeploy$' > "$CRON" || true
printf '* * * * * timeout 1300 bash %s/autodeploy-main.sh >> %s/deploy.log 2>&1 # uzmedatlas-autodeploy\n' "$BIN" "$STATE" >> "$CRON"
crontab "$CRON"
printf 'Installed main autodeploy (every minute), state: %s\n' "$STATE"
