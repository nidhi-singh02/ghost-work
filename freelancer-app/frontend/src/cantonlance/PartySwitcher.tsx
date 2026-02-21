import React from "react";
import { useStore } from "./store";
import { PARTIES, PartyRole } from "./types";

const PartySwitcher: React.FC = () => {
  const { activeParty, setActiveParty, visibleContracts, visiblePayments, visibleAuditSummaries } = useStore();

  const partyOrder: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

  const total = visibleContracts.length + visiblePayments.length + visibleAuditSummaries.length;

  return (
    <div className="mb-3">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <small className="text-muted fw-bold">View as:</small>
        <div className="btn-group btn-group-sm" role="group">
          {partyOrder.map((role) => {
            const party = PARTIES[role];
            const isActive = activeParty === role;
            return (
              <button
                key={role}
                type="button"
                className={`btn ${isActive ? "text-white" : "btn-outline-secondary"}`}
                style={{
                  ...(isActive ? { backgroundColor: party.color, borderColor: party.color } : {}),
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.6rem",
                }}
                onClick={() => setActiveParty(role)}
              >
                {party.displayName.split(" (")[0]}
              </button>
            );
          })}
        </div>
        <small className="text-muted ms-auto" style={{ fontSize: "0.75rem" }}>
          {total === 0 ? "No data on this node" : `${visibleContracts.length} contracts · ${visiblePayments.length} payments · ${visibleAuditSummaries.length} audits`}
        </small>
      </div>
    </div>
  );
};

export default PartySwitcher;
