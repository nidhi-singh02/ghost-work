#!/usr/bin/env bash
#
# CantonLance — DevNet Deployment Script
# Deploys Daml contracts to Canton DevNet and sets up party infrastructure
#
# This script runs from your local machine and connects to the DevNet server
# via SSH. It uses the server's nginx proxy to reach the JSON Ledger API.
#
# Architecture:
#   Local machine → SSH tunnel → DevNet server → nginx (port 8080)
#     → Host: json-ledger-api.localhost → participant:7575 (JSON Ledger API)
#
# Prerequisites:
#   1. DevNet server running with validator stack (start.sh completed)
#   2. SSH access to your DevNet server
#   3. Built DAR file (.daml/dist/cantonlance-freelance-0.0.1.dar)
#
# Usage:
#   ./deploy-devnet.sh                              # Interactive mode
#   ./deploy-devnet.sh 136.112.241.18 5             # DevNet5 as dev5
#   TUNNEL_PORT=8090 ./deploy-devnet.sh 136.112.241.18 5  # Custom local port

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAML_DIR="${SCRIPT_DIR}/freelancer-app/daml/freelance"
DAR_FILE="${DAML_DIR}/.daml/dist/cantonlance-freelance-0.0.1.dar"
FRONTEND_DIR="${SCRIPT_DIR}/freelancer-app/frontend"

# JWT secret for DevNet (hs-256-unsafe mode)
JWT_SECRET="unsafe"
# Audience must match the validator's LEDGER_API_AUTH_AUDIENCE
JWT_AUDIENCE="https://ledger_api.example.com"
# Local port for the SSH tunnel (can be overridden via env)
LOCAL_TUNNEL_PORT="${TUNNEL_PORT:-8090}"
# Remote nginx port on the DevNet server
REMOTE_NGINX_PORT="${REMOTE_PORT:-80}"
# Output config file for the frontend
CONFIG_FILE="${FRONTEND_DIR}/public/devnet-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[CantonLance]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARNING]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
info()  { echo -e "${BLUE}[INFO]${NC} $*"; }

# ── Parse arguments / interactive mode ─────────────────────────────────
DEVNET_HOST="${1:-}"
DEV_NUM="${2:-}"

