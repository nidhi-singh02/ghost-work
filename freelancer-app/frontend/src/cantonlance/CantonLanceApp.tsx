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
      <span className="badge bg-success" style={{ fontSize: "0.7rem" }}>
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
        style={{ fontSize: "0.75rem" }}
      >
        <span
          className="d-inline-block rounded-circle me-1"
          style={{ width: "8px", height: "8px", backgroundColor: "#28a745" }}
        />
        {label}
      </button>
      {open && (
        <ul
          className="dropdown-menu dropdown-menu-end show"
          style={{ position: "absolute", right: 0, top: "100%", minWidth: "180px" }}
        >
          <li>
            <button
              className={`dropdown-item${activeEnvironment === "local" ? " active" : ""}`}
              onClick={() => handleSwitch("local")}
            >
              <span
                className="d-inline-block rounded-circle me-2"
                style={{ width: "8px", height: "8px", backgroundColor: "#28a745" }}
              />
              Local Sandbox
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item${activeEnvironment === "devnet" ? " active" : ""}`}
              onClick={() => handleSwitch("devnet")}
            >
              <span
                className="d-inline-block rounded-circle me-2"
                style={{ width: "8px", height: "8px", backgroundColor: "#28a745" }}
              />
              Canton DevNet
            </button>
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
      text: "Auditor verifies totals without seeing any individual rates, names, or milestones.",
    },
    {
      icon: "\u{1F512}",
      title: "Protocol-Level Enforcement",
      text: "Not access control. Not filtering. Canton physically withholds unauthorized data.",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        color: "#fff",
        padding: "2.5rem 2rem",
        borderRadius: "0.5rem",
        marginBottom: "1.5rem",
        position: "relative",
      }}
    >
      <button
        className="btn btn-sm btn-outline-light"
        style={{ position: "absolute", top: "0.75rem", right: "0.75rem", opacity: 0.6, fontSize: "0.7rem" }}
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
        GhostWork
      </h1>
      <p style={{ fontSize: "1.1rem", opacity: 0.9, maxWidth: "700px", marginBottom: "1.5rem" }}>
        Private freelancer payments on Canton L1. Every party sees{" "}
        <strong>only their own data</strong> &mdash; enforced at the protocol level,
        not by access control.
      </p>
      <div className="row g-3" style={{ maxWidth: "800px" }}>
        {features.map((f) => (
          <div className="col-md-4" key={f.title}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "0.5rem",
                padding: "1rem",
                height: "100%",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{f.text}</div>
            </div>
          </div>
        ))}
      </div>
      {demoStep === null && (
        <button
          className="btn btn-primary btn-sm mt-3"
          onClick={() => setDemoStep(0)}
        >
          Start Guided Demo
        </button>
      )}
    </div>
  );
};

const ConnectionBanner: React.FC = () => {
  const { isLoading, isConnected, devNetConfig, environments, activeEnvironment } = useStore();

  if (isConnected) {
    const isLocal = devNetConfig?.mode === "local";
    const modeLabel = isLocal ? "Local Sandbox" : "DevNet Connected";
    const badgeLabel = isLoading ? "Syncing..." : modeLabel;

    const otherEnv = activeEnvironment === "local" ? "devnet" : "local";
    const hasOtherEnv = !!environments[otherEnv];
    const otherEnvLabel = otherEnv === "local" ? "Local Sandbox" : "DevNet";

    return (
      <div className="alert alert-success py-2 d-flex align-items-center gap-2 mb-3">
        <span className="badge bg-success">{badgeLabel}</span>
        <small>
          Connected to <strong>{isLocal ? "Canton Sandbox" : "Canton DevNet"}</strong> at{" "}
          <code>{devNetConfig?.ledgerApiUrl}</code>. Privacy is enforced at the
          protocol level &mdash; each party sees <strong>only</strong> contracts
          they&apos;re authorized to see.
          {devNetConfig?.deployedAt && (
            <span className="text-muted">
              {" "}
              Deployed: {new Date(devNetConfig.deployedAt).toLocaleString()}
            </span>
          )}
          {hasOtherEnv && (
            <span className="text-muted">
              {" "}| {otherEnvLabel} also available
            </span>
          )}
        </small>
      </div>
    );
  }

  return (
    <div className="alert alert-warning py-2 d-flex align-items-center gap-2 mb-3">
      <span className="badge bg-warning text-dark">Not Connected</span>
      <small>
        No ledger connection. Run <code>docker compose up</code> then{" "}
        <code>./setup-local.sh</code> to start the local sandbox.
      </small>
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
        className="navbar navbar-dark mb-4"
        style={{
          backgroundColor: partyColor,
          transition: "background-color 0.4s ease",
        }}
      >
        <div className="container">
          <span className="navbar-brand fw-bold">
            GhostWork
          </span>
          <span className="navbar-text text-light d-flex align-items-center gap-2">
            Private Freelancer Payment Protocol
            {isConnected && <EnvironmentSelector />}
          </span>
        </div>
      </nav>

      <div className="container">
        <HeroSection />
        <ConnectionBanner />
        <PartySwitcher />

        {isLoading && (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <small className="ms-2 text-muted">Querying Canton participant node...</small>
          </div>
        )}

        <div className="mt-3">
          {activeParty === "client" && <ClientView />}
          {(activeParty === "freelancerA" ||
            activeParty === "freelancerB") && <FreelancerView />}
          {activeParty === "auditor" && <AuditorView />}
        </div>

        <PrivacyComparisonPanel />
        <ApiProofPanel />

        <footer className="mt-5 mb-3 text-center text-muted" style={{ paddingBottom: "4rem" }}>
          <small>
            Built on Canton L1 &mdash; Sub-transaction privacy ensures each
            party only sees their own data. ETHDenver 2026.
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
