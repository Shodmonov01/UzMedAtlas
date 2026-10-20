#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
STATE="${UZMED_DEPLOY_STATE:-$HOME/uzmedatlas-autodeploy}"
SRC="${UZMED_SRC:-$HOME/uzmedatlas-src}"
TARGET=${1:?Expected commit SHA}
[[ "$TARGET" =~ ^[a-f0-9]{40}$ ]]
test "$(git -C "$SRC" rev-parse origin/main)" = "$TARGET"
PREVIOUS=$(readlink -f "$STATE/current")
test -d "$PREVIOUS/server"
RELEASE="$STATE/releases/$TARGET-$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="$STATE/backups/$(basename "$RELEASE")"
mkdir -p "$RELEASE" "$BACKUP"
activated=0
smoke_pid=
swap_current() {
  ln -sfn "$1" "$STATE/current.next"
  mv -Tf "$STATE/current.next" "$STATE/current"
}
finish() {
  code=$?
  trap - EXIT
  if [ -n "$smoke_pid" ]; then kill "$smoke_pid" 2>/dev/null || true; wait "$smoke_pid" 2>/dev/null || true; fi
  if [ "$code" -ne 0 ]; then
    if [ "$activated" = 1 ]; then
      echo "Restoring previous release: $PREVIOUS" >&2
      swap_current "$PREVIOUS"
      sudo -n systemctl restart uzmedatlas.service
      for attempt in $(seq 1 20); do
        if node "$RELEASE/deploy/verify.mjs" http://127.0.0.1:8082 > /dev/null 2>&1; then echo ROLLBACK_HEALTHY; break; fi
        sleep 1
      done
    fi
    printf '{"state":"failed","commit":"%s","at":"%s"}\n' "$TARGET" "$(date -u +%FT%TZ)" > "$STATE/status.json"
  fi
  exit "$code"
}
trap finish EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
git -C "$SRC" archive "$TARGET" | tar -x -C "$RELEASE"
export NODE_OPTIONS=--max-old-space-size=768
# A schema change needs an explicit reviewed migration, never db push or seed.
node --input-type=module - "$PREVIOUS/server/prisma/schema.prisma" "$RELEASE/server/prisma/schema.prisma" <<'NODE'
import fs from 'node:fs';
const normalized = file => fs.readFileSync(file, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\s/g, '');
if (normalized(process.argv[2]) !== normalized(process.argv[3])) throw Error('Database schema changed: apply a reviewed migration before deployment');
NODE
# Runtime configuration, media and the SQLite database belong to shared state.
for file in "$STATE/shared/client-env/"* "$STATE/shared/client-env/".[!.]*; do
  [ -f "$file" ] || continue
  ln -s "$file" "$RELEASE/client/$(basename "$file")"
done
(
  cd "$RELEASE/server"
  DATABASE_URL="file:$RELEASE/build-test.db" npm ci --no-audit --no-fund
  DATABASE_URL="file:$RELEASE/build-test.db" npm run prisma:generate
  DATABASE_URL="file:$RELEASE/build-test.db" npm test
  npm run build
)
(
  cd "$RELEASE/client"
  npm ci --no-audit --no-fund
  npm test
  npm run build
)
ln -s "$STATE/shared/server.env" "$RELEASE/server/.env"
ln -s "$STATE/shared/public" "$RELEASE/server/public"
# Leave bundles from open browser sessions available through the new release.
if [ -d "$PREVIOUS/client/dist/assets" ]; then
  cp -an "$PREVIOUS/client/dist/assets/." "$RELEASE/client/dist/assets/"
fi
printf '%s\n' "$TARGET" > "$RELEASE/.release-commit"
printf '{"branch":"main","commit":"%s","deployedAt":"%s"}\n' "$TARGET" "$(date -u +%FT%TZ)" > "$RELEASE/client/dist/version.json"
# Smoke check the candidate without starting the Telegram delivery worker.
(
  cd "$RELEASE/server"
  exec env NODE_ENV=production node --env-file=.env --import tsx --input-type=module -e 'import {buildApp} from "./src/app.ts"; const app=await buildApp({logger:false}); await app.listen({host:"127.0.0.1",port:18082});'
) > "$BACKUP/smoke.log" 2>&1 &
smoke_pid=$!
ready=0
for attempt in $(seq 1 30); do
  if node "$RELEASE/deploy/verify.mjs" http://127.0.0.1:18082 "$TARGET" > "$BACKUP/smoke-check.log" 2>&1; then ready=1; break; fi
  kill -0 "$smoke_pid" 2>/dev/null || break
  sleep 1
done
test "$ready" = 1
kill "$smoke_pid"; wait "$smoke_pid" || true; smoke_pid=
# SQLite's online backup includes WAL transactions and does not interrupt writes.
python3 - "$STATE/shared/database.sqlite" "$BACKUP/database.sqlite" <<'PY'
import sqlite3, sys
with sqlite3.connect('file:' + sys.argv[1] + '?mode=ro', uri=True) as source:
    with sqlite3.connect(sys.argv[2]) as target:
        source.backup(target)
PY
printf '%s\n' "$PREVIOUS" > "$BACKUP/previous-release"
activated=1
swap_current "$RELEASE"
sudo -n systemctl restart uzmedatlas.service
ready=0
for attempt in $(seq 1 30); do
  if node "$RELEASE/deploy/verify.mjs" http://127.0.0.1:8082 "$TARGET" > "$BACKUP/live-check.log" 2>&1; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
node "$RELEASE/deploy/verify.mjs" https://uzmedguide.uz "$TARGET"
printf '{"state":"healthy","branch":"main","commit":"%s","at":"%s"}\n' "$TARGET" "$(date -u +%FT%TZ)" > "$STATE/status.json"
printf '%s DEPLOY_HEALTHY %s\n' "$(date -Is)" "$TARGET"
# Keep three built releases (including the immediate rollback target) and seven
# database backups. Never remove the legacy directory containing shared data.
node --input-type=module - "$STATE" "$RELEASE" "$PREVIOUS" <<'NODE'
import fs from 'node:fs'; import path from 'node:path';
const [state,current,previous]=process.argv.slice(2);
for(const [kind,limit] of [['releases',3],['backups',7]]) {
  const root=path.resolve(state,kind);
  const entries=fs.readdirSync(root,{withFileTypes:true})
    .filter(e=>e.isDirectory() && /^[a-f0-9]{40}-\d{8}T\d{6}Z$/.test(e.name))
    .map(e=>path.join(root,e.name)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
  for(const candidate of entries.slice(limit)) {
    if(candidate===current || candidate===previous) continue;
    if(path.dirname(candidate)!==root || fs.lstatSync(candidate).isSymbolicLink()) throw Error('Invalid cleanup target');
    fs.rmSync(candidate,{recursive:true});
  }
}
NODE