if [ -z "$DEVNET_HOST" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║         CantonLance — DevNet Deployment Wizard              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Available DevNet servers:"
  echo "  DevNet1: 34.169.191.223"
  echo "  DevNet2: 34.42.174.182"
  echo "  DevNet3: 35.193.163.216"
  echo "  DevNet4: 34.31.214.200"
  echo "  DevNet5: 136.112.241.18"
  echo ""
  read -rp "DevNet server IP: " DEVNET_HOST
  read -rp "Dev account number (1-10): " DEV_NUM
fi

if [ -z "$DEV_NUM" ]; then
  DEV_NUM="1"
fi

DEV_USER="dev${DEV_NUM}"
DEV_PASS="CantonDev${DEV_NUM}!"
LEDGER_API_URL="http://localhost:${LOCAL_TUNNEL_PORT}"

echo ""
log "Configuration:"
info "  Server:       ${DEVNET_HOST}"
info "  Account:      ${DEV_USER}"
info "  SSH tunnel:   localhost:${LOCAL_TUNNEL_PORT} → ${DEVNET_HOST}:${REMOTE_NGINX_PORT}"
info "  Ledger API:   ${LEDGER_API_URL} (via Host: json-ledger-api.localhost)"
echo ""

# ── Helper: SSH command runner ─────────────────────────────────────────
ssh_cmd() {
  expect -c "
    set timeout 30
    spawn ssh -o StrictHostKeyChecking=no ${DEV_USER}@${DEVNET_HOST}
    expect \"*assword*\"
    send \"${DEV_PASS}\r\"
    expect \"*\\\$*\"
    send \"$1\r\"
    expect {
      \"*\\\$*\" { }
      timeout { puts \"TIMEOUT\"; exit 1 }
    }
    send \"exit\r\"
    expect eof
  " 2>&1 | grep -v "^spawn " | grep -v "password:" | grep -v "^Last login:" | grep -v "^Linux " | grep -v "^The programs" | grep -v "^the exact" | grep -v "^individual" | grep -v "^$" | grep -v "^Debian" | grep -v "^permitted" | tail -n +2
}

# ── Helper: Ledger API call (via tunnel with Host header) ──────────────
ledger_api() {
  local method="$1"
  local endpoint="$2"
  local token="$3"
  shift 3

  curl -sf \
    -X "${method}" \
    "${LEDGER_API_URL}${endpoint}" \
    -H "Host: json-ledger-api.localhost" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    --max-time 30 \
    "$@"
}

# ── JWT generation (HS256 with "unsafe" secret) ────────────────────────
generate_jwt() {
  local sub="$1"
  local scope="${2:-daml_ledger_api}"

  local header
  header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

  local exp=$(( $(date +%s) + 86400 * 30 ))

  local payload_json="{\"sub\":\"${sub}\",\"aud\":\"${JWT_AUDIENCE}\",\"scope\":\"${scope}\",\"admin\":true,\"exp\":${exp}}"
  local payload
  payload=$(echo -n "$payload_json" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

  local signature
  signature=$(echo -n "${header}.${payload}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

  echo "${header}.${payload}.${signature}"
}

# ── Step 1: Check DAR exists ──────────────────────────────────────────
step1_check_dar() {
  log "Step 1: Checking DAR file..."

  if [ ! -f "$DAR_FILE" ]; then
    warn "DAR file not found at ${DAR_FILE}"
    info "Building DAR using DPM in Docker..."

    # Check if the Docker dev container is running
    if docker ps --format '{{.Names}}' | grep -q cantonlance; then
      docker exec cantonlance-frontend bash -c "cd /workspace/daml/freelance && /root/.dpm/bin/dpm build"
    else
      error "DAR file missing and Docker container not running."
      error "Build it manually: docker exec <container> dpm build"
      exit 1
    fi
  fi

  log "DAR found: $(ls -lh "$DAR_FILE" | awk '{print $5}')"
}

# ── Step 2: Check validator health on remote server ────────────────────
step2_check_health() {
  log "Step 2: Checking validator health on ${DEVNET_HOST}..."

  local health
  health=$(expect -c "
    set timeout 20
    spawn ssh -o StrictHostKeyChecking=no ${DEV_USER}@${DEVNET_HOST}
    expect \"*assword*\"
    send \"${DEV_PASS}\r\"
    expect \"*\\\$*\"
    send \"docker inspect --format={{.State.Health.Status}} splice-validator-participant-1 2>&1\r\"
    expect \"*\\\$*\"
    send \"exit\r\"
    expect eof
  " 2>&1 | grep -E "^(healthy|unhealthy|starting)" | head -1)

  if [ "$health" = "healthy" ]; then
    log "Participant is healthy!"
  else
    warn "Participant health: ${health:-unknown}"
    info "The participant may still be starting up."
    read -rp "Continue anyway? [y/N] " cont
    if [[ ! "$cont" =~ ^[Yy] ]]; then
      exit 1
    fi
  fi

  # Check validator separately
  local val_health
  val_health=$(expect -c "
    set timeout 20
    spawn ssh -o StrictHostKeyChecking=no ${DEV_USER}@${DEVNET_HOST}
    expect \"*assword*\"
    send \"${DEV_PASS}\r\"
    expect \"*\\\$*\"
    send \"docker inspect --format={{.State.Health.Status}} splice-validator-validator-1 2>&1\r\"
    expect \"*\\\$*\"
    send \"exit\r\"
    expect eof
  " 2>&1 | grep -E "^(healthy|unhealthy|starting)" | head -1)

  if [ "$val_health" = "healthy" ]; then
    log "Validator is healthy!"
  else
    warn "Validator health: ${val_health:-unknown}"
    warn "The validator may not have fully onboarded to the network yet."
    warn "DAR upload and party creation may fail until the synchronizer connects."
    read -rp "Continue anyway? [y/N] " cont
    if [[ ! "$cont" =~ ^[Yy] ]]; then
      exit 1
    fi
  fi
}

# ── Step 3: Open SSH tunnel ───────────────────────────────────────────
TUNNEL_PID=""

step3_open_tunnel() {
  log "Step 3: Opening SSH tunnel..."

  # Kill any existing tunnel on this port
  lsof -ti:${LOCAL_TUNNEL_PORT} 2>/dev/null | xargs kill 2>/dev/null || true
  sleep 1

  # Open tunnel in background using expect
  expect -c "
    set timeout 15
    spawn ssh -o StrictHostKeyChecking=no -N -L ${LOCAL_TUNNEL_PORT}:127.0.0.1:${REMOTE_NGINX_PORT} ${DEV_USER}@${DEVNET_HOST}
    expect \"*assword*\"
    send \"${DEV_PASS}\r\"
    expect {
      timeout { }
      eof { exit 1 }
    }
  " &>/dev/null &
  TUNNEL_PID=$!

  sleep 3

  # Verify tunnel is working
  local version
  version=$(curl -sf --max-time 5 \
    -H "Host: json-ledger-api.localhost" \
    "${LEDGER_API_URL}/v2/version" 2>&1) || {
    error "SSH tunnel failed. Cannot reach Ledger API at ${LEDGER_API_URL}"
    error "Make sure the validator stack is running on ${DEVNET_HOST}"
    kill $TUNNEL_PID 2>/dev/null || true
    exit 1
  }

  log "SSH tunnel open! Ledger API reachable."
  info "API version: $(echo "$version" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("version","unknown"))' 2>/dev/null || echo 'unknown')"
}

cleanup_tunnel() {
  if [ -n "$TUNNEL_PID" ]; then
    kill $TUNNEL_PID 2>/dev/null || true
    info "SSH tunnel closed."
  fi
}
trap cleanup_tunnel EXIT

# ── Step 4: Upload DAR ─────────────────────────────────────────────────
step4_upload_dar() {
  log "Step 4: Uploading DAR to Canton Ledger API..."

  local admin_jwt
  admin_jwt=$(generate_jwt "ledger-api-user")

  local response
  response=$(curl -sf -X POST \
    "${LEDGER_API_URL}/v2/packages" \
    -H "Host: json-ledger-api.localhost" \
    -H "Authorization: Bearer ${admin_jwt}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${DAR_FILE}" \
    --max-time 120 \
    2>&1) || {
    error "DAR upload failed."
    error "Response: ${response}"
    warn "This usually means the synchronizer is not yet connected."
    warn "Wait for the validator to become healthy and retry."
    return 1
  }

  log "DAR uploaded successfully!"
}

# ── Step 5: Allocate parties ───────────────────────────────────────────
declare -A PARTY_MAP

step5_allocate_parties() {
  log "Step 5: Allocating parties..."

  local admin_jwt
  admin_jwt=$(generate_jwt "ledger-api-user")

  local hints=("Client_EthFoundation" "FreelancerA_Nidhi" "FreelancerB_Akash" "Auditor_Eve")
  local roles=("client" "freelancerA" "freelancerB" "auditor")

  for i in 0 1 2 3; do
    local hint="${hints[$i]}"
    local role="${roles[$i]}"

    info "Allocating party: ${hint}..."

    local response
    response=$(ledger_api POST "/v2/parties" "$admin_jwt" \
      -d "{\"partyIdHint\": \"${hint}\", \"displayName\": \"${hint}\"}") || {
      warn "Party allocation failed for ${hint}. It may already exist."
      # Try to list existing parties to find it
      local list_resp
      list_resp=$(ledger_api GET "/v2/parties?pageSize=100" "$admin_jwt") || list_resp="{}"
      local existing_id
      existing_id=$(echo "$list_resp" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for p in data.get('partyDetails', []):
    if '${hint}' in p.get('party','') or p.get('displayName','') == '${hint}':
        print(p['party'])
        break
" 2>/dev/null || echo "")
      if [ -n "$existing_id" ]; then
        PARTY_MAP[$role]="$existing_id"
        log "  ${hint} → ${existing_id} (existing)"
        continue
      fi
      error "Could not allocate or find party ${hint}"
      exit 1
    }

    local party_id
    party_id=$(echo "$response" | python3 -c "
import sys,json
data = json.load(sys.stdin)
print(data.get('partyDetails',{}).get('party', data.get('party','')))
" 2>/dev/null || echo "")

    if [ -z "$party_id" ]; then
      error "Could not extract party ID for ${hint}. Response: ${response}"
      exit 1
    fi

    PARTY_MAP[$role]="$party_id"
    log "  ${hint} → ${party_id}"
  done
}

# ── Step 6: Create users with party rights ─────────────────────────────
step6_create_users() {
  log "Step 6: Creating users with ActAs/ReadAs rights..."

  local admin_jwt
  admin_jwt=$(generate_jwt "ledger-api-user")

  local user_ids=("cantonlance-client" "cantonlance-freelancerA" "cantonlance-freelancerB" "cantonlance-auditor")
  local roles=("client" "freelancerA" "freelancerB" "auditor")

  for i in 0 1 2 3; do
    local user_id="${user_ids[$i]}"
    local role="${roles[$i]}"
    local party_id="${PARTY_MAP[$role]}"

    info "Creating user: ${user_id} → ${party_id}..."

    # Create user
    ledger_api POST "/v2/users" "$admin_jwt" \
      -d "{
        \"user\": {
          \"id\": \"${user_id}\",
          \"isDeactivated\": false,
          \"primaryParty\": \"${party_id}\",
          \"identityProviderId\": \"\",
          \"metadata\": {
            \"resourceVersion\": \"\",
            \"annotations\": {}
          }
        },
        \"rights\": [
          { \"kind\": { \"CanActAs\": { \"value\": { \"party\": \"${party_id}\" } } } },
          { \"kind\": { \"CanReadAs\": { \"value\": { \"party\": \"${party_id}\" } } } }
        ]
      }" > /dev/null 2>&1 || warn "User ${user_id} may already exist"

    log "  User ${user_id} ready"
  done
}

# ── Step 7: Generate tokens and write frontend config ──────────────────
step7_write_config() {
  log "Step 7: Generating JWT tokens and writing frontend config..."

  local user_ids=("cantonlance-client" "cantonlance-freelancerA" "cantonlance-freelancerB" "cantonlance-auditor")
  local roles=("client" "freelancerA" "freelancerB" "auditor")

  declare -A TOKENS

  for i in 0 1 2 3; do
    local user_id="${user_ids[$i]}"
    local role="${roles[$i]}"
    TOKENS[$role]=$(generate_jwt "$user_id")
    info "  ${role}: token generated"
  done

  # Ensure public directory exists
  mkdir -p "${FRONTEND_DIR}/public"

  # The frontend will access the Ledger API via the Vite dev proxy
  # or via the SSH tunnel directly. We use /api prefix for the proxy.
  local frontend_api_url="/api/devnet"

  cat > "$CONFIG_FILE" <<EOCONFIG
{
  "mode": "devnet",
  "ledgerApiUrl": "${frontend_api_url}",
  "parties": {
    "client": {
      "partyId": "${PARTY_MAP[client]}",
      "userId": "cantonlance-client",
      "token": "${TOKENS[client]}"
    },
    "freelancerA": {
      "partyId": "${PARTY_MAP[freelancerA]}",
      "userId": "cantonlance-freelancerA",
      "token": "${TOKENS[freelancerA]}"
    },
    "freelancerB": {
      "partyId": "${PARTY_MAP[freelancerB]}",
      "userId": "cantonlance-freelancerB",
      "token": "${TOKENS[freelancerB]}"
    },
    "auditor": {
      "partyId": "${PARTY_MAP[auditor]}",
      "userId": "cantonlance-auditor",
      "token": "${TOKENS[auditor]}"
    }
  },
  "darPackageId": "cantonlance-freelance",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOCONFIG

  log "Config written to ${CONFIG_FILE}"

  # Also write a direct-access config (uses tunnel URL, for debugging)
  cat > "${FRONTEND_DIR}/public/devnet-config-direct.json" <<EOCONFIG2
{
  "mode": "devnet",
  "ledgerApiUrl": "${LEDGER_API_URL}",
  "ledgerApiHost": "json-ledger-api.localhost",
  "parties": {
    "client": {
      "partyId": "${PARTY_MAP[client]}",
      "userId": "cantonlance-client",
      "token": "${TOKENS[client]}"
    },
    "freelancerA": {
      "partyId": "${PARTY_MAP[freelancerA]}",
      "userId": "cantonlance-freelancerA",
      "token": "${TOKENS[freelancerA]}"
    },
    "freelancerB": {
      "partyId": "${PARTY_MAP[freelancerB]}",
      "userId": "cantonlance-freelancerB",
      "token": "${TOKENS[freelancerB]}"
    },
    "auditor": {
      "partyId": "${PARTY_MAP[auditor]}",
      "userId": "cantonlance-auditor",
      "token": "${TOKENS[auditor]}"
    }
  },
  "darPackageId": "cantonlance-freelance",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOCONFIG2
}

# ── Step 8: Verify deployment ──────────────────────────────────────────
step8_verify() {
  log "Step 8: Verifying deployment..."

  local roles=("client" "freelancerA" "freelancerB" "auditor")
  local user_ids=("cantonlance-client" "cantonlance-freelancerA" "cantonlance-freelancerB" "cantonlance-auditor")

  for i in 0 1 2 3; do
    local role="${roles[$i]}"
    local user_id="${user_ids[$i]}"
    local party_id="${PARTY_MAP[$role]}"
    local token
    token=$(generate_jwt "$user_id")

    local response
    response=$(ledger_api POST "/v2/state/active-contracts" "$token" \
      -d "{
        \"filter\": {
          \"filtersByParty\": {
            \"${party_id}\": {
              \"cumulative\": [{\"identifierFilter\": {\"WildcardFilter\": {}}}]
            }
          }
        },
        \"verbose\": true
      }" 2>&1) || response="{}"

    local count
    count=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    contracts = data.get('activeContracts', data.get('result', []))
    print(len(contracts) if isinstance(contracts, list) else 0)
except:
    print(0)
" 2>/dev/null || echo "?")

    info "  ${role}: ${count} active contracts visible"
  done

  echo ""
  log "Deployment complete!"
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║                    DEPLOYMENT SUMMARY                       ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║                                                             ║"
  echo "║  Server:     ${DEVNET_HOST} (${DEV_USER})"
  echo "║  Tunnel:     localhost:${LOCAL_TUNNEL_PORT} → nginx:${REMOTE_NGINX_PORT}"
  echo "║                                                             ║"
  echo "║  Parties:                                                   ║"
  echo "║    Client:      ${PARTY_MAP[client]}"
  echo "║    FreelancerA: ${PARTY_MAP[freelancerA]}"
  echo "║    FreelancerB: ${PARTY_MAP[freelancerB]}"
  echo "║    Auditor:     ${PARTY_MAP[auditor]}"
  echo "║                                                             ║"
  echo "║  Config:     ${CONFIG_FILE}"
  echo "║                                                             ║"
  echo "║  NEXT STEPS:                                                ║"
  echo "║  1. Keep SSH tunnel open:                                   ║"
  echo "║     ssh -L ${LOCAL_TUNNEL_PORT}:127.0.0.1:${REMOTE_NGINX_PORT} ${DEV_USER}@${DEVNET_HOST}  ║"
  echo "║  2. Start frontend:                                        ║"
  echo "║     cd freelancer-app/frontend && npm run dev              ║"
  echo "║  3. Open http://localhost:5173                              ║"
  echo "║                                                             ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
}

# ── Main ───────────────────────────────────────────────────────────────
main() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║    CantonLance — Canton DevNet Deployment                   ║"
  echo "║    ETHDenver 2026 · Track 1: Best Privacy-Focused dApp      ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  step1_check_dar
  step2_check_health
  step3_open_tunnel
  step4_upload_dar
  step5_allocate_parties
  step6_create_users
  step7_write_config
  step8_verify
}

main
