#!/usr/bin/env bash
# Deploy csot-site to production (Azure VM behind csot.devclub.in).
#
# Prerequisites:
#   - SSH alias "csot-vm" configured (see AGENTS.md)
#   - sudo on the VM for cp/chown/systemctl
#
# Usage: ./deploy.sh

set -euo pipefail

SSH_HOST="${CSOT_DEPLOY_HOST:-csot-vm}"
REMOTE_SYNC_DIR="/tmp/csot-sync"
REMOTE_APP_DIR="/opt/csot-site"
APP_USER="csot-site"
SITE_URL="${CSOT_SITE_URL:-https://csot.devclub.in}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "→ Syncing to ${SSH_HOST}:${REMOTE_SYNC_DIR}/"
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude .env.local \
  --exclude .env \
  ./ "${SSH_HOST}:${REMOTE_SYNC_DIR}/"

echo "→ Building and restarting on ${SSH_HOST}"
ssh "${SSH_HOST}" "sudo cp -a ${REMOTE_SYNC_DIR}/. ${REMOTE_APP_DIR}/ \
  && sudo chown -R ${APP_USER}:${APP_USER} ${REMOTE_APP_DIR} \
  && sudo -u ${APP_USER} bash -c 'cd ${REMOTE_APP_DIR} && set -a && source /etc/csot-site/env && set +a && npm install --include=dev && npm run build' \
  && sudo systemctl restart csot-site \
  && systemctl is-active csot-site"

echo "→ Spot-checking ${SITE_URL}"
max_attempts=15
attempt=1
until curl -sf -o /dev/null "${SITE_URL}"; do
  if (( attempt >= max_attempts )); then
    echo "✗ ${SITE_URL} check failed after ${max_attempts} attempts"
    exit 1
  fi
  sleep 2
  (( attempt++ ))
done
echo "✓ ${SITE_URL} is up"

echo "Deploy complete."
