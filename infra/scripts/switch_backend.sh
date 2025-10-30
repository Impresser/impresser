#!/usr/bin/env bash
set -euo pipefail

NGINX_CONT="${NGINX_CONT:-nginx}"
CONF_DIR_IN_CONT="/etc/nginx/conf.d"
LINK_NAME="upstream.backend.prod.conf"

docker exec "${NGINX_CONT}" /bin/sh -lc '
set -euo pipefail

CONF_DIR="'"${CONF_DIR_IN_CONT}"'"
LINK_NAME="'"${LINK_NAME}"'"

cd "${CONF_DIR}"

# 현재 심볼릭 링크/타겟 파악
CUR_LINK_TARGET="$(readlink "${LINK_NAME}" || true)"

# 전환 대상 결정: TARGET env가 있으면 그대로, 없으면 blue/green 토글
TARGET_ENV="'"${TARGET:-}"'"
if [ -n "${TARGET_ENV}" ]; then
  case "${TARGET_ENV}" in
    blue|green) TARGET="${TARGET_ENV}" ;;
    *) echo "[ERR] TARGET must be blue|green"; exit 1 ;;
  esac
else
  if echo "${CUR_LINK_TARGET}" | grep -q "blue"; then
    TARGET="green"
  else
    TARGET="blue"
  fi
fi

NEW_FILE="upstream.backend.prod.${TARGET}.conf"
if [ ! -f "${NEW_FILE}" ]; then
  echo "[ERR] not found: ${CONF_DIR}/${NEW_FILE}"
  exit 1
fi

echo "[INFO] switching to ${NEW_FILE}"

# 롤백 대비 이전 타겟 저장
PREV_REAL=""
if [ -n "${CUR_LINK_TARGET}" ] && [ -f "${CUR_LINK_TARGET}" ]; then
  PREV_REAL="${CUR_LINK_TARGET}"
fi

# 새로운 타겟으로 심볼릭 링크 갱신
ln -sfn "${NEW_FILE}" "${LINK_NAME}"

# 설정 테스트
if ! nginx -t; then
  echo "[ERR] nginx -t failed. rollback..."
  if [ -n "${PREV_REAL}" ]; then
    ln -sfn "${PREV_REAL}" "${LINK_NAME}"
    nginx -t || true
  fi
  exit 1
fi

# 정상 적용
nginx -s reload
echo "[OK] switched to ${NEW_FILE} and reloaded."
'
