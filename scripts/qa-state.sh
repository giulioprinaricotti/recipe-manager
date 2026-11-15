#!/usr/bin/env bash
# Bring the LOCAL environment to a repeatable QA state in one command.
#
#   bash scripts/qa-state.sh              # all steps: db, user, menu, server, list
#   bash scripts/qa-state.sh --to menu    # stop after a step (db|user|menu|server|list)
#   bash scripts/qa-state.sh --stop       # stop the dev server and the QA database
#
# Steps:
#   db      throwaway Postgres in Docker (container recipe-manager-qa-db, port 54329),
#           schema pushed from prisma/schema.prisma. Never touches the .env database.
#   user    QA user qa@dueforchette.test / qa-password-local + three recipes
#   menu    this week's menu with the three recipes
#   server  `next dev` on port 3100 against the QA database (log in .qa/dev.log)
#   list    signs in with curl, checks the week page, prints the shopping list
#           that Bring! would import (GET /api/meal-plans/<week>/schema)
#
# Re-running resets the QA user (the database and server are reused).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QA_DIR="$ROOT/.qa"
CONTAINER=recipe-manager-qa-db
DB_PORT=54329
APP_PORT=3100
BASE="http://localhost:$APP_PORT"
EMAIL=qa@dueforchette.test
PASSWORD=qa-password-local
STEPS=(db user menu server list)

usage() { sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }

TO=list
case "${1:-}" in
  "") ;;
  --to) [[ -n "${2:-}" && " ${STEPS[*]} " == *" $2 "* ]] || usage; TO=$2 ;;
  --stop)
    pkill -f "next dev -p $APP_PORT" 2>/dev/null || true
    for _ in $(seq 1 10); do lsof -ti tcp:$APP_PORT -sTCP:LISTEN >/dev/null || break; sleep 1; done
    lsof -ti tcp:$APP_PORT -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
    rm -f "$QA_DIR/dev.pid"
    docker rm -f $CONTAINER >/dev/null 2>&1 || true
    echo "stopped: dev server :$APP_PORT, container $CONTAINER"
    exit 0 ;;
  *) usage ;;
esac

# Everything below runs against the QA database only. Next.js and dotenv never
# override variables already set in the environment, so .env is not used for these.
export DATABASE_URL="postgresql://postgres:qa@localhost:$DB_PORT/recipes_qa"
export DIRECT_URL="$DATABASE_URL"
export NEXTAUTH_URL="$BASE" AUTH_URL="$BASE" AUTH_TRUST_HOST=true
export NEXTAUTH_SECRET=qa-local-secret-not-for-production AUTH_SECRET=qa-local-secret-not-for-production
mkdir -p "$QA_DIR"

runs() { # runs <step>: true while <step> is at or before --to
  local s; for s in "${STEPS[@]}"; do [[ $s == "$1" ]] && return 0; [[ $s == "$TO" ]] && return 1; done
}

if runs db; then
  if [[ -z "$(docker ps -q -f name=^$CONTAINER$)" ]]; then
    docker rm -f $CONTAINER >/dev/null 2>&1 || true
    docker run -d --name $CONTAINER -e POSTGRES_PASSWORD=qa -e POSTGRES_DB=recipes_qa \
      -p 127.0.0.1:$DB_PORT:5432 postgres:16-alpine >/dev/null
  fi
  for _ in $(seq 1 30); do docker exec $CONTAINER pg_isready -q -U postgres && break; sleep 1; done
  (cd "$ROOT" && npx prisma db push >"$QA_DIR/db-push.log" 2>&1) || { tail -5 "$QA_DIR/db-push.log"; exit 1; }
  echo "db      ok  postgres :$DB_PORT (container $CONTAINER)"
fi

if runs user && ! runs menu; then
  echo "user    ok  $(cd "$ROOT" && npx tsx scripts/qa-seed.ts user)"
elif runs menu; then
  SEED=$(cd "$ROOT" && npx tsx scripts/qa-seed.ts menu | tr '\n' ' ')
  USER_ID=$(sed -E 's/^user=([^ ]+).*/\1/' <<<"$SEED")
  echo "menu    ok  $SEED"
fi

if runs server; then
  if ! curl -sf -o /dev/null "$BASE/login"; then
    if lsof -ti tcp:$APP_PORT -sTCP:LISTEN >/dev/null; then
      echo "server  FAIL port $APP_PORT busy with another process"; exit 1
    fi
    # Fully detached (no inherited stdin/stdout), so callers piping our output don't hang.
    (cd "$ROOT" && nohup npx next dev -p $APP_PORT </dev/null >"$QA_DIR/dev.log" 2>&1 & echo $! >"$QA_DIR/dev.pid") </dev/null >/dev/null 2>&1
    for _ in $(seq 1 90); do curl -sf -o /dev/null "$BASE/login" && break; sleep 1; done
    curl -sf -o /dev/null "$BASE/login" || { echo "server  FAIL see .qa/dev.log"; tail -5 "$QA_DIR/dev.log"; exit 1; }
  fi
  echo "server  ok  $BASE (stop: bash scripts/qa-state.sh --stop)"
fi

if runs list; then
  JAR="$QA_DIR/cookies.txt"; rm -f "$JAR"
  CSRF=$(curl -s -c "$JAR" "$BASE/api/auth/csrf" | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
  curl -s -b "$JAR" -c "$JAR" -o /dev/null -X POST "$BASE/api/auth/callback/credentials" \
    --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASSWORD" --data-urlencode "callbackUrl=$BASE/meal-plans"
  grep -q "session-token" "$JAR" || { echo "login   FAIL no session cookie"; exit 1; }
  WEEK=$(cd "$ROOT" && npx tsx -e 'import {getWeekStart,toWeekId} from "./src/lib/weeks"; console.log(toWeekId(getWeekStart(new Date())))')
  PAGE=$(curl -s -b "$JAR" "$BASE/meal-plans/$WEEK")
  SEEN=0; for t in "Spaghetti al pomodoro" "Shakshuka" "Frittata di zucchine"; do
    [[ $PAGE == *"$t"* ]] && SEEN=$((SEEN + 1)); done
  echo "login   ok  $EMAIL / $PASSWORD"
  echo "week    $BASE/meal-plans/$WEEK  recipes on page: $SEEN/3"
  LIST=$(curl -s "$BASE/api/meal-plans/$WEEK/schema?userId=$USER_ID" \
    | sed -nE 's/.*"recipeIngredient":\[([^]]*)\].*/\1/p' | tr ',' '\n' | tr -d '"')
  echo "list    $(printf '%s\n' "$LIST" | grep -c . ) lines (what Bring! imports):"
  printf '%s\n' "$LIST" | head -20 | sed 's/^/        /'
  [[ $SEEN -eq 3 && -n "$LIST" ]] || { echo "list    FAIL"; exit 1; }
fi
