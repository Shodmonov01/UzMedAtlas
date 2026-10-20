# Production deployment

`main` is the production branch. The version before the navy/mint redesign is
preserved on GitHub as `codex/legacy-v1-before-redesign` (commit `d1acd39`).

The existing application user checks GitHub every minute using cron. There are
no SSH passwords or GitHub tokens in these scripts. Git uses the server's existing
repository access; systemd restarts use the existing restricted sudo permission.

`deploy/install.sh` installs `deploy/watch-main.sh` as
`~/uzmedatlas-bin/autodeploy-main.sh`. It preserves other cron jobs. The watcher
fetches only `main`, holds a lock against simultaneous runs, and executes the
deployment script from the exact fetched commit. An unchanged commit does nothing.
Failures retry after five minutes; a new commit is attempted on the next check.

Each release is built separately under `~/uzmedatlas-autodeploy/releases/` with
locked dependencies, Prisma generation, frontend/backend tests and both builds.
A private candidate server checks API, catalog and bundles before activation;
it does not start the Telegram delivery worker. Activation switches one symlink
and restarts `uzmedatlas.service`. The same checks then run locally and over HTTPS.
Any failed activation switches back to the previous release and restarts it.

`.env`, uploads, clinic media and SQLite remain shared between releases. A consistent
SQLite backup is made before activation. Production is never seeded and deployment
never runs `prisma db push`. Schema changes stop deployment until a reviewed migration
has been applied and the currently deployed schema baseline has been updated.
Database backups are for deliberate recovery; rollback never replaces live data.
Older hashed frontend bundles remain available for already-open browser sessions.

Operational commands (as `rakhimovd`):

```sh
cat ~/uzmedatlas-autodeploy/status.json
tail -100 ~/uzmedatlas-autodeploy/deploy.log
bash ~/uzmedatlas-bin/autodeploy-main.sh --force
crontab -l
```

The deployed commit is public at `https://uzmedguide.uz/version.json`.
Previous release paths are recorded in each backup's `previous-release` file.
The initial `legacy-*` directory holds shared data and must be retained.
The latest three built releases and seven database backups are retained; the
current release, immediate rollback target and initial legacy data are preserved.
Logs rotate after 5 MB. Monitor disk space if the database or media grows.
