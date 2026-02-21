import React from "react";
import { useStore } from "./store";
import { PARTIES } from "./types";

const AuditorView: React.FC = () => {
  const { visibleContracts, visiblePayments, visibleAuditSummaries } =
    useStore();

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h5 className="mb-0" style={{ color: PARTIES.auditor.color }}>Eve (Auditor)</h5>
        <small className="text-muted">Sees aggregate totals only &mdash; zero individual contracts or payments</small>
      </div>

      <div className="row mb-3 g-2">
        <div className="col-md-4">
          <div className="card border-danger" style={{ borderWidth: "1px" }}>
            <div className="card-body text-center py-2">
              <small className="text-muted d-block">Contracts Visible</small>
              <h4 className="mb-0">{visibleContracts.length}</h4>
              <small className="text-danger" style={{ fontSize: "0.7rem" }}>
                Privacy enforced: always 0
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger" style={{ borderWidth: "1px" }}>
            <div className="card-body text-center py-2">
              <small className="text-muted d-block">Payments Visible</small>
              <h4 className="mb-0">{visiblePayments.length}</h4>
              <small className="text-danger" style={{ fontSize: "0.7rem" }}>
                Privacy enforced: always 0
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-success" style={{ borderWidth: "1px" }}>
            <div className="card-body text-center py-2">
              <small className="text-muted d-block">Audit Summaries</small>
              <h4 className="mb-0">{visibleAuditSummaries.length}</h4>
              <small className="text-success" style={{ fontSize: "0.7rem" }}>
                Aggregated data only
              </small>
            </div>
          </div>
        </div>
      </div>

      {visibleAuditSummaries.length === 0 ? (
        <div className="card" style={{ borderStyle: "dashed", borderColor: PARTIES.auditor.color }}>
          <div className="card-body text-center py-3">
            <div style={{ fontSize: "2rem", opacity: 0.2 }}>&#x1F6E1;</div>
            <h6 className="mt-1">No Audit Summaries Yet</h6>
            <small className="text-muted">
              Switch to <strong>Eth Foundation</strong> and click &quot;Generate Audit Summary&quot;
              to create an aggregate report.
            </small>
          </div>
        </div>
      ) : (
        visibleAuditSummaries.map((a) => (
          <div className="card mb-2" key={a.contractId}>
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  Audit Report &mdash; {a.reportPeriod}
                </h6>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted d-block">Total Contracts</small>
                  <strong>{a.totalContractsCount}</strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block">Total Amount Paid</small>
                  <strong>${a.totalAmountPaid.toLocaleString()}</strong>
                </div>
              </div>
              <small className="text-muted d-block mt-2" style={{ fontSize: "0.72rem" }}>
                Auditor sees totals only &mdash; zero individual rates, project details, or freelancer names.
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AuditorView;
