#!/usr/bin/env bash
set -euo pipefail

NGINX_CONT="${NGINX_CONT:-nginx}"
CONF_DIR_IN_CONT="/etc/nginx/conf.d"
LINK_NAME="upstream.backend.prod.conf"

# 강제 타겟 지정 (blue|green). 미지정 시 현재 링크 반대로 토글
TARGET="${TARGET:-}"

docker exec "${NGINX_CONT}" /bin/sh -lc "
set -eu

CONF_DIR='${CONF_DIR_IN_CONT}'
LINK_NAME='${LINK_NAME}'
TARGET_ENV='${TARGET}'

cd \"\${CONF_DIR}\"

# 현재 심볼릭 링크 대상 파악 (없으면 빈 문자열)
CUR_LINK_TARGET=\$(readlink \"\${LINK_NAME}\" 2>/dev/null || true)

# 전환 대상 결정: TARGET_ENV가 있으면 그대로, 없으면 blue/green 토글
if [ -n \"\${TARGET_ENV}\" ]; then
  case \"\${TARGET_ENV}\" in
    blue|green) TARGET=\"\${TARGET_ENV}\" ;;
    *) echo '[ERR] TARGET must be blue|green' >&2; exit 1 ;;
  esac
else
  case \"\${CUR_LINK_TARGET}\" in
    *blue*) TARGET='green' ;;
    *)      TARGET='blue'  ;;
  esac
fi

NEW_FILE=\"upstream.backend.prod.\${TARGET}.conf\"
if [ ! -f \"\${NEW_FILE}\" ]; then
  echo \"[ERR] not found: \${CONF_DIR}/\${NEW_FILE}\" >&2
  exit 1
fi

echo \"[INFO] switching to \${NEW_FILE}\"

# 롤백 대비 이전 대상 보관
PREV_REAL=''
if [ -n \"\${CUR_LINK_TARGET}\" ] && [ -f \"\${CUR_LINK_TARGET}\" ]; then
  PREV_REAL=\"\${CUR_LINK_TARGET}\"
fi

# 새 링크로 교체
ln -sfn \"\${NEW_FILE}\" \"\${LINK_NAME}\"

# 설정 검증
if ! nginx -t; then
  echo '[ERR] nginx -t failed. rollback...' >&2
  if [ -n \"\${PREV_REAL}\" ]; then
    ln -sfn \"\${PREV_REAL}\" \"\${LINK_NAME}\"
    nginx -t || true
  fi
  exit 1
fi

# 정상 적용
nginx -s reload
echo \"[OK] switched to \${NEW_FILE} and reloaded.\"
"
