#!/usr/bin/env bash
# Runs Cypress against a production build like CI does, without touching the dev server's .next:
# the build goes to .next-cypress and `next start` listens on its own port.
#
#   scripts/cypress-prod.sh [--build-only] [cypress run args, e.g. --spec cypress/e2e/foo.cy.ts]
#
# CYPRESS_PORT (default 3100) is where the production server listens. An existing complete build is reused;
# set REBUILD=1 after changing app code, or the tests run against the old build.
set -euo pipefail
cd "$(dirname "$0")/.."

port="${CYPRESS_PORT:-3100}"
startup_timeout_s=120
export NEXT_DIST_DIR=.next-cypress TEST_RUNNER=true NEXT_PUBLIC_TEST_RUNNER=true

build_only=false
if [ "${1:-}" = "--build-only" ]; then
    build_only=true
    shift
fi

restore_tracked_files() {
    cp "$backup"/tsconfig.json "$backup"/next-env.d.ts .
    rm -rf "$backup"
}

build() {
    # next build points tsconfig.json and next-env.d.ts at the dist dir's types; keep the tracked files as they were
    backup="$(mktemp -d)"
    cp tsconfig.json next-env.d.ts "$backup"
    trap restore_tracked_files EXIT
    rm -rf "$NEXT_DIST_DIR"
    node next.mjs build
    trap - EXIT
    restore_tracked_files
}

fail_startup() {
    echo "$1" >&2
    cat "$NEXT_DIST_DIR/server.log" >&2 || true
    exit 1
}

wait_for_server() {
    local waited=0
    until curl -fs -o /dev/null "http://localhost:$port"; do
        kill -0 "$server" 2>/dev/null || fail_startup "next start exited before it answered"
        [ "$waited" -lt "$startup_timeout_s" ] || fail_startup "next start did not answer within ${startup_timeout_s}s"
        sleep 1
        waited=$((waited + 1))
    done
}

# a build that failed or was interrupted leaves the folder without BUILD_ID
if [ -n "${REBUILD:-}" ] || [ ! -f "$NEXT_DIST_DIR/BUILD_ID" ]; then
    build
fi
if [ "$build_only" = true ]; then
    exit 0
fi

# otherwise curl would get its answer from whatever already holds the port and Cypress would test that server
if curl -fs -o /dev/null "http://localhost:$port"; then
    echo "Port $port is already in use; stop that server or set CYPRESS_PORT" >&2
    exit 1
fi

node next.mjs start -p "$port" > "$NEXT_DIST_DIR/server.log" 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT  # replaces the build's trap, which already ran
wait_for_server

env -u ELECTRON_RUN_AS_NODE npx cypress run --config "baseUrl=http://localhost:$port" "$@"
