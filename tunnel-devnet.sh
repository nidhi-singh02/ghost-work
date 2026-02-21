#!/usr/bin/env bash
#
# GhostWork — SSH Tunnel to Canton DevNet
# Opens an SSH tunnel to the DevNet server's JSON Ledger API.
#
# Architecture:
#   localhost:9090 → SSH → DevNet server → nginx (port 80)
#     → Host: json-ledger-api.localhost → participant:7575 (JSON Ledger API)
#
# Usage:
#   ./tunnel-devnet.sh                    # Interactive
#   ./tunnel-devnet.sh 136.112.241.18 5   # DevNet5 as dev5
#   TUNNEL_PORT=8090 ./tunnel-devnet.sh 136.112.241.18 5  # Custom local port
#
# Keep this running while using the frontend or deploy script.

set -euo pipefail

DEVNET_HOST="${1:-}"
DEV_NUM="${2:-}"
LOCAL_PORT="${TUNNEL_PORT:-9090}"
REMOTE_PORT="${REMOTE_PORT:-80}"

if [ -z "$DEVNET_HOST" ]; then
  echo ""
  echo "  GhostWork — DevNet SSH Tunnel"
  echo ""
  echo "  Available servers:"
  echo "    DevNet1: 34.169.191.223"
  echo "    DevNet2: 34.42.174.182"
  echo "    DevNet3: 35.193.163.216"
  echo "    DevNet4: 34.31.214.200"
  echo "    DevNet5: 136.112.241.18"
  echo ""
  read -rp "  DevNet server IP: " DEVNET_HOST
  read -rp "  Dev account number (1-10): " DEV_NUM
fi

DEV_NUM="${DEV_NUM:-5}"
DEV_USER="dev${DEV_NUM}"

echo ""
echo "  Opening tunnel: localhost:${LOCAL_PORT} → ${DEVNET_HOST}:${REMOTE_PORT}"
echo "  Account: ${DEV_USER}"
echo "  Password: CantonDev${DEV_NUM}!"
echo ""
echo "  Verify with:"
echo "    curl -s -H 'Host: json-ledger-api.localhost' http://localhost:${LOCAL_PORT}/v2/version"
echo ""
echo "  Press Ctrl+C to close the tunnel."
echo ""

ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=10 \
    -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" \
    "${DEV_USER}@${DEVNET_HOST}"
