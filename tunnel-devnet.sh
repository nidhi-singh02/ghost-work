#!/usr/bin/env bash
#
# CantonLance — SSH Tunnel to DevNet
# Opens an SSH tunnel to the DevNet server's JSON Ledger API.
#
# Usage:
#   ./tunnel-devnet.sh                    # Interactive
#   ./tunnel-devnet.sh 136.112.241.18 5   # DevNet5 as dev5
#
# The tunnel maps:
#   localhost:8090 → DevNet nginx:8080 → participant:7575 (JSON Ledger API)
#
# Keep this running while using the frontend or deploy script.

set -euo pipefail

DEVNET_HOST="${1:-}"
DEV_NUM="${2:-}"
LOCAL_PORT="${TUNNEL_PORT:-8090}"
REMOTE_PORT=8080

if [ -z "$DEVNET_HOST" ]; then
  echo "CantonLance SSH Tunnel"
  echo ""
  echo "Servers: DevNet5=136.112.241.18"
  read -rp "DevNet server IP: " DEVNET_HOST
  read -rp "Dev account number (1-10): " DEV_NUM
fi

DEV_NUM="${DEV_NUM:-5}"
DEV_USER="dev${DEV_NUM}"

echo ""
echo "Opening tunnel: localhost:${LOCAL_PORT} → ${DEVNET_HOST}:${REMOTE_PORT}"
echo "Account: ${DEV_USER}"
echo "Password: CantonDev${DEV_NUM}!"
echo ""
echo "Press Ctrl+C to close the tunnel."
echo ""

ssh -o StrictHostKeyChecking=no \
    -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" \
    "${DEV_USER}@${DEVNET_HOST}"
