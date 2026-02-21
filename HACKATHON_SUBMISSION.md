# GhostWork: ETHDenver 2026 Hackathon Submission

---

## The Problem It Solves

Freelancing is broken in a very specific way that nobody talks about: **everyone can see everyone else's deal**.

When you hire a freelancer through an on-chain contract today, whether it's on Ethereum, Solana, or any public L1, the entire world can see what you're paying them. Your competitor can look up your dev budget. Other freelancers on the same project can see what each other earns. An auditor reviewing your books gets full access to every individual payment, name, and rate.

This isn't a theoretical problem. It's why most serious freelance payments still happen through bank wires and PDFs, because the moment you put a contractor agreement on a public blockchain, you've published salary data to the world.

**GhostWork fixes this using Canton's sub-transaction privacy.** Not with access control lists. Not with encryption wrappers. At the *protocol level*, each participant's node physically receives only the data they're authorized to see.

Here's what that actually looks like in practice:

- **The Client (Ethereum Foundation)** sees all their contracts and payment records. They're a signatory on everything they created.
- **Freelancer Nidhi** sees only her own contract and payments. She has zero knowledge that Akash even exists on the platform. His data was never sent to her participant node.
- **Freelancer Akash** sees only his own contract. Nidhi's rates, project descriptions, and payment history are physically absent from his node.
- **Auditor Eve** sees aggregate totals only: "2 contracts, $7,000 total paid." Zero individual details. No names, no rates, no project descriptions.

This isn't filtering. It's not hiding rows in a database. The data literally does not exist on nodes that shouldn't have it. That's the difference between access control and actual privacy.

### What People Can Use It For

- **Freelance platforms** that want to stop rate-comparison shopping between contractors
- **Enterprise contractor management** where different departments shouldn't see each other's vendor deals
- **Compliance auditing** where auditors need to verify totals without seeing individual records (think SOC 2 aggregate reporting)
- **Any B2B payment workflow** where counterparty confidentiality matters: invoice financing, consulting fees, advisory retainers

The guided demo walks you through the full lifecycle in about 3 minutes: send a proposal, accept it, submit milestones, approve payments, generate an audit. You switch between accounts at each step to prove what each party can and cannot see.

---

## Challenges I Ran Into

### 1. ARM64 on macOS: The Silent Killer

I'm building on an M1 Mac. The Canton/Daml SDK ships Linux x86_64 binaries. The **cn-quickstart** Docker image is Ubuntu-based. Getting all three to play nice together cost me almost a full day.

The fix was building a custom Docker dev image (**cantonlance-dev**) with JDK 21, Node.js 20, and the ARM64 Daml SDK (**daml-sdk-3.4.10-linux-aarch64.tar.gz**). Once I had that, everything ran natively without emulation. But the initial repo setup docs assume x86_64, and there's zero mention of ARM anywhere.

### 2. The Canton JSON Ledger API v2 Response Format

The documentation for the JSON Ledger API v2 is... sparse. I spent hours figuring out that **POST /v2/state/active-contracts** returns a deeply nested structure:

    {
      "contractEntry": {
        "JsActiveContract": {
          "createdEvent": {
            "templateId": "packageId:Module:Template",
            "createArgument": { ... },
            "contractId": "..."
          }
        }
      }
    }

There's no example of this in the docs. I had to reverse-engineer it by logging raw responses and walking through the nesting. The **submit-and-wait-for-transaction** response format for extracting contract IDs from exercise results was another puzzle. The created events from an exercise choice come back in a **transaction.events** array where you need to skip **ArchivedEvent** entries and find the last **CreatedEvent**.

### 3. Daml's Signatory Model: You Can't Cheat

Coming from Solidity, my first instinct was to have the client create a **ProjectContract** directly with both parties as signatories. Daml said no. You can't create a contract that requires someone else's signature without their consent.

This forced me into the propose-accept pattern, which is actually a much better design:

    -- Client creates a proposal (only client is signatory)
    template ProjectProposal
      with
        client : Party
        freelancer : Party
      where
        signatory client
        observer freelancer

        choice AcceptProposal : ContractId ProjectContract
          controller freelancer  -- freelancer must consent
          do
            create ProjectContract with ...  -- now both are signatories

What felt like a limitation turned out to be the right abstraction. Proposals show up in the freelancer's "Incoming Proposals" and they explicitly accept or decline. Much more honest than auto-enrolling someone in a contract.

### 4. DevNet Sequencer Outage

I had the app working on local sandbox and tried to deploy to Canton DevNet. Got the validator running, onboarded to the network, set up JWT auth. Everything looked good. Then the DevNet sequencers went down. The validator couldn't register the synchronizer domain, so no transactions could be submitted.

I pivoted to making the local sandbox experience bulletproof instead. The app detects which environments are available on startup and lets you switch between them. The DevNet code path still exists and works. It's just waiting for the sequencers to come back.

### 5. Sandbox Auth: The Token Header That Wasn't

