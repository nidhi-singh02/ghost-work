import React from "react";
import { useStore } from "./store";
import { PARTIES } from "./types";

const AuditorView: React.FC = () => {
  const { visibleContracts, visiblePayments, visibleAuditSummaries } =
    useStore();

  return (
    <div>
      <h4 style={{ color: PARTIES.auditor.color }}>
        {PARTIES.auditor.displayName} Dashboard
      </h4>
      <div className="alert alert-danger py-2">
        <small>
          The Auditor is an <strong>observer</strong> on AuditSummary contracts
          only. They can verify payment correctness (total counts, total
          amounts) without seeing any individual contract details, rates, or
          freelancer identities. Canton&apos;s sub-transaction privacy enforces this
          at the protocol level &mdash; the auditor&apos;s participant node never
          receives ProjectContract or PaymentRecord data.
        </small>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h6 className="text-muted">Individual Contracts Visible</h6>
              <h2>{visibleContracts.length}</h2>
              <small className="text-danger">
                Privacy enforced: always 0
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h6 className="text-muted">Individual Payments Visible</h6>
              <h2>{visiblePayments.length}</h2>
              <small className="text-danger">
                Privacy enforced: always 0
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-success">
            <div className="card-body text-center">
              <h6 className="text-muted">Audit Summaries</h6>
              <h2>{visibleAuditSummaries.length}</h2>
              <small className="text-success">
                Aggregated data only
              </small>
            </div>
          </div>
        </div>
      </div>

      <h5>Audit Summaries</h5>
      {visibleAuditSummaries.length === 0 ? (
        <div className="card" style={{ borderStyle: "dashed", borderColor: PARTIES.auditor.color }}>
          <div className="card-body text-center py-4">
            <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>&#x1F6E1;</div>
            <h5 className="mt-2">No Audit Summaries Yet</h5>
            <p className="text-muted mb-2">
              The auditor&apos;s node has received <strong>zero</strong> individual
              contracts or payments &mdash; Canton&apos;s privacy enforces this at
              the protocol level.
            </p>
            <small className="text-muted">
              Switch to <strong>Client</strong> and click &quot;Generate Audit Summary&quot;
              to create an aggregate-only report visible to the auditor.
            </small>
          </div>
        </div>
      ) : (
        visibleAuditSummaries.map((a) => (
          <div className="card mb-3" key={a.contractId}>
            <div className="card-body">
              <h6 className="card-title">
                Audit Report &mdash; {a.reportPeriod}
              </h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted d-block">Total Contracts</small>
                  <h4>{a.totalContractsCount}</h4>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Total Amount Paid</small>
                  <h4>${a.totalAmountPaid.toLocaleString()}</h4>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Report Period</small>
                  <h4>{a.reportPeriod}</h4>
                </div>
              </div>
              <hr />
              <small className="text-muted">
                The auditor can verify that {a.totalContractsCount} contracts
                were executed with a total payment of $
                {a.totalAmountPaid.toLocaleString()}, without knowing any
                individual contract rates, project descriptions, or freelancer
                identities.
              </small>
            </div>
          </div>
        ))
      )}

      <div className="card mt-4 border-secondary">
        <div className="card-body">
          <h6>What the Auditor Cannot See</h6>
          <div className="row">
            <div className="col-md-6">
              <ul className="list-unstyled mb-0">
                <li className="text-danger">
                  &#x2717; Individual freelancer identities
                </li>
                <li className="text-danger">
                  &#x2717; Hourly rates or project budgets
                </li>
                <li className="text-danger">
                  &#x2717; Project descriptions or scope
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="list-unstyled mb-0">
                <li className="text-danger">
                  &#x2717; Individual payment amounts
                </li>
                <li className="text-danger">
                  &#x2717; Milestone progress per contract
                </li>
                <li className="text-danger">
                  &#x2717; Number of freelancers (only total contracts)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditorView;
