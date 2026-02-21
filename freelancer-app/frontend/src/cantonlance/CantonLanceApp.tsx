import React, { useState } from "react";
import { StoreProvider, useStore } from "./store";
import PartySwitcher from "./PartySwitcher";
import ClientView from "./ClientView";
import FreelancerView from "./FreelancerView";
import AuditorView from "./AuditorView";
import ApiProofPanel from "./ApiProofPanel";
import PrivacyComparisonPanel from "./PrivacyComparisonPanel";
import ToastNotifications from "./ToastNotifications";
import DemoGuide from "./DemoGuide";
import { EnvironmentKey } from "./cantonApi";
import { PARTIES } from "./types";

const EnvironmentSelector: React.FC = () => {
  const { environments, activeEnvironment, switchEnvironment, isConnected } = useStore();
  const [open, setOpen] = useState(false);

  if (!isConnected) return null;

  const hasLocal = !!environments.local;
  const hasDevnet = !!environments.devnet;
  const hasBoth = hasLocal && hasDevnet;
  const label = activeEnvironment === "local" ? "SANDBOX" : "DEVNET";

  if (!hasBoth) {
    return (
      <span className="badge bg-success" style={{ fontSize: "0.65rem", verticalAlign: "middle" }}>
        {label}
      </span>
    );
  }

  const handleSwitch = (env: EnvironmentKey) => {
    switchEnvironment(env);
    setOpen(false);
  };

  return (
    <div className="dropdown d-inline-block" style={{ position: "relative" }}>
      <button
        className="btn btn-sm btn-outline-light dropdown-toggle py-0 px-2"
        type="button"
        onClick={() => setOpen(!open)}
        style={{ fontSize: "0.7rem" }}
      >
        {label}
      </button>
      {open && (
        <ul
          className="dropdown-menu dropdown-menu-end show"
          style={{ position: "absolute", right: 0, top: "100%", minWidth: "160px" }}
        >
          <li>
            <button
              className={`dropdown-item${activeEnvironment === "local" ? " active" : ""}`}
              onClick={() => handleSwitch("local")}
            >Local Sandbox</button>
          </li>
          <li>
            <button
              className={`dropdown-item${activeEnvironment === "devnet" ? " active" : ""}`}
              onClick={() => handleSwitch("devnet")}
            >Canton DevNet</button>
          </li>
        </ul>
      )}
    </div>
  );
};

const HeroSection: React.FC = () => {
  const { visibleContracts, isConnected, demoStep, setDemoStep } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || visibleContracts.length > 0 || !isConnected) return null;

  const features = [
    {
      icon: "\u{1F6E1}",
      title: "Sub-Transaction Privacy",
      text: "Nidhi never sees Akash's contract. The data never reaches their node.",
    },
    {
      icon: "\u{1F50D}",
      title: "Aggregate-Only Auditing",
      text: "Auditor verifies totals without seeing individual rates or names.",
    },
    {
      icon: "\u{1F512}",
      title: "Protocol-Level Enforcement",
      text: "Canton physically withholds unauthorized data. Not access control.",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        color: "#fff",
        padding: "2rem 1.5rem",
        borderRadius: "0.5rem",
        marginBottom: "1rem",
        position: "relative",
      }}
    >
      <button
        className="btn btn-sm btn-outline-light"
        style={{ position: "absolute", top: "0.5rem", right: "0.5rem", opacity: 0.5, fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}
        onClick={() => setDismissed(true)}
      >
        &#x2715;
      </button>
      <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.3rem" }}>
        GhostWork
      </h2>
      <p style={{ fontSize: "0.95rem", opacity: 0.85, maxWidth: "600px", marginBottom: "1.2rem" }}>
        Private freelancer payments on Canton L1. Every party sees{" "}
        <strong>only their own data</strong> &mdash; enforced at the protocol level.
      </p>
      <div className="row g-2" style={{ maxWidth: "720px" }}>
        {features.map((f) => (
          <div className="col-md-4" key={f.title}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: "0.4rem",
                padding: "0.75rem",
                height: "100%",
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: "0.15rem" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "0.72rem", opacity: 0.75 }}>{f.text}</div>
            </div>
          </div>
        ))}
      </div>
      {demoStep === null && (
        <button
          className="btn btn-primary btn-sm mt-3"
          style={{ fontSize: "0.8rem" }}
          onClick={() => setDemoStep(0)}
        >
          Start Guided Demo
        </button>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeParty, isLoading, isConnected } = useStore();

  const partyColor = PARTIES[activeParty].color;

  return (
    <div>
      <ToastNotifications />
      <nav
        className="navbar navbar-dark py-2"
        style={{
          backgroundColor: partyColor,
          transition: "background-color 0.4s ease",
        }}
      >
        <div className="container">
          <span className="navbar-brand fw-bold" style={{ fontSize: "1.1rem" }}>
            GhostWork
          </span>
          <span className="navbar-text text-light d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
            Private Freelancer Payment Protocol
            {isConnected && <EnvironmentSelector />}
          </span>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: "1rem" }}>
        <HeroSection />
        <PartySwitcher />

        {isLoading && (
          <div className="text-center py-1">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
            <small className="ms-2 text-muted">Syncing...</small>
          </div>
        )}

        <div className="mt-2">
          {activeParty === "client" && <ClientView />}
          {(activeParty === "freelancerA" ||
            activeParty === "freelancerB") && <FreelancerView />}
          {activeParty === "auditor" && <AuditorView />}
        </div>

        <PrivacyComparisonPanel />
        <ApiProofPanel />

        <footer className="mt-4 mb-3 text-center text-muted" style={{ paddingBottom: "4rem" }}>
          <small style={{ fontSize: "0.75rem" }}>
            Built on Canton L1 &mdash; Sub-transaction privacy. ETHDenver 2026.
          </small>
        </footer>
      </div>
      <DemoGuide />
    </div>
  );
};

const GhostWorkApp: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default GhostWorkApp;
