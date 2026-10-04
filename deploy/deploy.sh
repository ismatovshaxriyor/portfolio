#!/bin/sh
# Ships the API and the main site to the server and restarts the stack.
#   deploy/deploy.sh [ssh-host]        (default: main_bots_server)
# The server keeps its own /root/portfolio/.env (secrets), which is never synced.
set -eu
HOST=${1:-main_bots_server}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

(cd "$ROOT/fronted" && npm run build)
rsync -az --delete --exclude-from="$ROOT/.dockerignore" "$ROOT/" "$HOST:/root/portfolio/app/"
# Hashed assets are not deleted: a visitor mid-session may still load an old chunk.
rsync -az "$ROOT/fronted/dist/" "$HOST:/root/portfolio/sites/main/"
rsync -az "$ROOT/deploy/docker-compose.yml" "$HOST:/root/portfolio/"
rsync -az --delete "$ROOT/deploy/nginx/" "$HOST:/root/portfolio/nginx/"
# chmod: nginx workers are not root, and files from this (iCloud) checkout are
# often 700/600 (macOS's openrsync has no --chmod).
ssh "$HOST" 'cd /root/portfolio && chmod -R u=rwX,go=rX sites nginx && docker compose up -d --build && docker compose exec -T nginx nginx -s reload'
