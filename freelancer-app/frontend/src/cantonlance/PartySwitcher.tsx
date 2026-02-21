import React from "react";
import { useStore } from "./store";
import { PARTIES, PartyRole } from "./types";

const PartySwitcher: React.FC = () => {
  const { activeParty, setActiveParty, visibleContracts, visiblePayments, visibleAuditSummaries } = useStore();

  const partyOrder: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <strong>View as:</strong>
        <div className="btn-group" role="group">
          {partyOrder.map((role) => {
            const party = PARTIES[role];
            const isActive = activeParty === role;
            return (
              <button
                key={role}
                type="button"
                className={`btn ${isActive ? "text-white" : "btn-outline-secondary"}`}
                style={isActive ? { backgroundColor: party.color, borderColor: party.color } : {}}
                onClick={() => setActiveParty(role)}
              >
                {party.displayName}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="alert py-2 mb-0"
        style={{ backgroundColor: PARTIES[activeParty].color + "15", borderColor: PARTIES[activeParty].color }}
      >
        <small>
          <strong style={{ color: PARTIES[activeParty].color }}>
            {PARTIES[activeParty].displayName}
          </strong>
          {" "}sees: {visibleContracts.length} contract(s), {visiblePayments.length} payment(s), {visibleAuditSummaries.length} audit summary(ies)
          {activeParty === "auditor" && (
            <span className="text-muted">
              {" "}&mdash; Auditor has NO access to individual contracts or payments. Canton&apos;s sub-transaction privacy ensures this data never reaches the auditor&apos;s node.
            </span>
          )}
          {(activeParty === "freelancerA" || activeParty === "freelancerB") && (
            <span className="text-muted">
              {" "}&mdash; This freelancer can ONLY see their own contract. The other freelancer&apos;s data never reaches their participant node.
            </span>
          )}
        </small>
      </div>
    </div>
  );
};

export default PartySwitcher;
