import React from "react";
import { StoreProvider, useStore } from "./store";
import PartySwitcher from "./PartySwitcher";
import ClientView from "./ClientView";
import FreelancerView from "./FreelancerView";
import AuditorView from "./AuditorView";
import ApiProofPanel from "./ApiProofPanel";
import PrivacyComparisonPanel from "./PrivacyComparisonPanel";

const ConnectionBanner: React.FC = () => {
  const { isLoading, isConnected, devNetConfig } = useStore();

  if (isConnected) {
    return (
      <div className="alert alert-success py-2 d-flex align-items-center gap-2 mb-3">
        <span className="badge bg-success">
          {isLoading ? "Syncing..." : "DevNet Connected"}
        </span>
        <small>
          Connected to <strong>Canton DevNet</strong> at{" "}
          <code>{devNetConfig?.ledgerApiUrl}</code>. All data comes from real
          Canton participant nodes. Privacy is enforced at the protocol level
          &mdash; each party&apos;s JWT authenticates to their participant node,
          and the API returns <strong>only</strong> contracts they&apos;re
          authorized to see.
          {devNetConfig?.deployedAt && (
            <span className="text-muted">
              {" "}
              Deployed: {new Date(devNetConfig.deployedAt).toLocaleString()}
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
        Waiting for Canton DevNet connection. Run{" "}
        <code>./deploy-devnet.sh</code> to deploy contracts and generate
        the config file, then restart the frontend.
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
            {isConnected && (
              <span className="badge bg-success" style={{ fontSize: "0.7rem" }}>
                DEVNET
              </span>
            )}
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
