import React from "react";
import { useStore } from "./store";
import { PARTIES, formatPartyName } from "./types";

const FreelancerView: React.FC = () => {
  const { activeParty, visibleContracts, visiblePayments, submitMilestone, loadingAction } = useStore();
  const partyInfo = PARTIES[activeParty];

  // Aggregate earnings
  const totalEarned = visibleContracts.reduce((s, c) => s + c.amountPaid, 0);
  const totalBudget = visibleContracts.reduce((s, c) => s + c.totalBudget, 0);
  const milestonesCompleted = visibleContracts.reduce((s, c) => s + c.milestonesCompleted, 0);
  const milestonesTotal = visibleContracts.reduce((s, c) => s + c.milestonesTotal, 0);

  return (
    <div>
      {/* ── Earnings Card ──────────────────────────────────── */}
      {visibleContracts.length > 0 && (
        <div className="gw-card-static" style={{ padding: "24px", marginBottom: "20px", borderLeft: `3px solid ${partyInfo.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="gw-stat-label">Total Earned</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#14A800", lineHeight: 1.2 }}>
                ${totalEarned.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#5e6d55", marginTop: "4px" }}>
                from {visibleContracts.length} active contract{visibleContracts.length > 1 ? "s" : ""}
                <span style={{ margin: "0 8px" }}>&middot;</span>
                ${totalBudget.toLocaleString()} total budget
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="gw-stat-label">Milestones</div>
              <div className="gw-stat-value">{milestonesCompleted}/{milestonesTotal}</div>
            </div>
          </div>
          {milestonesTotal > 0 && (
            <div className="gw-progress" style={{ marginTop: "12px" }}>
              <div className="gw-progress-bar" style={{ width: `${(milestonesCompleted / milestonesTotal) * 100}%`, background: partyInfo.color }} />
            </div>
          )}
        </div>
      )}

      {/* ── Contracts ──────────────────────────────────────── */}
      <div className="gw-section-title">My Contracts ({visibleContracts.length})</div>

      {visibleContracts.length === 0 ? (
        <div className="gw-card-static" style={{ padding: "40px", textAlign: "center", borderStyle: "dashed", borderColor: partyInfo.color }}>
          <div style={{ fontSize: "2rem", opacity: 0.15, marginBottom: "8px" }}>&#x1F512;</div>
          <h6 style={{ fontWeight: 600, color: "#001e00" }}>No Contracts Visible</h6>
          <p style={{ fontSize: "0.82rem", color: "#5e6d55", margin: "0 0 8px" }}>
            Zero contracts on this node &mdash; data was never sent, not hidden.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#5e6d55", margin: 0 }}>
            Switch to <strong>Eth Foundation</strong> from the account menu to create a contract.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleContracts.map((c) => {
            const progress = c.milestonesTotal > 0 ? (c.milestonesCompleted / c.milestonesTotal) * 100 : 0;

            return (
              <div key={c.contractId} className="gw-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#001e00" }}>{c.description}</div>
                    <div style={{ fontSize: "0.8rem", color: "#5e6d55", marginTop: "2px" }}>
                      Client: {formatPartyName(c.client)}
                    </div>
                  </div>
                  <span className="gw-status-pill" style={{
                    background: c.status === "Active" ? "#ecfdf5" : "#f3f4f6",
                    color: c.status === "Active" ? "#065f46" : "#374151",
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%", display: "inline-block",
                      background: c.status === "Active" ? "#14A800" : "#9ca3af",
                    }} />
                    {c.status}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "24px", fontSize: "0.82rem", color: "#5e6d55", marginBottom: "12px" }}>
                  <span><strong style={{ color: "#001e00" }}>${c.hourlyRate}</strong>/hr</span>
                  <span><strong style={{ color: "#001e00" }}>${c.totalBudget.toLocaleString()}</strong> budget</span>
                  <span><strong style={{ color: "#001e00" }}>{c.milestonesCompleted}/{c.milestonesTotal}</strong> milestones</span>
                  <span><strong style={{ color: "#14A800" }}>${c.amountPaid.toLocaleString()}</strong> earned</span>
                </div>

                <div className="gw-progress" style={{ marginBottom: "12px" }}>
                  <div className="gw-progress-bar" style={{ width: `${progress}%`, background: partyInfo.color }} />
                </div>

                {c.status === "Active" && c.milestonesCompleted < c.milestonesTotal && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="gw-btn-primary"
                      style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                      disabled={loadingAction === `submitMilestone:${c.contractId}`}
                      onClick={() => submitMilestone(c.contractId)}
                      data-gw-id="submitMilestone"
                    >
                      {loadingAction === `submitMilestone:${c.contractId}` ? (
                        <><span className="spinner-border spinner-border-sm me-1" role="status" />Submitting...</>
                      ) : `Submit Milestone ${c.milestonesCompleted + 1} \u2192`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Payments ───────────────────────────────────────── */}
      {visiblePayments.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div className="gw-section-title">My Payments ({visiblePayments.length})</div>
          <div className="gw-card-static" style={{ overflow: "hidden" }}>
            {visiblePayments.map((p, i) => (
              <div key={`${p.contractId}-${p.milestoneNumber}`} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px",
                borderBottom: i < visiblePayments.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <div className="gw-avatar-xs" style={{ background: partyInfo.color }}>{partyInfo.avatar}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.projectDescription}</span>
                  <span style={{ fontSize: "0.75rem", color: "#5e6d55", marginLeft: "8px" }}>Milestone {p.milestoneNumber}</span>
                </div>
                <span style={{ fontWeight: 700, color: "#14A800", fontSize: "0.85rem" }}>+${p.amount.toLocaleString()}</span>
                <span style={{ fontSize: "0.72rem", color: "#5e6d55" }}>{new Date(p.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Privacy Badge ──────────────────────────────────── */}
      <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#5e6d55" }}>
        <span>&#x1F6E1;</span>
        <span>Private &mdash; only your contracts are visible on this Canton node</span>
      </div>
    </div>
  );
};

export default FreelancerView;