Canton's local sandbox mode doesn't need authentication. Sounds simple. But if you send an **Authorization** header with an empty token, the Pekko HTTP server throws "Illegal header" warnings into the logs constantly. The fix was conditionally skipping the header entirely in sandbox mode:

    if (this.config.mode === "local") {
      // Sandbox: skip Authorization header entirely to avoid
      // Pekko HTTP "Illegal header" warnings
    } else {
      headers["Authorization"] = "Bearer " + partyConfig.token;
    }

Small thing, but it took a while to figure out why the logs were full of warnings.

---

## Use of AI Tools and Agents

I used **Claude Code** (Anthropic's CLI agent) as a pair programming partner throughout the build. Here's how:

**What Claude handled well:**
- Scaffolding React components from rough descriptions. I'd describe the UI I wanted and it would generate the JSX, then I'd tweak styling and logic
- Refactoring across multiple files simultaneously. When I changed the Daml contract to add **paymentTimestamp**, Claude updated the test file, the API client, and the frontend store in one pass
- Catching type errors before build. It would flag missing fields in TypeScript interfaces before I even ran **tsc**

**What I had to do myself:**
- All Daml contract design decisions: the privacy model, signatory/observer assignments, and the propose-accept pattern were my architectural choices
- Canton API integration. Claude doesn't know the JSON Ledger API v2 response format, so I had to debug the actual HTTP responses and teach it the nesting structure
- DevNet deployment: SSH tunnels, JWT configuration, validator onboarding. This was all manual infrastructure work
- UX decisions: which party sees what, the demo guide flow, the "not connected" landing page design

**The workflow was roughly:** I'd design the approach, write the critical integration code, then use Claude to parallelize the UI implementation across multiple files. It saved significant time on repetitive frontend tasks, but every Daml contract line and every Canton API call was hand-verified against the actual ledger responses.

---

## Technologies Used

- **Daml 3.4.10**: Smart contract language for Canton (4 templates: ProjectProposal, ProjectContract, PaymentRecord, AuditSummary)
- **Canton L1 Sandbox**: Local participant node running via daml sandbox
- **Canton JSON Ledger API v2**: REST API for contract queries and command submission
- **React 18**: Frontend UI with Context/Provider state management
- **TypeScript 5**: Strict typing across frontend (zero "any" types)
- **Vite 6**: Build tool and dev server with proxy to Canton API
- **Docker Compose**: Two-service stack (sandbox + frontend)
- **Claude Code**: AI pair programming assistant

---

## Tracks Applied

---

### Track 1: Best Privacy-Focused dApp Using Daml ($8,000)

GhostWork is a private freelancer payment protocol that demonstrates Canton's sub-transaction privacy through a real-world use case: hiring and paying contractors where each party sees only what they should.

#### Privacy Model: How It Actually Works

The privacy model is enforced entirely through Daml's signatory/observer system. There's no client-side filtering, no backend middleware hiding data. The Canton participant node for each party physically receives only the contracts where that party is a signatory or observer.

Here are the four Daml templates and who can see what:

    -- Only client + freelancer can see this. Other freelancers' nodes
    -- never receive it.
    template ProjectContract
      with
        client : Party
        freelancer : Party
        ...
      where
        signatory client, freelancer

    -- Only client + freelancer. Immutable payment receipt.
    template PaymentRecord
      with
        client : Party
        freelancer : Party
        ...
      where
        signatory client, freelancer

    -- Auditor is an observer, sees aggregates only.
    -- They CANNOT see any ProjectContract or PaymentRecord.
    template AuditSummary
      with
        client : Party
        auditor : Party
        totalContractsCount : Int
        totalAmountPaid : Decimal
        reportPeriod : Text
      where
        signatory client
        observer auditor

    -- Proposal: only client + target freelancer can see it.
    template ProjectProposal
      with
        client : Party
        freelancer : Party
        ...
      where
        signatory client
        observer freelancer

The privacy test (**FreelanceTest.daml**) formally verifies this:

    -- Freelancer A sees ONLY their own contract
    freelancerAAllContracts <- query @ProjectContract freelancerA
    assertMsg "FreelancerA should see only 1 contract total"
      (length freelancerAAllContracts == 1)

    -- Auditor sees 0 contracts, 0 payments, just the summary
    auditorContracts <- query @ProjectContract auditor
    assertMsg "Auditor should see 0 project contracts"
      (length auditorContracts == 0)

    auditorPayments <- query @PaymentRecord auditor
    assertMsg "Auditor should see 0 payment records"
      (length auditorPayments == 0)

#### The Propose-Accept Pattern

Rather than auto-creating contracts, GhostWork uses Daml's native propose-accept pattern. A client sends a **ProjectProposal** (they're the sole signatory), and the freelancer must explicitly exercise **AcceptProposal** to create the **ProjectContract** (where both become signatories). This ensures genuine consent. You can't bind someone to a contract without their action.

The UI surfaces this naturally: the client sees "Pending Proposals" with an "Awaiting Acceptance" status, while the freelancer sees "Incoming Proposals" with Accept/Decline buttons.

#### Real Canton API Integration, No Mock Data

