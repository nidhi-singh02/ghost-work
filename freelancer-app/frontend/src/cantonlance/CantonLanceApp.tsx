import React, { useState } from "react";
import { StoreProvider, useStore } from "./store";
import ClientView from "./ClientView";
import FreelancerView from "./FreelancerView";
import AuditorView from "./AuditorView";
import ApiProofPanel from "./ApiProofPanel";
import PrivacyComparisonPanel from "./PrivacyComparisonPanel";
import ToastNotifications from "./ToastNotifications";
import DemoGuide from "./DemoGuide";
import { PARTIES, PartyRole } from "./types";

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
  `}</style>
);

/* ── Account Switcher ──────────────────────────────────────────── */

const AccountSwitcher: React.FC = () => {
  const { activeParty, setActiveParty } = useStore();
  const [open, setOpen] = useState(false);
  const party = PARTIES[activeParty];
  const partyOrder: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

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
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #e0e0e0" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5e6d55", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Switch Account
              </span>
            </div>
            {partyOrder.map((role) => {
              const p = PARTIES[role];
              const isActive = role === activeParty;
              return (
                <button
                  key={role}
                  className={`gw-dropdown-item${isActive ? " active" : ""}`}
                  onClick={() => { setActiveParty(role); setOpen(false); }}
                  data-gw-id={`party-${role}`}
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
          </div>
        </>
      )}
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
  const { activeParty, isConnected } = useStore();
  if (!isConnected) return null;

  const party = PARTIES[activeParty];
  const descriptions: Record<PartyRole, string> = {
    client: "You see all contracts and payments you've created",
    freelancerA: "You only see your own contracts \u2014 other freelancers' data never reaches this node",
    freelancerB: "You only see your own contracts \u2014 other freelancers' data never reaches this node",
    auditor: "You see aggregate totals only \u2014 zero individual contracts, rates, or freelancer names",
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
        <span style={{ color: "#5e6d55", marginLeft: "6px" }}>{descriptions[activeParty]}</span>
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

const AppContent: React.FC = () => {
  const { activeParty, isLoading, isConnected } = useStore();

  return (
    <div>
      <GlobalStyles />
      <ToastNotifications />

      <nav className="gw-navbar">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#001e00" }}>GhostWork</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isConnected && <EnvironmentSelector />}
            {isConnected && <AccountSwitcher />}
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
          {activeParty === "client" && <ClientView />}
          {(activeParty === "freelancerA" || activeParty === "freelancerB") && <FreelancerView />}
          {activeParty === "auditor" && <AuditorView />}
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
