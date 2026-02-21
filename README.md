# CantonLance — Private Freelancer Payment Protocol

A dApp where clients hire freelancers through private contracts — each freelancer's rate, scope, and payments are invisible to other freelancers working for the same client. An auditor can verify payment correctness without seeing commercial terms.

**Built on Canton L1** for the ETHDenver 2026 Canton Network Bounty.

## The Problem

On Upwork, Fiverr, and every blockchain freelance platform (CryptoTask, LaborX, ChainPact), contract terms are either visible to everyone or controlled by a central intermediary. Freelancers can't protect their rates. Clients can't protect their spending. There is no existing blockchain solution that solves this with cryptographic privacy.

## What Canton Uniquely Enables

Canton's **sub-transaction privacy** means that when a Client creates a contract with Freelancer A, Freelancer B's participant node **never receives any data** about it. This isn't access control — the data literally never reaches them. No other blockchain does this.

## Privacy Model

| Party | Role | What They See |
|-------|------|---------------|
| **Client** | Hires freelancers, approves milestones, pays | All their own contracts, all payments they've made |
| **Freelancer A** | Accepts work, submits deliverables, gets paid | ONLY their own contract with the client. Cannot see other freelancers' existence, rates, or payments |
| **Freelancer B** | Same as Freelancer A | ONLY their own contract. Freelancer A is completely invisible |
| **Auditor** | Verifies payment integrity | Summary totals only (total paid, number of contracts). Cannot see individual rates, project descriptions, or freelancer identities |

## Architecture

```
React UI (Party Switcher) → Canton JSON Ledger API → Daml Contracts → Canton L1
```

**Smart Contracts (Daml):**
- `ProjectContract` — Private agreement between Client and Freelancer (signatories: both)
- `PaymentRecord` — Immutable payment record (signatories: client + freelancer)
- `AuditSummary` — Aggregated totals for auditor (signatory: client, observer: auditor)
- `ProjectProposal` — Propose-accept pattern for contract creation

## Setup & Installation

### Prerequisites
- Docker Desktop (8GB+ RAM allocated)
- Git

### Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd freelancer-dapp

# Build the development Docker image (includes Daml SDK 3.4.10, JDK 21, Node.js 20)
docker build -f Dockerfile.dev -t cantonlance-dev .

# Start the frontend
docker compose up

# Open http://localhost:5173 in your browser
```

### Run Daml Tests (Proves Privacy Model)

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

### Compile Daml Contracts

```bash
docker run --rm \
  -v $(pwd)/freelancer-app/daml/freelance:/workspace \
  cantonlance-dev \
  bash -c "cd /workspace && daml build --no-legacy-assistant-warning"
```

### Build Frontend for Production

```bash
docker run --rm \
  -v $(pwd)/freelancer-app/frontend:/workspace \
  cantonlance-dev \
  bash -c "cd /workspace && npm run build"
```

## How to Test Privacy

1. Open `http://localhost:5173` in your browser
2. Click **"Load Sample Contracts"** to create two contracts:
   - Alice at $150/hr (Build payment microservice)
   - Bob at $80/hr (Design landing page)
3. **Client tab**: See both contracts with all details
4. **Alice tab**: See ONLY Alice's contract at $150/hr. Bob is invisible.
5. **Bob tab**: See ONLY Bob's contract at $80/hr. Alice is invisible.
6. Submit milestones and approve payments to see the full flow
7. Generate an Audit Summary, then switch to **Auditor tab**: See only totals, zero individual data
8. Run the Daml Script test (see above) to verify programmatically

## Daml Contract Details

### ProjectContract
```
signatories: client, freelancer
observers: none
```
When Client creates a contract with Freelancer A, Canton's protocol only sends the transaction to participant nodes hosting Client and Freelancer A. Freelancer B's node never receives any data.

### PaymentRecord
```
signatories: client, freelancer
observers: none
```
Each payment is only visible to its specific client-freelancer pair.

### AuditSummary
```
signatory: client
observer: auditor
```
The auditor sees aggregate totals only. They are NOT a signatory or observer on any ProjectContract or PaymentRecord.

## Tech Stack

- **Smart Contracts**: Daml 3.4.10 on Canton L1
- **Frontend**: React 18 + TypeScript + Vite + Bootstrap 5
- **Development**: Dockerized environment (no Nix required on host)
- **Deployment**: Canton LocalNet (DevNet-ready architecture)

## Project Structure

```
freelancer-dapp/
├── Dockerfile.dev              # Dev container (JDK 21, Node 20, Daml SDK)
├── docker-compose.yml          # One-command frontend startup
├── README.md
└── freelancer-app/
    ├── daml/freelance/         # Daml smart contracts
    │   ├── daml.yaml
    │   └── daml/
    │       ├── Freelance.daml      # 4 templates (ProjectContract, PaymentRecord, AuditSummary, ProjectProposal)
    │       └── FreelanceTest.daml  # Privacy model test script
    └── frontend/src/cantonlance/   # React frontend
        ├── CantonLanceApp.tsx      # Main app with party switcher
        ├── PartySwitcher.tsx       # Party tab navigation
        ├── ClientView.tsx          # Client dashboard
        ├── FreelancerView.tsx      # Freelancer view (own data only)
        ├── AuditorView.tsx         # Auditor view (summaries only)
        ├── DemoSetup.tsx           # Quick demo data loader
        ├── ActivityLog.tsx         # Transaction activity log
        ├── store.tsx               # State management with privacy filtering
        └── types.ts                # TypeScript type definitions
```

## Deployment Notes

Built and tested on Canton LocalNet. Architecture is DevNet-ready — deployment requires SV node VPN access. The Daml contracts and privacy model are identical on LocalNet vs DevNet.
