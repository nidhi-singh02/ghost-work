# GhostWork — Demo Plan for Canton Network Team

Use this as your presenter script when showing GhostWork to the Canton Network team (judges, bounty reviewers, or ecosystem leads).

---

## One-line pitch (30 seconds)

> "GhostWork is a freelancer payment dApp on Canton L1. It shows **sub-transaction privacy**: when the client hires Nidhi, Akash’s participant node **never receives that contract** — not filtered, not hidden — the data is never sent. The auditor only ever sees aggregate totals, never individual rates or names. We’re using Canton’s JSON Ledger API v2 and Daml 3.4; the same contracts run on the local sandbox and on DevNet."

---

## Pre-demo checklist (do this before the meeting)

Run these in order. Allow ~2–3 minutes for sandbox to be healthy.

```bash
# 1. Start sandbox
docker compose up -d sandbox

# 2. Wait until healthy
docker inspect --format='{{.State.Health.Status}}' cantonlance-sandbox
# Must show: healthy

# 3. Run setup (upload DAR, allocate parties, write config)
./setup-local.sh

# 4. Start frontend (separate terminal)
cd freelancer-app/frontend && npm install && npx vite
```

**Verify:** Open http://localhost:5173 — you should see the GhostWork hero, party tabs (Ethereum Foundation, Nidhi, Akash, Eve), and no errors. Optional: `curl -s http://localhost:5173/api/local/v2/version` should return a version (e.g. 3.4.10).

**Optional backup:** If you might demo on DevNet, run `./tunnel-devnet.sh` in one terminal and `./deploy-devnet.sh` in another beforehand, so you can switch the frontend to DEVNET if local fails.

---

## Demo flow: two options

### Option A — Short demo (5–7 minutes)

Best when time is tight. Hit these beats in order.

| Step | What you do | What you say (Canton-focused) |
|------|-------------|-------------------------------|
| 1 | Open http://localhost:5173. Show hero and party tabs. | "Four parties: one client (Ethereum Foundation), two freelancers (Nidhi, Akash), one auditor (Eve). Each is a separate participant on Canton." |
| 2 | Stay as **Client**. Click **+ New Contract**. Create one contract for **Nidhi**: e.g. "API integration", $150/hr, $5000, 3 milestones. Submit. | "Client creates a private contract with Nidhi. Signatories are client and Nidhi only." |
| 3 | Switch to **Nidhi**. Show her single contract. | "Nidhi’s node only has this one contract. She can’t see anyone else’s work." |
| 4 | Switch to **Akash**. Show **empty** list. | "Akash sees **zero** contracts. Nidhi’s contract was never sent to his node — that’s sub-transaction privacy. It’s not access control; the data isn’t there." |
| 5 | Switch to **Eve (Auditor)**. Show empty. | "The auditor also has no individual contracts. She can’t see rates or names." |
| 6 | Back to **Client**. Approve & pay the first milestone, then click **Generate Audit Summary**. | "Client pays the milestone and creates an aggregate-only report for the auditor." |
| 7 | Switch to **Eve**. Show the audit summary (totals only). | "Now Eve sees only aggregates: e.g. 1 contract, total paid. No rates, no descriptions, no freelancer identities. That’s the Canton privacy model we’re demonstrating." |

**Optional closer:** Expand **Privacy Comparison** and/or **Canton API Log** to show real API calls and what each party “sees” in one view.

---

### Option B — Full guided demo (10–15 minutes)

Use the in-app **Start Guided Demo** and follow the 8 steps. The bottom bar guides the audience; use it to keep the narrative tight.

1. **Welcome** — Emphasize: "Each party has a **fundamentally different view** of the ledger, enforced at the protocol level."
2. **Create contract** — As Client, create one contract for Nidhi (same as above). Mention: "Only client and Nidhi are signatories; no one else is observer."
3. **Switch to Nidhi** — "Her node only received this contract."
4. **Submit milestone** — As Nidhi, submit milestone 1. "She can only act on contracts she sees."
5. **Switch to Akash** — "Zero contracts. Canton never sent Nidhi’s data here."
6. **Switch to Eve** — "Zero contracts, zero payments. Auditor has no individual data yet."
7. **Approve & generate audit** — As Client, approve the milestone and **Generate Audit Summary**. "We create an aggregate-only report; the template is signatory client, observer auditor."
8. **Eve sees totals** — Switch to Eve. "She now sees only totals — no individual terms. That’s the use case: audit without exposure."

Then:

- Expand **Privacy Comparison** — "This panel reflects what each participant node actually has; it’s driven by the same Canton API the app uses."
- Expand **Canton API Log** — "These are real JSON Ledger API v2 requests and responses. No simulation."

**Stronger story:** Create a **second** contract (Client + Akash) before showing Akash’s view. Then when you switch to Akash he sees only his contract, and Nidhi still sees only hers. Drives home that each node only has its own data.

---

## Messages to stress for Canton

- **Sub-transaction privacy, not filtering** — Data is not sent to nodes that aren’t signatories/observers. It’s not "hide from UI"; the node doesn’t have it.
- **Protocol-level** — Canton enforces who sees what; the app doesn’t do privacy by filtering in the frontend.
- **Auditor pattern** — Aggregate-only templates (signatory client, observer auditor) so auditors get totals without ever seeing individual contracts or payment records.
- **Real stack** — Daml 3.4, Canton JSON Ledger API v2, same contracts on sandbox and DevNet.

---

## If something goes wrong

| Issue | What to try |
|-------|-------------|
| Blank page / "Syncing" forever | Check browser console. Ensure `freelancer-app/frontend/public/local-config.json` exists (re-run `./setup-local.sh`). |
| Sandbox not healthy | `docker compose logs sandbox`; wait longer or `docker compose up -d sandbox` again. |
| "DAR not found" on setup | From repo root: `docker exec cantonlance-sandbox bash -c 'cd /workspace/daml/freelance && daml build --no-legacy-assistant-warning'`, then re-run `./setup-local.sh`. |
| API version check fails | Ensure Vite is running and proxy is used: `curl -s http://localhost:5173/api/local/v2/version` (not localhost:6870 from host unless you’ve exposed it). |

---

## After the demo

- **Daml test:** You can say: "We have a Daml script test that asserts the privacy model — 5 active contracts, 9 transactions — so the behavior is reproducible." Run:  
  `docker run --rm -v $(pwd)/freelancer-app/daml/freelance:/workspace cantonlance-dev bash -c "cd /workspace && daml test --no-legacy-assistant-warning"`
- **Repo:** Point them to the README for setup, architecture, and project structure. The **How to Demo** section there matches this plan.

Good luck with the Canton Network presentation.
