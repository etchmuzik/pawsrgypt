#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
task_pg="$(mktemp -d /tmp/paws-controls-db.XXXXXX)"
trap 'pg_ctl -D "$task_pg/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$task_pg"' EXIT
initdb -D "$task_pg/data" --encoding=UTF8 --locale=C --auth=trust >/dev/null
pg_ctl -D "$task_pg/data" -l "$task_pg/postgres.log" -o "-k $task_pg -h '' -p 55474" -w start >/dev/null
psql -h "$task_pg" -p 55474 -U "$(id -un)" -d postgres -f "$task_root/tests/order-controls-db.sql"
