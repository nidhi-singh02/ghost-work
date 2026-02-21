import React, { useState } from "react";
import { useStore } from "./store";
import { PARTIES, PartyRole } from "./types";

const PrivacyComparisonPanel: React.FC = () => {
  const { visibleContracts } = useStore();
  const [open, setOpen] = useState(false);

  if (visibleContracts.length === 0) return null;

  const parties: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderBottom: open ? "none" : "1px solid #e0e0e0",
          borderRadius: open ? "12px 12px 0 0" : "12px",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: "1rem" }}>&#x1F6E1;</span>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#001e00" }}>
          Privacy Comparison
        </span>
        <span style={{ fontSize: "0.75rem", color: "#5e6d55" }}>
          What each participant node sees
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#5e6d55" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </div>
      {open && (
        <div
          style={{
            padding: "16px",
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {parties.map((role) => {
              const party = PARTIES[role];
              return (
                <div
                  key={role}
                  className="gw-card-static"
                  style={{
                    borderTop: `3px solid ${party.color}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      className="gw-avatar-xs"
                      style={{ backgroundColor: party.color, flexShrink: 0 }}
                    >
                      {party.avatar}
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#001e00" }}>
                      {party.shortName}
                    </span>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <PartyNodeDescription role={role} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DESCRIPTIONS: Record<PartyRole, { contracts: string; payments: string; audits: string; contractsBlocked: boolean; paymentsBlocked: boolean; auditsBlocked: boolean }> = {
  client: {
    contracts: "Sees ALL contracts (signatory)",
    payments: "Sees ALL payments (signatory)",
    audits: "Sees audit summaries",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: false,
  },
  freelancerA: {
    contracts: "Sees ONLY own contract",
    payments: "Sees ONLY own payments",
    audits: "Cannot see audits",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: true,
  },
  freelancerB: {
    contracts: "Sees ONLY own contract",
    payments: "Sees ONLY own payments",
    audits: "Cannot see audits",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: true,
  },
  auditor: {
    contracts: "Cannot see contracts",
    payments: "Cannot see payments",
    audits: "Sees aggregate totals only",
    contractsBlocked: true,
    paymentsBlocked: true,
    auditsBlocked: false,
  },
};

const PartyNodeDescription: React.FC<{ role: PartyRole }> = ({ role }) => {
  const desc = DESCRIPTIONS[role];

  const itemStyle = (blocked: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.73rem",
    color: blocked ? "#dc3545" : "#001e00",
    marginBottom: "6px",
  });

  const iconStyle = (blocked: boolean): React.CSSProperties => ({
    fontSize: "0.7rem",
    flexShrink: 0,
  });

  return (
    <div>
      <div style={itemStyle(desc.contractsBlocked)}>
        <span style={iconStyle(desc.contractsBlocked)}>
          {desc.contractsBlocked ? "\u{1F512}" : "\u2713"}
        </span>
        <span>{desc.contracts}</span>
      </div>
      <div style={itemStyle(desc.paymentsBlocked)}>
        <span style={iconStyle(desc.paymentsBlocked)}>
          {desc.paymentsBlocked ? "\u{1F512}" : "\u2713"}
        </span>
        <span>{desc.payments}</span>
      </div>
      <div style={{ ...itemStyle(desc.auditsBlocked), marginBottom: 0 }}>
        <span style={iconStyle(desc.auditsBlocked)}>
          {desc.auditsBlocked ? "\u{1F512}" : "\u2713"}
        </span>
        <span>{desc.audits}</span>
      </div>
    </div>
  );
};

export default PrivacyComparisonPanel;
