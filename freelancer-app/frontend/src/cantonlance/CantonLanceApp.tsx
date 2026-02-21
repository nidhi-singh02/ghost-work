import React, { useState } from "react";
import { StoreProvider, useStore } from "./store";
import ClientView from "./ClientView";
import FreelancerView from "./FreelancerView";
import AuditorView from "./AuditorView";
import ApiProofPanel from "./ApiProofPanel";
import PrivacyComparisonPanel from "./PrivacyComparisonPanel";
import ToastNotifications from "./ToastNotifications";
import DemoGuide from "./DemoGuide";
import CreateAccountModal from "./CreateAccountModal";
import { PRESET_PARTIES, PartyRoleCategory } from "./types";

/* ── Global Styles ──────────────────────────────────────────────── */

const GlobalStyles: React.FC = () => (
  <style>{`
    body {
      background: #f9fafb !important;
      color: #001e00 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif !important;
    }
    .gw-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s ease;
    }
    .gw-card:hover {
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .gw-card-static {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .gw-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }
    .gw-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 0.7rem;
      flex-shrink: 0;
    }
    .gw-avatar-xs {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 0.6rem;
      flex-shrink: 0;
    }
    .gw-status-pill {
      border-radius: 100px;
      padding: 3px 12px;
      font-size: 0.72rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .gw-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #001e00;
      line-height: 1.2;
    }
    .gw-stat-label {
      font-size: 0.75rem;
      color: #5e6d55;
      font-weight: 500;
    }
    .gw-progress {
      height: 6px;
      border-radius: 3px;
      background: #e0e0e0;
      overflow: hidden;
    }
    .gw-progress-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .gw-btn-primary {
      background: #14A800;
      border: none;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 8px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .gw-btn-primary:hover { background: #118a00; }
    .gw-btn-primary:disabled { background: #a3d99b; cursor: not-allowed; }
    .gw-btn-outline {
      background: transparent;
      border: 2px solid #14A800;
      color: #14A800;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 6px 18px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .gw-btn-outline:hover { background: #14A800; color: #fff; }
    .gw-btn-secondary {
      background: #f3f4f6;
      border: 1px solid #e0e0e0;
      color: #001e00;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.85rem;
      padding: 8px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .gw-btn-secondary:hover { background: #e5e7eb; }
    .gw-section-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #5e6d55;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .gw-navbar {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      padding: 10px 0;
    }
    .gw-account-btn {
      background: none;
      border: 1px solid #e0e0e0;
      border-radius: 100px;
      padding: 4px 14px 4px 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-size: 0.85rem;
      color: #001e00;
    }
    .gw-account-btn:hover {
      border-color: #14A800;
      box-shadow: 0 0 0 2px rgba(20,168,0,0.1);
    }
    .gw-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      min-width: 260px;
      z-index: 1060;
      overflow: hidden;
    }
    .gw-dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 0.85rem;
      color: #001e00;
    }
    .gw-dropdown-item:hover { background: #f0fdf4; }
    .gw-dropdown-item.active { background: #f0fdf4; }
    @keyframes gw-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(20,168,0,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(20,168,0,0); }
    }
    @keyframes gw-spin {
      to { transform: rotate(360deg); }
    }
    /* ── Responsive breakpoints ─────────────────────────── */
    @media (max-width: 768px) {
      .gw-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .gw-form-grid-2 { grid-template-columns: 1fr !important; }
      .gw-form-grid-3 { grid-template-columns: 1fr !important; }
      .gw-privacy-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .gw-api-detail-grid { grid-template-columns: 1fr !important; }
      .gw-milestone-actions { flex-wrap: wrap; }
      .gw-action-bar { flex-direction: column; align-items: stretch !important; gap: 8px !important; }
      .gw-action-bar > div { justify-content: center; }
      .gw-auditor-metrics { grid-template-columns: 1fr !important; }
      .gw-navbar .container { padding-left: 12px !important; padding-right: 12px !important; }
      .gw-dropdown { min-width: 240px !important; right: -8px !important; }
    }
    @media (max-width: 480px) {
      .gw-stats-grid { grid-template-columns: 1fr !important; }
      .gw-privacy-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ── Account Switcher ──────────────────────────────────────────── */

const AccountSwitcher: React.FC = () => {
  const { activeParty, setActiveParty, allParties } = useStore();
  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const party = allParties[activeParty] || PRESET_PARTIES.client;

  // Preset parties first, then dynamic
  const presetOrder = ["client", "freelancerA", "freelancerB", "auditor"];
  const dynamicKeys = Object.keys(allParties).filter((k) => !presetOrder.includes(k));

  return (
    <div style={{ position: "relative" }}>
      <button className="gw-account-btn" onClick={() => setOpen(!open)} data-gw-id="accountSwitcher">
        <div className="gw-avatar-sm" style={{ background: party.color }}>{party.avatar}</div>
        <span style={{ fontWeight: 600 }}>{party.shortName}</span>
        <span style={{ fontSize: "0.55rem", opacity: 0.4 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 1059 }} onClick={() => setOpen(false)} />
          <div className="gw-dropdown">
            {/* Test Accounts section */}
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #e0e0e0" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5e6d55", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Test Accounts
              </span>
            </div>
            {presetOrder.map((key) => {
              const p = allParties[key];
              if (!p) return null;
              const isActive = key === activeParty;
              return (
                <button
                  key={key}
                  className={`gw-dropdown-item${isActive ? " active" : ""}`}
                  onClick={() => { setActiveParty(key); setOpen(false); }}
                  data-gw-id={`party-${key}`}
                >
                  <div className="gw-avatar-sm" style={{ background: p.color }}>{p.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.shortName}</div>
                    <div style={{ fontSize: "0.72rem", color: "#5e6d55" }}>{p.role}</div>
                  </div>
                  {isActive && <span style={{ marginLeft: "auto", color: "#14A800", fontWeight: 600, fontSize: "0.72rem" }}>Active</span>}
                </button>
              );
            })}
            {/* Dynamic accounts section */}
            {dynamicKeys.length > 0 && (
              <>
                <div style={{ padding: "12px 16px 8px", borderTop: "1px solid #e0e0e0" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5e6d55", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Your Accounts
                  </span>
                </div>
                {dynamicKeys.map((key) => {
                  const p = allParties[key];
                  if (!p) return null;
                  const isActive = key === activeParty;
                  return (
                    <button
                      key={key}
                      className={`gw-dropdown-item${isActive ? " active" : ""}`}
                      onClick={() => { setActiveParty(key); setOpen(false); }}
                      data-gw-id={`party-${key}`}
                    >
                      <div className="gw-avatar-sm" style={{ background: p.color }}>{p.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.shortName}</div>
                        <div style={{ fontSize: "0.72rem", color: "#5e6d55" }}>{p.role}</div>
                      </div>
                      {isActive && <span style={{ marginLeft: "auto", color: "#14A800", fontWeight: 600, fontSize: "0.72rem" }}>Active</span>}
                    </button>
                  );
                })}
              </>
            )}
            {/* Create Account button */}
            <div style={{ borderTop: "1px solid #e0e0e0", padding: "8px 12px" }}>
              <button
                className="gw-btn-outline"
                style={{ width: "100%", fontSize: "0.8rem", padding: "6px 14px" }}
                onClick={() => { setOpen(false); setShowCreateModal(true); }}
              >
                + Create Account
              </button>
            </div>
          </div>
        </>
      )}
      {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};

/* ── Environment Selector ──────────────────────────────────────── */

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
      <span style={{
        fontSize: "0.65rem", fontWeight: 600, color: "#14A800",
        background: "rgba(20,168,0,0.08)", borderRadius: "100px",
        padding: "2px 10px", letterSpacing: "0.5px",
      }}>
        {label}
      </span>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(20,168,0,0.08)", border: "none", borderRadius: "100px",
          padding: "2px 10px", fontSize: "0.65rem", fontWeight: 600,
          color: "#14A800", cursor: "pointer", letterSpacing: "0.5px",
        }}
      >
        {label} {open ? "\u25B2" : "\u25BC"}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 1059 }} onClick={() => setOpen(false)} />
          <div className="gw-dropdown" style={{ minWidth: "140px" }}>
            <button className={`gw-dropdown-item${activeEnvironment === "local" ? " active" : ""}`} onClick={() => { switchEnvironment("local"); setOpen(false); }}>Sandbox</button>
            <button className={`gw-dropdown-item${activeEnvironment === "devnet" ? " active" : ""}`} onClick={() => { switchEnvironment("devnet"); setOpen(false); }}>DevNet</button>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Context Bar ───────────────────────────────────────────────── */

const ContextBar: React.FC = () => {
  const { activeParty, isConnected, allParties } = useStore();
  if (!isConnected) return null;

  const party = allParties[activeParty] || PRESET_PARTIES.client;

  const descriptions: Record<PartyRoleCategory, string> = {
    Client: "You see all contracts and payments you've created",
    Freelancer: "You only see your own contracts \u2014 other freelancers' data never reaches this node",
    Auditor: "You see aggregate totals only \u2014 zero individual contracts, rates, or freelancer names",
  };

  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #e0e0e0",
      borderLeft: `3px solid ${party.color}`,
      padding: "8px 20px", display: "flex", alignItems: "center",
      gap: "8px", fontSize: "0.8rem",
    }}>
      <span>
        <strong style={{ color: party.color }}>{party.shortName}</strong>
        <span style={{ color: "#5e6d55", marginLeft: "6px" }}>{descriptions[party.role]}</span>
      </span>
    </div>
  );
};

/* ── Hero Section ──────────────────────────────────────────────── */

const HeroSection: React.FC = () => {
  const { visibleContracts, isConnected, demoStep, setDemoStep } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || visibleContracts.length > 0 || !isConnected) return null;

  return (
    <div className="gw-card-static" style={{ padding: "32px", marginBottom: "20px", position: "relative" }}>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: "12px", right: "12px",
          background: "none", border: "none", color: "#5e6d55",
          cursor: "pointer", fontSize: "1rem", padding: "4px",
        }}
      >&times;</button>

      <div style={{ marginBottom: "8px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#001e00" }}>
          The Private Freelancer Platform
        </h2>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#5e6d55", lineHeight: 1.6, margin: "0 0 16px", maxWidth: "600px" }}>
        Hire freelancers with <strong style={{ color: "#001e00" }}>protocol-level privacy</strong>. Each party sees only their own data &mdash;
        enforced by Canton, not access control.
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {["Sub-Transaction Privacy", "Aggregate-Only Auditing", "Protocol-Level Enforcement"].map((label) => (
          <span key={label} style={{
            background: "#f0fdf4", border: "1px solid #d1fae5",
            borderRadius: "100px", padding: "6px 14px",
            fontSize: "0.78rem", fontWeight: 500, color: "#065f46",
          }}>
            {label}
          </span>
        ))}
      </div>
      {demoStep === null && (
        <button className="gw-btn-outline" onClick={() => setDemoStep(0)}>
          Start Guided Demo &rarr;
        </button>
      )}
    </div>
  );
};

/* ── App Content ───────────────────────────────────────────────── */

/* ── Not-Connected Landing ─────────────────────────────────────── */

const NotConnectedLanding: React.FC<{ isLoading: boolean; error: string | null }> = ({ isLoading, error }) => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
    <div style={{ maxWidth: "480px", textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "#001e00", marginBottom: "4px" }}>GhostWork</div>
      <div style={{ fontSize: "0.85rem", color: "#5e6d55", marginBottom: "32px" }}>Private Freelancer Platform on Canton</div>

      {isLoading ? (
        <div className="gw-card-static" style={{ padding: "40px 32px" }}>
          <div style={{
            width: "36px", height: "36px", border: "3px solid #e0e0e0", borderTopColor: "#14A800",
            borderRadius: "50%", animation: "gw-spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <div style={{ fontWeight: 600, color: "#001e00", marginBottom: "4px" }}>Connecting to Canton Ledger...</div>
          <div style={{ fontSize: "0.82rem", color: "#5e6d55" }}>Looking for local sandbox or DevNet</div>
        </div>
      ) : (
        <div className="gw-card-static" style={{ padding: "32px", textAlign: "left" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", marginBottom: "8px",
            }}>!</div>
            <div style={{ fontWeight: 600, color: "#001e00", fontSize: "1rem" }}>Not Connected</div>
            <div style={{ fontSize: "0.82rem", color: "#5e6d55", marginTop: "4px" }}>
              {error || "Could not find a Canton ledger configuration."}
            </div>
          </div>

          <div style={{
            background: "#f9fafb", borderRadius: "8px", padding: "16px",
            fontSize: "0.82rem", lineHeight: 1.8, marginBottom: "20px",
          }}>
            <div style={{ fontWeight: 600, color: "#001e00", marginBottom: "8px" }}>Quick Start</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#5e6d55" }}>
              <div>1. <code style={{ background: "#e0e0e0", padding: "2px 6px", borderRadius: "4px" }}>docker compose up -d</code></div>
              <div>2. <code style={{ background: "#e0e0e0", padding: "2px 6px", borderRadius: "4px" }}>bash setup-local.sh</code></div>
              <div>3. Refresh this page</div>
            </div>
          </div>

          <button
            className="gw-btn-primary"
            style={{ width: "100%", padding: "10px" }}
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  </div>
);

/* ── App Content ───────────────────────────────────────────────── */

const AppContent: React.FC = () => {
  const { activeParty, isLoading, isConnected, configsLoaded, connectionError, allParties } = useStore();

  // Determine which view to show based on role category
  const activePartyInfo = allParties[activeParty];
  const roleCategory: PartyRoleCategory = activePartyInfo?.role || "Client";

  // Not connected state
  if (!isConnected) {
    return (
      <div>
        <GlobalStyles />
        <NotConnectedLanding isLoading={!configsLoaded} error={connectionError} />
      </div>
    );
  }

  return (
    <div>
      <GlobalStyles />
      <ToastNotifications />

      <nav className="gw-navbar">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#001e00" }}>GhostWork</span>
            {/* Green connection indicator */}
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%", background: "#14A800",
              display: "inline-block", boxShadow: "0 0 0 2px rgba(20,168,0,0.2)",
            }} title="Connected to Canton" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <EnvironmentSelector />
            <AccountSwitcher />
          </div>
        </div>
      </nav>

      <ContextBar />

      <div className="container" style={{ paddingTop: "20px", paddingBottom: "80px" }}>
        <HeroSection />

        {isLoading && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div className="spinner-border spinner-border-sm" role="status" style={{ color: "#14A800" }} />
            <small style={{ marginLeft: "8px", color: "#5e6d55" }}>Syncing with Canton...</small>
          </div>
        )}

        <div>
          {roleCategory === "Client" && <ClientView />}
          {roleCategory === "Freelancer" && <FreelancerView />}
          {roleCategory === "Auditor" && <AuditorView />}
        </div>

        <PrivacyComparisonPanel />
        <ApiProofPanel />

        <footer style={{ marginTop: "40px", textAlign: "center", paddingBottom: "60px" }}>
          <small style={{ fontSize: "0.75rem", color: "#5e6d55" }}>
            Built on Canton L1 &mdash; Sub-transaction privacy &mdash; ETHDenver 2026
          </small>
        </footer>
      </div>

      <DemoGuide />
    </div>
  );
};

const GhostWorkApp: React.FC = () => (
  <StoreProvider>
    <AppContent />
  </StoreProvider>
);

export default GhostWorkApp;
