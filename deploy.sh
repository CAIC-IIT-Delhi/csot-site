#!/usr/bin/env bash
# Deploy csot-site to production (Azure VM behind csot.devclub.in).
#
# Local usage (SSH alias "csot-vm" in ~/.ssh/config):
#   ./deploy.sh
#
# CI usage (GitHub Actions — set secrets CSOT_SSH_*):
#   CSOT_SSH_HOST=20.244.42.13 CSOT_SSH_USER=azureuser CSOT_SSH_KEY=~/.ssh/csot_deploy ./deploy.sh
#
# Prerequisites:
#   - SSH access with sudo on the VM for cp/chown/systemctl
#
# Usage: ./deploy.sh

set -euo pipefail

REMOTE_SYNC_DIR="/tmp/csot-sync"
REMOTE_APP_DIR="/opt/csot-site"
APP_USER="csot-site"
SITE_URL="${CSOT_SITE_URL:-https://csot.devclub.in}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ -n "${CSOT_SSH_HOST:-}" ]]; then
  SSH_TARGET="${CSOT_SSH_USER:-azureuser}@${CSOT_SSH_HOST}"
  SSH_KEY="${CSOT_SSH_KEY:-}"
  if [[ -z "$SSH_KEY" ]]; then
    echo "CSOT_SSH_KEY is required when CSOT_SSH_HOST is set" >&2
    exit 1
  fi
  SSH_KEY="${SSH_KEY/#\~/$HOME}"
  RSYNC_SSH_CMD="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=yes -o BatchMode=yes"
  SSH_BASE=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=yes -o BatchMode=yes)
else
  SSH_TARGET="${CSOT_DEPLOY_HOST:-csot-vm}"
  SSH_BASE=(ssh)
  RSYNC_SSH_CMD=""
fi

echo "→ Syncing to ${SSH_TARGET}:${REMOTE_SYNC_DIR}/"
if [[ -n "$RSYNC_SSH_CMD" ]]; then
  rsync -az --delete \
    -e "$RSYNC_SSH_CMD" \
    --exclude node_modules \
    --exclude .git \
    --exclude .next \
    --exclude .env.local \
    --exclude .env \
    ./ "${SSH_TARGET}:${REMOTE_SYNC_DIR}/"
else
  rsync -az --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .next \
    --exclude .env.local \
    --exclude .env \
    ./ "${SSH_TARGET}:${REMOTE_SYNC_DIR}/"
fi

echo "→ Building and restarting on ${SSH_TARGET}"
"${SSH_BASE[@]}" "${SSH_TARGET}" "sudo cp -a ${REMOTE_SYNC_DIR}/. ${REMOTE_APP_DIR}/ \
  && sudo chown -R ${APP_USER}:${APP_USER} ${REMOTE_APP_DIR} \
  && sudo bash -c 'set -a && source /etc/csot-site/env && set +a && cd ${REMOTE_APP_DIR} && sudo -E -u ${APP_USER} npm install --include=dev && sudo -E -u ${APP_USER} npm run build' \
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
