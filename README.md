# GhostWork: Private Freelancer Dapp

A privacy-first freelancer payment dApp on **Canton L1**. Clients hire freelancers through private contracts where each freelancer's rate, scope, and payments are invisible to other freelancers. An auditor can verify payment correctness without seeing any individual commercial terms.

Built for the **ETHDenver 2026 Canton Network Bounty**.

## The Problem

On Upwork, Fiverr, and every blockchain freelance platform, contract terms are either visible to everyone or controlled by a central intermediary. Freelancers can't protect their rates. Clients can't protect their spending. No existing blockchain solution offers cryptographic privacy for this.

## What Canton Uniquely Enables

Canton's **sub-transaction privacy** means when a Client creates a contract with Freelancer A, Freelancer B's participant node **never receives any data** about it. This isn't access control or client-side filtering — the data physically never reaches them. No other blockchain does this.

## Privacy Model

| Party | Sees | Does NOT See |
|-------|------|-------------|
| **Ethereum Foundation** (Client) | All own contracts, all payments | Nothing hidden from client |
| **Nidhi** (Freelancer A) | Only own contract + payments | Akash's contract, rate, payments |
| **Akash** (Freelancer B) | Only own contract + payments | Nidhi's contract, rate, payments |
| **Eve** (Auditor) | Aggregate totals only | Individual rates, descriptions, freelancer names |

## Architecture

```
React UI (Party Switcher) --> Canton JSON Ledger API v2 --> Daml Smart Contracts --> Canton L1
```

**4 Daml Templates:**
- `ProjectProposal` — Propose-accept pattern (signatory: client, observer: freelancer)
- `ProjectContract` — Private agreement (signatories: client + freelancer)
- `PaymentRecord` — Immutable payment proof (signatories: client + freelancer)
- `AuditSummary` — Aggregate-only report (signatory: client, observer: auditor)

---

## Setup & Installation

### Prerequisites

- **Docker Desktop** (8GB+ RAM allocated)
- **Node.js 20+** (for running the frontend on host)
- **Git**

### Step 1: Build the Dev Image

```bash
git clone <repo-url>
cd freelancer-dapp

# Build Docker image with JDK 21, Node.js 20, Daml SDK 3.4.10
docker build -f Dockerfile.dev -t cantonlance-dev .
```

This takes ~5 minutes on first build. The image supports both AMD64 and ARM64 (Apple Silicon).

---

## Option A: Local Sandbox (Recommended for Demo)

The sandbox runs a single-node Canton ledger inside Docker. The frontend runs on your host machine and connects through a Vite proxy.

### Step 2a: Start the Sandbox

```bash
docker compose up -d sandbox
```

Wait for it to become healthy (~60 seconds). The sandbox:
- Compiles the Daml contracts
- Starts the Canton sandbox with JSON Ledger API on port 6870
- Runs a `socat` bridge so the API is accessible from the host

Check health:
```bash
docker inspect --format='{{.State.Health.Status}}' cantonlance-sandbox
# Should return: healthy
```

### Step 3a: Run Setup Script

```bash
./setup-local.sh
```

This script (runs from host, executes commands inside the container):
1. Waits for the sandbox to be ready
2. Uploads the compiled DAR (Daml Archive)
3. Allocates 4 parties: `Client_EthFoundation`, `FreelancerA_Nidhi`, `FreelancerB_Akash`, `Auditor_Eve`
4. Creates users with `ActAs`/`ReadAs` rights
5. Writes `freelancer-app/frontend/public/local-config.json` with party IDs

### Step 4a: Start the Frontend

```bash
cd freelancer-app/frontend
npm install
npx vite
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/api/local` to the sandbox at `127.0.0.1:6870`. The frontend auto-detects the local config and connects.

### Verify It Works

```bash
# Check Canton API is reachable through the proxy
curl -s http://localhost:5173/api/local/v2/version | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])"
# Should print: 3.4.10
```

---

## Option B: Canton DevNet

Deploy to the Canton Network DevNet for a multi-node environment.

### Prerequisites

- SSH access to a DevNet server (provided by Canton Network for hackathon)
- The DevNet validator stack must be running (`start.sh` completed)
- `expect` installed on your machine (`brew install expect` on macOS)

### Step 2b: Open SSH Tunnel

```bash
# Interactive mode
./tunnel-devnet.sh

# Or specify server directly (DevNet5 example)
./tunnel-devnet.sh 136.112.241.18 5
```

