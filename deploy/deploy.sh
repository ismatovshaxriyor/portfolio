#!/bin/sh
# Ships the API and the main site to the server and restarts the stack.
#   deploy/deploy.sh [ssh-host]        (default: main_bots_server)
# The server keeps its own /root/portfolio/.env (secrets), which is never synced.
set -eu
HOST=${1:-main_bots_server}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

rsync -az --delete --exclude-from="$ROOT/.dockerignore" "$ROOT/" "$HOST:/root/portfolio/app/"
# The frontend is built on the server, in a node container: npm in this iCloud
# checkout stalls on evicted node_modules files. Hashed assets in sites/main
# are not deleted, since a visitor mid-session may still load an old chunk.
ssh "$HOST" 'mkdir -p /root/portfolio/build/fronted'
rsync -az --delete --exclude node_modules --exclude dist --exclude .vite-cache \
  "$ROOT/fronted/" "$HOST:/root/portfolio/build/fronted/"
ssh "$HOST" 'cd /root/portfolio/build/fronted && docker run --rm -v "$PWD":/app -w /app node:20-alpine \
  sh -c "npm ci --no-audit --no-fund --loglevel=error && npm run build" && cp -a dist/. ../../sites/main/'
rsync -az "$ROOT/deploy/docker-compose.yml" "$HOST:/root/portfolio/"
rsync -az --delete "$ROOT/deploy/nginx/" "$HOST:/root/portfolio/nginx/"
# chmod: nginx workers are not root, and files from this (iCloud) checkout are
# often 700/600 (macOS's openrsync has no --chmod).
ssh "$HOST" 'cd /root/portfolio && chmod -R u=rwX,go=rX sites nginx && docker compose up -d --build && docker compose exec -T nginx nginx -s reload'
