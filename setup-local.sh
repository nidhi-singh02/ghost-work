#!/bin/bash
# CantonLance — Local Sandbox Setup
# Uploads DAR, allocates parties, creates users, and writes frontend config.
# Run this after `docker compose up` once the sandbox is healthy.

set -euo pipefail

API_URL="${1:-http://localhost:6870}"
DAR_PATH="freelancer-app/daml/freelance/.daml/dist/cantonlance-freelance-0.0.1.dar"

echo "=== CantonLance Local Sandbox Setup ==="
echo "API URL: $API_URL"

# ── Step 1: Wait for sandbox ─────────────────────────────────────────

echo ""
echo "[1/5] Waiting for sandbox to be ready..."
for i in $(seq 1 60); do
  if docker exec cantonlance-sandbox curl -sf "$API_URL/livez" > /dev/null 2>&1; then
    echo "  Sandbox is ready!"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "  ERROR: Sandbox not ready after 60 attempts"
    exit 1
  fi
  sleep 2
done

VERSION=$(docker exec cantonlance-sandbox curl -s "$API_URL/v2/version" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "?")
echo "  API version: $VERSION"

# ── Step 2: Upload DAR ────────────────────────────────────────────────

echo ""
echo "[2/5] Uploading DAR..."

if [ ! -f "$DAR_PATH" ]; then
  echo "  DAR not found at $DAR_PATH — building..."
  # The sandbox container should have built it, but if running from host:
  docker exec cantonlance-sandbox bash -c 'cd /workspace/daml/freelance && daml build --no-legacy-assistant-warning' 2>&1 | tail -3
fi

# Upload via the JSON API (application/octet-stream)
# Note: need to run this from inside the container since port 6870 binds to localhost
UPLOAD_RESULT=$(docker exec cantonlance-sandbox bash -c \
  'curl -s -X POST http://localhost:6870/v2/packages \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@/workspace/daml/freelance/.daml/dist/cantonlance-freelance-0.0.1.dar"')
echo "  Upload result: $UPLOAD_RESULT"

# Extract main package ID from DAR manifest (64-char hex hash)
PACKAGE_ID=$(docker exec cantonlance-sandbox bash -c \
  'unzip -p /workspace/daml/freelance/.daml/dist/cantonlance-freelance-0.0.1.dar META-INF/MANIFEST.MF 2>/dev/null' \
  | tr -d '\n' | tr -d '\r' | grep -o '[a-f0-9]\{64\}' | head -1)
echo "  Package ID: $PACKAGE_ID"

# ── Step 3: Allocate parties ─────────────────────────────────────────

echo ""
echo "[3/5] Allocating parties..."

allocate_party() {
  local hint="$1"
  local result
  result=$(docker exec cantonlance-sandbox bash -c \
    "curl -s -X POST http://localhost:6870/v2/parties \
      -H 'Content-Type: application/json' \
      -d '{\"partyIdHint\": \"$hint\", \"displayName\": \"$hint\"}'")

  local party_id
  party_id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('partyDetails',{}).get('party',''))" 2>/dev/null || echo "")

  # If allocation failed (party already exists), look it up from the list
  if [ -z "$party_id" ]; then
    party_id=$(docker exec cantonlance-sandbox curl -s http://localhost:6870/v2/parties 2>/dev/null \
      | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('partyDetails', []):
    if p['party'].startswith('$hint::'):
        print(p['party'])
        break" 2>/dev/null || echo "")
  fi

  if [ -z "$party_id" ]; then
    echo "  ERROR allocating $hint: $result" >&2
    exit 1
  fi

  echo "  $hint -> $party_id" >&2
  echo "$party_id"
}

CLIENT_PARTY=$(allocate_party "Client_EthFoundation")
FREELANCER_A_PARTY=$(allocate_party "FreelancerA_Nidhi")
FREELANCER_B_PARTY=$(allocate_party "FreelancerB_Akash")
AUDITOR_PARTY=$(allocate_party "Auditor_Eve")

# ── Step 4: Create users with actAs rights ───────────────────────────

echo ""
echo "[4/5] Creating users..."

create_user() {
  local user_id="$1"
  local party_id="$2"

  docker exec cantonlance-sandbox bash -c \
    "curl -s -X POST http://localhost:6870/v2/users \
      -H 'Content-Type: application/json' \
      -d '{
        \"user\": {
          \"id\": \"$user_id\",
          \"primaryParty\": \"$party_id\",
          \"isDeactivated\": false,
          \"identityProviderId\": \"\"
        },
        \"rights\": [
          {\"kind\": {\"CanActAs\": {\"value\": {\"party\": \"$party_id\"}}}},
          {\"kind\": {\"CanReadAs\": {\"value\": {\"party\": \"$party_id\"}}}}
        ]
      }'" > /dev/null 2>&1

  echo "  Created user: $user_id"
}

create_user "client_user" "$CLIENT_PARTY"
create_user "freelancerA_user" "$FREELANCER_A_PARTY"
create_user "freelancerB_user" "$FREELANCER_B_PARTY"
create_user "auditor_user" "$AUDITOR_PARTY"

# ── Step 5: Write frontend config ────────────────────────────────────

echo ""
echo "[5/5] Writing frontend config..."

CONFIG_PATH="freelancer-app/frontend/public/local-config.json"
mkdir -p "$(dirname "$CONFIG_PATH")"

cat > "$CONFIG_PATH" << EOF
{
  "mode": "local",
  "ledgerApiUrl": "/api/local",
  "packageId": "$PACKAGE_ID",
  "parties": {
    "client": {
      "partyId": "$CLIENT_PARTY",
      "userId": "client_user",
      "token": ""
    },
    "freelancerA": {
      "partyId": "$FREELANCER_A_PARTY",
      "userId": "freelancerA_user",
      "token": ""
    },
    "freelancerB": {
      "partyId": "$FREELANCER_B_PARTY",
      "userId": "freelancerB_user",
      "token": ""
    },
    "auditor": {
      "partyId": "$AUDITOR_PARTY",
      "userId": "auditor_user",
      "token": ""
    }
  },
  "darPackageId": "cantonlance-freelance",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "  Config written to $CONFIG_PATH"
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Party IDs:"
echo "  Client:      $CLIENT_PARTY"
echo "  FreelancerA: $FREELANCER_A_PARTY"
echo "  FreelancerB: $FREELANCER_B_PARTY"
echo "  Auditor:     $AUDITOR_PARTY"
echo ""
echo "Package ID: $PACKAGE_ID"
echo ""
echo "Next steps:"
echo "  1. Start frontend: docker compose up frontend"
echo "  2. Open http://localhost:5173"
