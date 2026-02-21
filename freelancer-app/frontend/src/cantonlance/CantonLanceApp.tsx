import React, { useState } from "react";
import { StoreProvider, useStore } from "./store";
import PartySwitcher from "./PartySwitcher";
import ClientView from "./ClientView";
import FreelancerView from "./FreelancerView";
import AuditorView from "./AuditorView";
import ApiProofPanel from "./ApiProofPanel";
import PrivacyComparisonPanel from "./PrivacyComparisonPanel";
import { EnvironmentKey } from "./cantonApi";

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

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold">
            CantonLance
          </span>
          <span className="navbar-text text-light d-flex align-items-center gap-2">
            Private Freelancer Payment Protocol
            {isConnected && <EnvironmentSelector />}
          </span>
        </div>
      </nav>

      <div className="container">
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

        <footer className="mt-5 mb-3 text-center text-muted">
          <small>
            Built on Canton L1 &mdash; Sub-transaction privacy ensures each
            party only sees their own data. ETHDenver 2026.
          </small>
        </footer>
      </div>
    </div>
  );
};

const CantonLanceApp: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default CantonLanceApp;
