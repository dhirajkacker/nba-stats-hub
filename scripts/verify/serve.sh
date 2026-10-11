#!/usr/bin/env bash
# Start `next start` on a port, replacing whatever is listening there, and
# confirm the server is serving the build currently in .next/ (by build id).
# Usage: scripts/verify/serve.sh [port] [logfile]
set -euo pipefail
PORT="${1:-3100}"
LOG="${2:-/tmp/next-serve-$PORT.log}"
cd "$(dirname "$0")/../.."

# Free the port. `next start` runs as a process named next-server, so match
# on the listening socket rather than the command line.
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null || true
  for _ in $(seq 1 20); do
    lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break
    sleep 0.5
  done
fi
if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is still in use" >&2
  exit 1
fi

BUILD_ID="$(cat .next/BUILD_ID)"
PORT="$PORT" nohup npm run start >"$LOG" 2>&1 &

for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "http://localhost:$PORT/_next/static/$BUILD_ID/_buildManifest.js"; then
    echo "Serving build $BUILD_ID on port $PORT"
    exit 0
  fi
  sleep 0.5
done
echo "Server on port $PORT is not serving build $BUILD_ID (see $LOG)" >&2
exit 1
