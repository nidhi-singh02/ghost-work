import React, { useState } from "react";
import { useStore } from "./store";

const ClientView: React.FC = () => {
  const {
    visibleContracts,
    visiblePayments,
    visibleAuditSummaries,
    createProposal,
    approveMilestone,
    generateAuditSummary,
    loadingAction,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    freelancer: "freelancerA" as "freelancerA" | "freelancerB",
    description: "",
    hourlyRate: 0,
    totalBudget: 0,
    milestonesTotal: 1,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProposal(
      formData.freelancer,
      formData.description,
      formData.hourlyRate,
      formData.totalBudget,
      formData.milestonesTotal
    );
    setFormData({
      freelancer: "freelancerA",
      description: "",
      hourlyRate: 0,
      totalBudget: 0,
      milestonesTotal: 1,
    });
    setShowForm(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Client Dashboard</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            + New Contract
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={generateAuditSummary}
            disabled={visibleContracts.length === 0 || loadingAction === "generateAudit"}
          >
            {loadingAction === "generateAudit" ? (
              <><span className="spinner-border spinner-border-sm me-1" role="status" />Generating...</>
            ) : (
              "Generate Audit Summary"
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Create New Freelancer Contract</h6>
            <form onSubmit={handleCreate}>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label">Freelancer</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.freelancer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freelancer: e.target.value as
                          | "freelancerA"
                          | "freelancerB",
                      })
                    }
                  >
                    <option value="freelancerA">Nidhi (Freelancer A)</option>
                    <option value="freelancerB">Akash (Freelancer B)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Project Description</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Hourly Rate ($)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={formData.hourlyRate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: Number(e.target.value),
                      })
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Total Budget ($)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={formData.totalBudget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalBudget: Number(e.target.value),
                      })
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Milestones</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={formData.milestonesTotal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestonesTotal: Number(e.target.value),
                      })
                    }
                    required
                    min="1"
                    max="20"
                  />
                </div>
              </div>
              <div className="mt-2">
                <button
                  type="submit"
                  className="btn btn-success btn-sm me-2"
                  disabled={loadingAction === "createProposal"}
                >
                  {loadingAction === "createProposal" ? (
                    <><span className="spinner-border spinner-border-sm me-1" role="status" />Creating...</>
                  ) : (
                    "Create Contract"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h5>
        Contracts{" "}
        <span className="badge bg-primary">{visibleContracts.length}</span>
      </h5>
      {visibleContracts.length === 0 ? (
        <div className="card" style={{ borderStyle: "dashed" }}>
          <div className="card-body text-center py-4">
            <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>&#x1F4DD;</div>
            <h5 className="mt-2">No Contracts Yet</h5>
            <p className="text-muted mb-3">
              Create your first freelancer contract to see Canton&apos;s privacy in action.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Create First Contract
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th>Freelancer</th>
                <th>Description</th>
                <th>Rate</th>
                <th>Budget</th>
                <th>Milestones</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleContracts.map((c) => (
                <tr key={c.contractId}>
                  <td>{c.freelancer}</td>
                  <td>{c.description}</td>
                  <td>${c.hourlyRate}/hr</td>
                  <td>${c.totalBudget.toLocaleString()}</td>
                  <td>
                    {c.milestonesCompleted}/{c.milestonesTotal}
                  </td>
                  <td>${c.amountPaid.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${c.status === "Active" ? "bg-success" : c.status === "Completed" ? "bg-secondary" : "bg-warning"}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.status === "Active" &&
                      c.milestonesCompleted > 0 && (
                        <button
                          className="btn btn-outline-success btn-sm"
                          disabled={loadingAction === `approveMilestone:${c.contractId}`}
                          onClick={() => {
                            const payment =
                              c.totalBudget / c.milestonesTotal;
                            approveMilestone(c.contractId, payment);
                          }}
                        >
                          {loadingAction === `approveMilestone:${c.contractId}` ? (
                            <><span className="spinner-border spinner-border-sm me-1" role="status" />Paying...</>
                          ) : (
                            "Approve & Pay"
                          )}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h5 className="mt-4">
        Payments{" "}
        <span className="badge bg-primary">{visiblePayments.length}</span>
      </h5>
      {visiblePayments.length === 0 ? (
        <p className="text-muted">No payments recorded yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th>Freelancer</th>
                <th>Project</th>
                <th>Milestone #</th>
                <th>Amount</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((p) => (
                <tr key={p.contractId}>
                  <td>{p.freelancer}</td>
                  <td>{p.projectDescription}</td>
                  <td>{p.milestoneNumber}</td>
                  <td>${p.amount.toLocaleString()}</td>
                  <td>
                    <small>{new Date(p.timestamp).toLocaleString()}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visibleAuditSummaries.length > 0 && (
        <>
          <h5 className="mt-4">
            Audit Summaries{" "}
            <span className="badge bg-danger">
              {visibleAuditSummaries.length}
            </span>
          </h5>
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead className="table-light">
                <tr>
                  <th>Period</th>
                  <th>Total Contracts</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {visibleAuditSummaries.map((a) => (
                  <tr key={a.contractId}>
                    <td>{a.reportPeriod}</td>
                    <td>{a.totalContractsCount}</td>
                    <td>${a.totalAmountPaid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientView;
