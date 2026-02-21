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
    text: "You're viewing as the Ethereum Foundation (Client). Use the \"+ New Contract\" form to hire Nidhi. Fill in a project description, rate, budget, and milestones.",
    action: "Create a contract, then click Next.",
    highlight: "createContract",
  },
  {
    title: "Step 2: Switch to Nidhi",
    text: "Open the account menu in the top-right corner of the navbar and select \"Nidhi\". Notice she can ONLY see her own contract \u2014 the context bar updates to show you're viewing a different participant node.",
    action: "Switch to Nidhi, then click Next.",
    highlight: "partyAlice",
  },
  {
    title: "Step 3: Submit a Milestone",
    text: "As Nidhi, click \"Submit Milestone 1 \u2192\" to mark progress on the contract. The Ethereum Foundation will need to approve and pay for this milestone.",
    action: "Submit a milestone, then click Next.",
    highlight: "submitMilestone",
  },
  {
    title: "Step 4: Check Akash's View",
    text: "Open the account menu and switch to \"Akash\". He sees ZERO contracts. Nidhi's data was never sent to Akash's participant node \u2014 it's not filtered, it's physically absent.",
    action: "Switch to Akash, then click Next.",
    highlight: "partyBob",
  },
  {
    title: "Step 5: Check the Auditor",
    text: "Open the account menu and switch to \"Eve\". She sees zero individual contracts and zero payments. The auditor's node has never received this data.",
    action: "Switch to Eve, then click Next.",
    highlight: "partyAuditor",
  },
  {
    title: "Step 6: Generate Audit Summary",
    text: "Switch back to the Client via the account menu. Click \"Approve & Pay\" to pay for the milestone, then click \"Generate Audit Summary\". This creates an aggregate-only report visible to the auditor.",
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
  const progress = ((demoStep + 1) / DEMO_STEPS.length) * 100;

  return (
    <>
      <style>{`
        @keyframes gw-demo-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 168, 0, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(20, 168, 0, 0); }
        }
        .gw-demo-highlight { animation: gw-demo-pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1070,
          background: "#fff",
          borderTop: "2px solid #14A800",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: "3px", backgroundColor: "#f0f0f0" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#14A800",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Step counter */}
          <div
            style={{
              backgroundColor: "#14A800",
              color: "#fff",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.8rem",
              flexShrink: 0,
            }}
          >
            {demoStep + 1}/{DEMO_STEPS.length}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#001e00", marginBottom: "3px" }}>
              {step.title}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#001e00", lineHeight: 1.4 }}>
              {step.text}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#5e6d55", marginTop: "4px" }}>
              {step.action}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
            {!isFirst && (
              <button
                className="gw-btn-outline"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => setDemoStep(demoStep - 1)}
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                className="gw-btn-primary"
                style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                onClick={() => setDemoStep(demoStep + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="gw-btn-primary"
                style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                onClick={() => setDemoStep(null)}
              >
                Finish
              </button>
            )}
            <button
              style={{
                background: "none",
                border: "none",
                color: "#5e6d55",
                fontSize: "0.72rem",
                cursor: "pointer",
                padding: "4px 8px",
              }}
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
