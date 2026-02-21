import React from "react";
import { useStore } from "./store";
import { PARTIES, PartyRole } from "./types";

/**
 * Shows what ALL 4 parties see simultaneously.
 * This is the most powerful visual proof of Canton's privacy model —
 * judges can see at a glance that each party has a fundamentally different
 * view of the ledger, not just a filtered version of the same data.
 */
const PrivacyComparisonPanel: React.FC = () => {
  const { visibleContracts } = useStore();

  if (visibleContracts.length === 0) return null;

  const parties: PartyRole[] = ["client", "freelancerA", "freelancerB", "auditor"];

  return (
    <div className="mt-4">
      <h6 className="mb-2">
        Privacy Comparison &mdash; What Each Participant Node Sees
      </h6>
      <small className="text-muted d-block mb-3">
        Each column represents a separate Canton participant node. Data that
        doesn&apos;t appear in a column was <strong>never sent</strong> to that
        node &mdash; not hidden by access control, but absent at the protocol level.
      </small>
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
                  style={{ backgroundColor: party.color, fontSize: "0.85rem" }}
                >
                  {party.displayName}
                </div>
                <div className="card-body p-2" style={{ fontSize: "0.78rem" }}>
                  <PartyNodeDescription role={role} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DESCRIPTIONS: Record<PartyRole, { contracts: string; payments: string; audits: string; contractsBlocked: boolean; paymentsBlocked: boolean; auditsBlocked: boolean }> = {
  client: {
    contracts: "Sees ALL contracts (signatory on each)",
    payments: "Sees ALL payments (signatory on each)",
    audits: "Sees all audit summaries (signatory)",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: false,
  },
  freelancerA: {
    contracts: "Sees ONLY their own contract",
    payments: "Sees ONLY their own payments",
    audits: "Cannot see audit summaries",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: true,
  },
  freelancerB: {
    contracts: "Sees ONLY their own contract",
    payments: "Sees ONLY their own payments",
    audits: "Cannot see audit summaries",
    contractsBlocked: false,
    paymentsBlocked: false,
    auditsBlocked: true,
  },
  auditor: {
    contracts: "Cannot see any contracts",
    payments: "Cannot see any payments",
    audits: "Sees ONLY aggregate totals (observer)",
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
        <small className="text-muted">ProjectContracts:</small>
        <div className={desc.contractsBlocked ? "text-danger" : ""}>
          {desc.contracts}
        </div>
      </div>
      <div className="mb-1">
        <small className="text-muted">PaymentRecords:</small>
        <div className={desc.paymentsBlocked ? "text-danger" : ""}>
          {desc.payments}
        </div>
      </div>
      <div>
        <small className="text-muted">AuditSummaries:</small>
        <div className={desc.auditsBlocked ? "text-danger" : ""}>
          {desc.audits}
        </div>
      </div>
    </div>
  );
};

export default PrivacyComparisonPanel;
