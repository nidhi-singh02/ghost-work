import React from "react";
import { useStore } from "./store";
import { PARTIES, formatPartyName } from "./types";

const FreelancerView: React.FC = () => {
  const { activeParty, visibleContracts, visiblePayments, submitMilestone, loadingAction } =
    useStore();

  const partyInfo = PARTIES[activeParty];

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h5 className="mb-0" style={{ color: partyInfo.color }}>{partyInfo.displayName.split(" (")[0]}</h5>
        <small className="text-muted">Only sees own contracts &mdash; other freelancers&apos; data never reaches this node</small>
      </div>

      <h6>
        My Contracts{" "}
        <span className="badge" style={{ backgroundColor: partyInfo.color, fontSize: "0.7rem" }}>
          {visibleContracts.length}
        </span>
      </h6>
      {visibleContracts.length === 0 ? (
        <div className="card" style={{ borderStyle: "dashed", borderColor: partyInfo.color }}>
          <div className="card-body text-center py-3">
            <div style={{ fontSize: "1.8rem", opacity: 0.2 }}>&#x1F512;</div>
            <h6 className="mt-1">No Contracts Visible</h6>
            <small className="text-muted">
              Zero contracts on this node &mdash; data was never sent, not hidden.
              Switch to <strong>Eth Foundation</strong> to create a contract.
            </small>
          </div>
        </div>
      ) : (
        visibleContracts.map((c) => (
          <div className="card mb-3" key={c.contractId}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title mb-1">{c.description}</h6>
                  <p className="text-muted mb-1">
                    Client: {formatPartyName(c.client)}
                  </p>
                </div>
                <span
                  className={`badge ${c.status === "Active" ? "bg-success" : "bg-secondary"}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="row mt-2">
                <div className="col-3">
                  <small className="text-muted d-block">My Rate</small>
                  <strong>${c.hourlyRate}/hr</strong>
                </div>
                <div className="col-3">
                  <small className="text-muted d-block">Budget</small>
                  <strong>${c.totalBudget.toLocaleString()}</strong>
                </div>
                <div className="col-3">
                  <small className="text-muted d-block">Milestones</small>
                  <strong>
                    {c.milestonesCompleted}/{c.milestonesTotal}
                  </strong>
                </div>
                <div className="col-3">
                  <small className="text-muted d-block">Earned</small>
                  <strong>${c.amountPaid.toLocaleString()}</strong>
                </div>
              </div>
              {c.status === "Active" &&
                c.milestonesCompleted < c.milestonesTotal && (
                  <button
                    className="btn btn-sm mt-2"
                    style={{ backgroundColor: partyInfo.color, color: "#fff" }}
                    disabled={loadingAction === `submitMilestone:${c.contractId}`}
                    onClick={() => submitMilestone(c.contractId)}
                  >
                    {loadingAction === `submitMilestone:${c.contractId}` ? (
                      <><span className="spinner-border spinner-border-sm me-1" role="status" />Submitting...</>
                    ) : (
                      <>Submit Milestone {c.milestonesCompleted + 1}</>
                    )}
                  </button>
                )}
              {c.milestonesCompleted > 0 &&
                c.milestonesCompleted <= c.milestonesTotal && (
                  <div className="progress mt-2" style={{ height: "6px" }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${(c.milestonesCompleted / c.milestonesTotal) * 100}%`,
                        backgroundColor: partyInfo.color,
                      }}
                    ></div>
                  </div>
                )}
            </div>
          </div>
        ))
      )}

      <h6 className="mt-3">
        My Payments{" "}
        <span className="badge" style={{ backgroundColor: partyInfo.color, fontSize: "0.7rem" }}>
          {visiblePayments.length}
        </span>
      </h6>
      {visiblePayments.length === 0 ? (
        <p className="text-muted">No payments received yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th>Project</th>
                <th>Milestone #</th>
                <th>Amount</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((p) => (
                <tr key={p.contractId}>
                  <td>{p.projectDescription}</td>
                  <td>{p.milestoneNumber}</td>
                  <td className="text-success fw-bold">
                    +${p.amount.toLocaleString()}
                  </td>
                  <td>
                    <small>{new Date(p.timestamp).toLocaleString()}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FreelancerView;