This opens `localhost:8090` --> DevNet nginx:8080 --> participant:7575 (JSON Ledger API). Keep this terminal open.

### Step 3b: Deploy

In a separate terminal:

```bash
# Interactive mode
./deploy-devnet.sh

# Or specify server directly
./deploy-devnet.sh 136.112.241.18 5
```

The deploy script:
1. Checks the DAR file exists (builds if needed)
2. Verifies validator health via SSH
3. Opens its own SSH tunnel
4. Uploads the DAR to the Canton Ledger API
5. Allocates 4 parties with JWT auth (HS256 with `unsafe` secret)
6. Creates users with `ActAs`/`ReadAs` rights
7. Generates JWT tokens and writes `freelancer-app/frontend/public/devnet-config.json`
8. Verifies deployment by querying active contracts

### Step 4b: Start the Frontend

```bash
cd freelancer-app/frontend
npm install
npx vite
```

The Vite dev server proxies `/api/devnet` to `127.0.0.1:8090` with the required `Host: json-ledger-api.localhost` header. The frontend auto-detects both configs and lets you switch environments.

### DevNet Architecture

```
Browser --> Vite (localhost:5173)
              |
              |--> /api/local  --> sandbox:6870 (Docker)
              |--> /api/devnet --> SSH tunnel:8090 --> DevNet nginx:8080 --> participant:7575
```

---

## Running Daml Tests

The Daml script test proves the privacy model programmatically:

```bash
docker run --rm \
  -v $(pwd)/freelancer-app/daml/freelance:/workspace \
  cantonlance-dev \
  bash -c "cd /workspace && daml test --no-legacy-assistant-warning"
```

Expected output:
```
Test Summary
daml/FreelanceTest.daml:privacyTest: ok, 5 active contracts, 9 transactions.
```

---

## Project Structure

```
freelancer-dapp/
|-- Dockerfile.dev              # Dev container (JDK 21, Node 20, Daml SDK 3.4.10)
|-- docker-compose.yml          # Sandbox + frontend services
|-- setup-local.sh              # Local sandbox: upload DAR, allocate parties, write config
|-- deploy-devnet.sh            # DevNet: full deployment via SSH tunnel
|-- tunnel-devnet.sh            # Standalone SSH tunnel helper
|-- README.md
|-- freelancer-app/
    |-- daml/freelance/
    |   |-- daml.yaml
    |   |-- daml/
    |       |-- Freelance.daml         # 4 templates: ProjectProposal, ProjectContract,
    |       |                          #   PaymentRecord, AuditSummary
    |       |-- FreelanceTest.daml     # Privacy model test script
    |-- frontend/
        |-- index.html
        |-- vite.config.ts             # Dual proxy: /api/local + /api/devnet
        |-- public/
        |   |-- local-config.json      # Generated by setup-local.sh
        |   |-- devnet-config.json     # Generated by deploy-devnet.sh
        |-- src/
            |-- main.tsx
            |-- App.tsx
            |-- cantonlance/
                |-- CantonLanceApp.tsx      # Main app shell, navbar, hero section
                |-- store.tsx              # React Context state + Canton API client
                |-- cantonApi.ts           # Canton JSON Ledger API v2 client
                |-- types.ts               # TypeScript types + party definitions
                |-- PartySwitcher.tsx       # Party tab navigation
                |-- ClientView.tsx         # Client dashboard (create, approve, audit)
                |-- FreelancerView.tsx     # Freelancer view (own data only)
                |-- AuditorView.tsx        # Auditor view (aggregates only)
                |-- ApiProofPanel.tsx       # Real API request/response log
                |-- PrivacyComparisonPanel.tsx  # 4-column privacy comparison
                |-- ToastNotifications.tsx  # Toast notification system
                |-- DemoGuide.tsx          # 8-step guided demo walkthrough
```

## Tech Stack

- **Smart Contracts**: Daml 3.4.10 on Canton L1
- **Frontend**: React 18 + TypeScript + Vite + Bootstrap 5 (CDN)
- **API**: Canton JSON Ledger API v2 (real HTTP calls, no simulation)
- **Dev Environment**: Docker (JDK 21, Node 20, Daml SDK — supports AMD64 + ARM64)
- **Deployment**: Local sandbox + Canton DevNet (dual-environment support)

## License

Copyright (c) 2026. ETHDenver 2026 Hackathon Submission.
