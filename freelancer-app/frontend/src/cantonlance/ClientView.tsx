import React, { useState } from "react";
import { useStore } from "./store";
import { formatPartyName, findPartyByRawId, PARTIES } from "./types";

/** Compute current quarter label, e.g. "2026-Q1" */
function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

const ClientView: React.FC = () => {
  const {
    visibleContracts,
    visibleProposals,
    visiblePayments,
    visibleAuditSummaries,
    createProposal,
    approveMilestone,
    rejectMilestone,
    cancelContract,
    generateAuditSummary,
    loadingAction,
  } = useStore();

  // Build dynamic freelancer list from all parties
  const allFreelancers = Object.values(PARTIES).filter((p) => p.role === "Freelancer");
  const defaultFreelancer = allFreelancers.length > 0 ? allFreelancers[0].id : "";

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    freelancer: defaultFreelancer,
    description: "",
    hourlyRate: 0,
    totalBudget: 0,
    milestonesTotal: 1,
  });

  // Per-contract payment amount state (keyed by contractId)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});

  // Audit report period
  const [auditPeriod, setAuditPeriod] = useState(currentQuarter());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProposal(formData.freelancer, formData.description, formData.hourlyRate, formData.totalBudget, formData.milestonesTotal);
    setFormData({ freelancer: defaultFreelancer, description: "", hourlyRate: 0, totalBudget: 0, milestonesTotal: 1 });
    setShowForm(false);
  };

  // Stats
  const totalBudget = visibleContracts.reduce((s, c) => s + c.totalBudget, 0);
  const totalPaid = visibleContracts.reduce((s, c) => s + c.amountPaid, 0);
  const activeCount = visibleContracts.filter((c) => c.status === "Active").length;
  const milestonesCompleted = visibleContracts.reduce((s, c) => s + c.milestonesCompleted, 0);
  const milestonesTotal = visibleContracts.reduce((s, c) => s + c.milestonesTotal, 0);

  const inputStyle: React.CSSProperties = {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    width: "100%",
    outline: "none",
    background: "#fff",
    color: "#001e00",
  };
  const labelStyle: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 600, color: "#5e6d55", marginBottom: "4px", display: "block" };

  /** Get or initialize the payment amount for a contract */
  const getPaymentAmount = (contractId: string, totalBudget: number, milestonesTotal: number): number => {
    if (paymentAmounts[contractId] !== undefined) return paymentAmounts[contractId];
    return milestonesTotal > 0 ? Math.round((totalBudget / milestonesTotal) * 100) / 100 : 0;
  };

  return (
    <div>
      {/* ── Action Bar ─────────────────────────────────────── */}
      <div className="gw-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button className="gw-btn-primary" onClick={() => setShowForm(!showForm)} data-gw-id="createContract">
            + New Contract
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              style={{ ...inputStyle, width: "110px", fontSize: "0.78rem", padding: "6px 8px" }}
              type="text"
              value={auditPeriod}
              onChange={(e) => setAuditPeriod(e.target.value)}
              placeholder="2026-Q1"
            />
            <button
              className="gw-btn-secondary"
              onClick={() => generateAuditSummary(auditPeriod)}
              disabled={visibleContracts.length === 0 || loadingAction === "generateAudit"}
              data-gw-id="generateAudit"
            >
              {loadingAction === "generateAudit" ? (
                <><span className="spinner-border spinner-border-sm me-1" role="status" />Generating...</>
              ) : "Generate Audit"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────── */}
      {visibleContracts.length > 0 && (
        <div className="gw-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total Budget", value: `$${totalBudget.toLocaleString()}` },
            { label: "Active Contracts", value: String(activeCount) },
            { label: "Amount Paid", value: `$${totalPaid.toLocaleString()}` },
            { label: "Milestones", value: `${milestonesCompleted}/${milestonesTotal}` },
          ].map((s) => (
            <div key={s.label} className="gw-card-static" style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: "4px" }}>
                <span className="gw-stat-label">{s.label}</span>
              </div>
              <div className="gw-stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Form ────────────────────────────────────── */}
      {showForm && (
        <div className="gw-card-static" style={{ padding: "24px", marginBottom: "20px" }}>
          <h6 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "16px", color: "#001e00" }}>
            Create New Contract Proposal
          </h6>
          <form onSubmit={handleCreate}>
            <div className="gw-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={labelStyle}>Freelancer</label>
                <select
                  style={inputStyle}
                  value={formData.freelancer}
                  onChange={(e) => setFormData({ ...formData, freelancer: e.target.value })}
                >
                  {allFreelancers.map((f) => (
                    <option key={f.id} value={f.id}>{f.shortName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Project Description</label>
                <input style={inputStyle} type="text" placeholder="e.g. Build payment microservice" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
            </div>
            <div className="gw-form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Hourly Rate ($)</label>
                <input style={inputStyle} type="number" placeholder="150" value={formData.hourlyRate || ""} onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })} required min="1" />
              </div>
              <div>
                <label style={labelStyle}>Total Budget ($)</label>
                <input style={inputStyle} type="number" placeholder="5000" value={formData.totalBudget || ""} onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })} required min="1" />
              </div>
              <div>
                <label style={labelStyle}>Milestones</label>
                <input style={inputStyle} type="number" value={formData.milestonesTotal} onChange={(e) => setFormData({ ...formData, milestonesTotal: Number(e.target.value) })} required min="1" max="20" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="gw-btn-primary" disabled={loadingAction === "createProposal"}>
                {loadingAction === "createProposal" ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Sending...</> : "Send Proposal"}
              </button>
              <button type="button" className="gw-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Pending Proposals ─────────────────────────────── */}
      {visibleProposals.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div className="gw-section-title">Pending Proposals ({visibleProposals.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {visibleProposals.map((proposal) => {
              const freelancerParty = findPartyByRawId(proposal.freelancer);
              const avatar = freelancerParty?.avatar || "?";
              const color = freelancerParty?.color || "#666";
              const name = formatPartyName(proposal.freelancer);

              return (
                <div key={proposal.contractId} className="gw-card" style={{ padding: "20px", borderLeft: "3px solid #f59e0b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="gw-avatar" style={{ background: color }}>{avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#001e00" }}>{name}</div>
                        <div style={{ fontSize: "0.82rem", color: "#5e6d55" }}>{proposal.description}</div>
                      </div>
                    </div>
                    <span className="gw-status-pill" style={{ background: "#fffbeb", color: "#92400e" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", display: "inline-block", background: "#f59e0b" }} />
                      Awaiting Acceptance
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "24px", fontSize: "0.82rem", color: "#5e6d55" }}>
                    <span><strong style={{ color: "#001e00" }}>${proposal.hourlyRate}</strong>/hr</span>
                    <span><strong style={{ color: "#001e00" }}>${proposal.totalBudget.toLocaleString()}</strong> budget</span>
                    <span><strong style={{ color: "#001e00" }}>{proposal.milestonesTotal}</strong> milestones</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Contracts ──────────────────────────────────────── */}
      <div className="gw-section-title">Contracts ({visibleContracts.length})</div>

      {visibleContracts.length === 0 && visibleProposals.length === 0 ? (
        <div className="gw-card-static" style={{ padding: "40px", textAlign: "center", borderStyle: "dashed" }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.3, marginBottom: "8px", fontWeight: 600 }}>No data</div>
          <h6 style={{ fontWeight: 600, color: "#001e00" }}>No Contracts Yet</h6>
          <p style={{ fontSize: "0.85rem", color: "#5e6d55", margin: "0 0 4px" }}>
            Send your first proposal to a freelancer to get started.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#5e6d55", margin: "0 0 16px" }}>
            The freelancer will need to accept it before work begins.
          </p>
          <button className="gw-btn-primary" onClick={() => setShowForm(true)}>+ Send First Proposal</button>
        </div>
      ) : visibleContracts.length === 0 ? (
        <div className="gw-card-static" style={{ padding: "24px", textAlign: "center", color: "#5e6d55", fontSize: "0.85rem" }}>
          No active contracts yet. Proposals above are awaiting freelancer acceptance.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleContracts.map((c) => {
            const freelancerParty = findPartyByRawId(c.freelancer);
            const avatar = freelancerParty?.avatar || "?";
            const color = freelancerParty?.color || "#666";
            const name = formatPartyName(c.freelancer);
            const progress = c.milestonesTotal > 0 ? (c.milestonesCompleted / c.milestonesTotal) * 100 : 0;
            const defaultPayment = getPaymentAmount(c.contractId, c.totalBudget, c.milestonesTotal);

            return (
              <div key={c.contractId} className="gw-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div className="gw-avatar" style={{ background: color }}>{avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#001e00" }}>{name}</div>
                      <div style={{ fontSize: "0.82rem", color: "#5e6d55" }}>{c.description}</div>
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
                  <span><strong style={{ color: "#14A800" }}>${c.amountPaid.toLocaleString()}</strong> paid</span>
                </div>

                <div className="gw-progress" style={{ marginBottom: "12px" }}>
                  <div className="gw-progress-bar" style={{ width: `${progress}%`, background: "#14A800" }} />
                </div>

                {c.status === "Active" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Cancel button */}
                    <button
                      className="gw-btn-secondary"
                      style={{ padding: "6px 14px", fontSize: "0.78rem", color: "#dc3545", borderColor: "#dc3545" }}
                      disabled={loadingAction === `cancelContract:${c.contractId}`}
                      onClick={() => {
                        if (window.confirm("Cancel this contract? This action cannot be undone.")) {
                          cancelContract(c.contractId);
                        }
                      }}
                    >
                      {loadingAction === `cancelContract:${c.contractId}` ? "Cancelling..." : "Cancel Contract"}
                    </button>

                    {/* Milestone actions — only when milestones pending */}
                    {c.milestonesCompleted > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          className="gw-btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "0.78rem", color: "#dc3545" }}
                          disabled={loadingAction === `rejectMilestone:${c.contractId}`}
                          onClick={() => rejectMilestone(c.contractId)}
                        >
                          {loadingAction === `rejectMilestone:${c.contractId}` ? "Rejecting..." : "Reject Milestone"}
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#5e6d55" }}>$</span>
                          <input
                            type="number"
                            style={{ ...inputStyle, width: "90px", fontSize: "0.78rem", padding: "5px 8px" }}
                            value={paymentAmounts[c.contractId] ?? defaultPayment}
                            onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, [c.contractId]: Number(e.target.value) }))}
                            min="1"
                            step="any"
                          />
                        </div>
                        <button
                          className="gw-btn-primary"
                          style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                          disabled={loadingAction === `approveMilestone:${c.contractId}`}
                          onClick={() => approveMilestone(c.contractId, paymentAmounts[c.contractId] ?? defaultPayment)}
                        >
                          {loadingAction === `approveMilestone:${c.contractId}` ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" />Paying...</>
                          ) : "Approve & Pay \u2192"}
                        </button>
                      </div>
                    )}
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
          <div className="gw-section-title">Payments ({visiblePayments.length})</div>
          <div className="gw-card-static" style={{ overflow: "hidden" }}>
            {visiblePayments.map((p, i) => {
              const freelancerParty = findPartyByRawId(p.freelancer);
              return (
                <div key={`${p.contractId}-${p.milestoneNumber}`} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px",
                  borderBottom: i < visiblePayments.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  <div className="gw-avatar-xs" style={{ background: freelancerParty?.color || "#666" }}>
                    {freelancerParty?.avatar || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.projectDescription}</span>
                    <span style={{ fontSize: "0.75rem", color: "#5e6d55", marginLeft: "8px" }}>
                      Milestone {p.milestoneNumber}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: "#14A800", fontSize: "0.85rem" }}>
                    +${p.amount.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#5e6d55", minWidth: "80px", textAlign: "right" }}>
                    {new Date(p.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Audit Summaries ────────────────────────────────── */}
      {visibleAuditSummaries.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div className="gw-section-title">Audit Summaries ({visibleAuditSummaries.length})</div>
          {visibleAuditSummaries.map((a) => (
            <div key={a.contractId} className="gw-card-static" style={{ padding: "16px 20px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Audit Report &mdash; {a.reportPeriod}</div>
                  <div style={{ fontSize: "0.78rem", color: "#5e6d55", marginTop: "4px" }}>
                    {a.totalContractsCount} contracts &middot; ${a.totalAmountPaid.toLocaleString()} total paid
                  </div>
                </div>
                <span className="gw-status-pill" style={{ background: "#fef2f2", color: "#dc3545" }}>
                  Auditor-visible
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientView;
