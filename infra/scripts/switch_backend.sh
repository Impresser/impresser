#!/usr/bin/env bash
set -euo pipefail

NGINX_CONT="${NGINX_CONT:-nginx}"
CONF_DIR="${CONF_DIR:-/opt/impresser/infra/nginx/conf.d}"
LINK="${LINK:-${CONF_DIR}/upstream.backend.prod.conf}"

BLUE="upstream.backend.prod.blue.conf"
GREEN="upstream.backend.prod.green.conf"

CUR=$(readlink -f "$LINK" || true)
if echo "${CUR:-}" | grep -q "blue"; then
  NEXT="$GREEN"; SLOT="green"
else
  NEXT="$BLUE";  SLOT="blue"
fi

ln -sfn "$NEXT" "$LINK"

docker exec "$NGINX_CONT" nginx -t
docker exec "$NGINX_CONT" nginx -s reload

echo "[switch:prod] active slot -> $SLOT"