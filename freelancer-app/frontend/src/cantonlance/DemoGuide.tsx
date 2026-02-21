import React from "react";
import { useStore } from "./store";

const DEMO_STEPS = [
  {
    title: "Welcome to GhostWork",
    text: "This guided demo shows how Canton's sub-transaction privacy works. Each party has a fundamentally different view of the ledger \u2014 enforced at the protocol level.",
    action: "Click Next to begin.",
  },
  {
    title: "Step 1: Create a Contract",
    text: "You're viewing as the Ethereum Foundation (Client). Click \"+\u00a0New\u00a0Contract\" to hire Nidhi. Fill in a project description, rate, budget, and milestones.",
    action: "Create a contract, then click Next.",
    highlight: "createContract",
  },
  {
    title: "Step 2: Switch to Nidhi",
    text: "Click \"Nidhi (Freelancer)\" in the party switcher. Notice she can ONLY see her own contract \u2014 the navbar changes color to show you're viewing a different participant node.",
    action: "Switch to Nidhi, then click Next.",
    highlight: "partyAlice",
  },
  {
    title: "Step 3: Submit a Milestone",
    text: "As Nidhi, click \"Submit Milestone 1\" to mark progress on the contract. The Ethereum Foundation will need to approve and pay for this milestone.",
    action: "Submit a milestone, then click Next.",
    highlight: "submitMilestone",
  },
  {
    title: "Step 4: Check Akash's View",
    text: "Switch to \"Akash (Freelancer)\". He sees ZERO contracts. Nidhi's data was never sent to Akash's participant node \u2014 it's not filtered, it's physically absent.",
    action: "Switch to Akash, then click Next.",
    highlight: "partyBob",
  },
  {
    title: "Step 5: Check the Auditor",
    text: "Switch to \"Eve (Auditor)\". She sees zero individual contracts and zero payments. The auditor's node has never received this data.",
    action: "Switch to Eve, then click Next.",
    highlight: "partyAuditor",
  },
  {
    title: "Step 6: Generate Audit Summary",
    text: "Switch back to the Client. Click \"Approve & Pay\" to pay for the milestone, then click \"Generate Audit Summary\". This creates an aggregate-only report visible to the auditor.",
    action: "Approve the milestone, generate the audit, then click Next.",
    highlight: "generateAudit",
  },
  {
    title: "That's Canton Privacy",
    text: "Switch to the Auditor \u2014 she now sees aggregate totals (total contracts, total paid) but ZERO individual details. Each party's participant node only received data they're authorized to see. Not filtered. Not hidden. Physically absent from the node.",
    action: "Scroll down to see the API Proof Panel and Privacy Comparison.",
  },
];

const DemoGuide: React.FC = () => {
  const { demoStep, setDemoStep } = useStore();

  if (demoStep === null) return null;

  const step = DEMO_STEPS[demoStep];
  if (!step) return null;

  const isFirst = demoStep === 0;
  const isLast = demoStep === DEMO_STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes cl-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(13, 110, 253, 0); }
        }
        .cl-highlight { animation: cl-pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1070,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "#fff",
          padding: "1rem 1.5rem",
          borderTop: "3px solid #0d6efd",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className="container d-flex align-items-center gap-3">
          <div
            style={{
              backgroundColor: "#0d6efd",
              color: "#fff",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
              flexShrink: 0,
            }}
          >
            {demoStep + 1}/{DEMO_STEPS.length}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.2rem" }}>
              {step.title}
            </div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>
              {step.text}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: "0.15rem" }}>
              {step.action}
            </div>
          </div>
          <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
            {!isFirst && (
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => setDemoStep(demoStep - 1)}
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setDemoStep(demoStep + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="btn btn-success btn-sm"
                onClick={() => setDemoStep(null)}
              >
                Finish
              </button>
            )}
            <button
              className="btn btn-sm"
              style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}
              onClick={() => setDemoStep(null)}
            >
              End
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoGuide;

export { DEMO_STEPS };
