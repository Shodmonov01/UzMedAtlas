#!/usr/bin/env bash
# Installed once in ~/uzmedatlas-bin; no credentials and no worktree resets.
set -Eeuo pipefail
umask 077
STATE="${UZMED_DEPLOY_STATE:-$HOME/uzmedatlas-autodeploy}"
SRC="${UZMED_SRC:-$HOME/uzmedatlas-src}"
mkdir -p "$STATE"
exec 9>"$STATE/deploy.lock"
flock -n 9 || exit 0
if [ -f "$STATE/deploy.log" ] && [ "$(stat -c %s "$STATE/deploy.log")" -gt 5242880 ]; then
  mv -f "$STATE/deploy.log" "$STATE/deploy.log.1"
fi
export GIT_TERMINAL_PROMPT=0
git -C "$SRC" fetch --quiet origin refs/heads/main:refs/remotes/origin/main
TARGET=$(git -C "$SRC" rev-parse origin/main)
[[ "$TARGET" =~ ^[a-f0-9]{40}$ ]]
CURRENT=$(readlink -f "$STATE/current")
if [ -f "$CURRENT/.release-commit" ] && [ "$(cat "$CURRENT/.release-commit")" = "$TARGET" ] && [ "${1:-}" != --force ]; then
  exit 0
fi
# Back off five minutes after a failure; new commits are attempted immediately.
if [ "${1:-}" != --force ] && [ -f "$STATE/failed-commit" ] && [ "$(cat "$STATE/failed-commit")" = "$TARGET" ]; then
  [ "$(( $(date +%s) - $(stat -c %Y "$STATE/failed-commit") ))" -ge 300 ] || exit 0
fi
CONTROL="$STATE/controller/$TARGET"
mkdir -p "$CONTROL"
git -C "$SRC" archive "$TARGET" deploy | tar -x -C "$CONTROL"
printf '%s deploy main %s\n' "$(date -Is)" "$TARGET"
export UZMED_DEPLOY_STATE="$STATE" UZMED_SRC="$SRC"
if timeout 1200 bash "$CONTROL/deploy/release.sh" "$TARGET"; then
  rm -f "$STATE/failed-commit"
else
  code=$?
  printf '%s\n' "$TARGET" > "$STATE/failed-commit"
  printf '%s DEPLOY_FAILED %s exit=%s (previous release retained)\n' "$(date -Is)" "$TARGET" "$code" >&2
  exit "$code"
fi