Every action in the UI fires a real HTTP request to the Canton JSON Ledger API v2:

    // Querying contracts: the response ONLY contains what this party can see
    const response = await this.apiRequestRaw(
      "POST",
      "/v2/state/active-contracts",
      {
        filter: {
          filtersByParty: {
            [partyId]: {
              cumulative: [{
                identifierFilter: {
                  WildcardFilter: { value: { includeCreatedEventBlob: false } }
                }
              }]
            }
          }
        },
        verbose: true,
        activeAtOffset: offset,
      },
      party
    );

The API Proof Panel in the UI logs every request and response, so anyone reviewing the app can see the actual JSON going to and from Canton. Raw proof that the privacy model works.

#### Dynamic Party Creation

Users can create new Canton parties from the UI. This calls **POST /v2/parties** to allocate a party on the ledger, then **POST /v2/users** to grant actAs/readAs rights. Real Canton party management, not UI fakery:

    async allocateParty(hint: string, displayName: string): Promise<string> {
      const response = await fetch(this.config.ledgerApiUrl + "/v2/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyIdHint: hint, displayName }),
      });
      const data = await response.json();
      return data?.partyDetails?.party;
    }

#### What Makes This Different from Public Chain Freelance Platforms

| Feature | Public L1 (Ethereum) | GhostWork (Canton) |
|---------|---------------------|-------------------|
| Contract visibility | Everyone sees everything | Only parties on the contract |
| Payment amounts | Public | Only client + freelancer |
| Freelancer rates | Public | Invisible to other freelancers |
| Audit access | Full individual records | Aggregate totals only |
| Privacy mechanism | None (or encryption bolt-on) | Protocol-level sub-transaction |

---

### Track 2, Sub-Track A: Best Functional Developer Tooling & Integration PoCs ($3,000)

GhostWork doubles as a **complete reference implementation** for building privacy-first dApps on Canton. Coming from Ethereum/Solidity, I had to figure out every step myself and built the tooling to make it reproducible. We're shipping two open-source tools that address different layers of the Canton developer experience.

#### Tool 1: GhostWork as a Canton Starter Kit

**One-command setup (setup-local.sh)** takes you from "I just pulled the repo" to a running Canton app with parties and contracts. It automates the 5 steps no existing quickstart handles end-to-end: sandbox health polling, DAR upload, party allocation via **POST /v2/parties**, user creation with actAs/readAs rights, and writing a runtime config the frontend reads automatically.

**Canton JSON Ledger API v2 TypeScript client.** There is no official TypeScript SDK for this API. We wrote one. **cantonApi.ts** is a fully typed client that handles contract queries, command submission (create + exercise), and dynamic party management. It supports both sandbox (no auth) and DevNet (JWT Bearer tokens), auto-resolves package IDs from the ledger, and logs every API call for the built-in proof panel.

**Docker Compose for ARM64.** The cn-quickstart image assumes x86_64. Our stack uses a custom image with JDK 21, Node 20, and the aarch64 Daml SDK, so it runs natively on Apple Silicon. Includes the undocumented **socat** workaround for exposing the JSON API (daml sandbox binds to localhost only inside Docker).

**Runtime environment switching.** The app auto-detects local sandbox and DevNet configs on startup, lets you hot-switch between them without reloading.

#### Tool 2: Canton DevNet Server Status Checker
**[github.com/nidhi-singh02/canton-dev-server](https://github.com/nidhi-singh02/canton-dev-server)**

Built out of frustration from SSH-ing into DevNet servers one at a time during the hackathon. This standalone tool checks all 15 Canton hackathon endpoints in parallel (5 SSH DevNet servers + 10 web services: docs, explorers, wallets, onboarding API) and gives you the answer in under 5 seconds.

Two interfaces: a **web dashboard** (dark theme, auto-refresh, color-coded with response times) and a **CLI** with one-shot, watch, and JSON output modes. TCP sockets for SSH, HTTPS HEAD-with-GET-fallback for web, all concurrent via Promise.all(). Would have saved me hours when the DevNet sequencers went down and I thought it was my code.

#### Friction Log (5 Technical Cliffs)

1. **No TypeScript SDK for JSON Ledger API v2**: response format is deeply nested (contractEntry.JsActiveContract.createdEvent) and undocumented
2. **daml sandbox binds to localhost only in Docker**: needs socat to expose port 6870 to other containers
3. **ARM64 SDK path**: the aarch64 SDK exists but isn't mentioned in quickstart docs. M1/M2 devs hit this immediately
4. **submit-and-wait-for-transaction vs submit-and-wait**: difference isn't well-explained. You need the former for contract IDs back, the latter for confirmation only
5. **Pekko HTTP token warnings**: empty Authorization header in sandbox mode triggers constant log noise. Fix: conditionally omit the header

Any developer wanting to build a privacy-first dApp on Canton can fork GhostWork and be running in under 5 minutes. Anyone hitting infra issues can spin up the status checker in 10 seconds. The goal: reduce friction at every layer of the stack.
