import React, { useState } from "react";
import { useStore } from "./store";
import { PARTIES, PartyRole } from "./types";

const PrivacyComparisonPanel: React.FC = () => {
  const { visibleContracts } = useStore();
  const [open, setOpen] = useState(false);

  if (visibleContracts.length === 0) return null;

  const parties: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

  return (
    <div className="mt-3">
      <div
        className="d-flex align-items-center gap-2 py-2 px-3 rounded-top"
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderBottom: open ? "none" : "1px solid #dee2e6",
          borderRadius: open ? "0.375rem 0.375rem 0 0" : "0.375rem",
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Privacy Comparison
        </span>
        <small className="text-muted">
          What each participant node sees
        </small>
        <span className="ms-auto" style={{ fontSize: "0.75rem" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </div>
      {open && (
        <div
          className="p-3"
          style={{
            border: "1px solid #dee2e6",
            borderTop: "none",
            borderRadius: "0 0 0.375rem 0.375rem",
          }}
        >
          <div className="row g-2">
            {parties.map((role) => {
              const party = PARTIES[role];
              return (
                <div className="col-md-3" key={role}>
                  <div
                    className="card h-100"
                    style={{ borderColor: party.color, borderWidth: "2px" }}
                  >
                    <div
                      className="card-header text-white py-1 px-2"
                      style={{ backgroundColor: party.color, fontSize: "0.8rem" }}
                    >
                      {party.displayName.split(" (")[0]}
                    </div>
                    <div className="card-body p-2" style={{ fontSize: "0.75rem" }}>
                      <PartyNodeDescription role={role} />
                    </div>
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

  return (
    <div>
      <div className="mb-1">
        <small className="text-muted">Contracts:</small>
        <div className={desc.contractsBlocked ? "text-danger" : ""}>
          {desc.contracts}
        </div>
      </div>
      <div className="mb-1">
        <small className="text-muted">Payments:</small>
        <div className={desc.paymentsBlocked ? "text-danger" : ""}>
          {desc.payments}
        </div>
      </div>
      <div>
        <small className="text-muted">Audits:</small>
        <div className={desc.auditsBlocked ? "text-danger" : ""}>
          {desc.audits}
        </div>
      </div>
    </div>
  );
};

export default PrivacyComparisonPanel;
