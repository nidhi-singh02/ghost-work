import React from "react";
import { useStore } from "./store";

const AuditorView: React.FC = () => {
  const { visibleContracts, visiblePayments, visibleAuditSummaries } = useStore();

  return (
    <div>
      {/* ── Privacy Metrics ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <div className="gw-card-static" style={{ padding: "16px 20px", textAlign: "center", borderLeft: "3px solid #dc3545" }}>
          <div className="gw-stat-label">Contracts Visible</div>
          <div className="gw-stat-value">{visibleContracts.length}</div>
          <div style={{ fontSize: "0.7rem", color: "#dc3545", fontWeight: 500 }}>Privacy enforced: always 0</div>
        </div>
        <div className="gw-card-static" style={{ padding: "16px 20px", textAlign: "center", borderLeft: "3px solid #dc3545" }}>
          <div className="gw-stat-label">Payments Visible</div>
          <div className="gw-stat-value">{visiblePayments.length}</div>
          <div style={{ fontSize: "0.7rem", color: "#dc3545", fontWeight: 500 }}>Privacy enforced: always 0</div>
        </div>
        <div className="gw-card-static" style={{ padding: "16px 20px", textAlign: "center", borderLeft: "3px solid #14A800" }}>
          <div className="gw-stat-label">Audit Summaries</div>
          <div className="gw-stat-value">{visibleAuditSummaries.length}</div>
          <div style={{ fontSize: "0.7rem", color: "#14A800", fontWeight: 500 }}>Aggregated data only</div>
        </div>
      </div>

      {/* ── Audit Summaries ────────────────────────────────── */}
      <div className="gw-section-title">Audit Reports</div>

      {visibleAuditSummaries.length === 0 ? (
        <div className="gw-card-static" style={{ padding: "40px", textAlign: "center", borderStyle: "dashed", borderColor: "#dc3545" }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.3, marginBottom: "8px", fontWeight: 600 }}>No data</div>
          <h6 style={{ fontWeight: 600, color: "#001e00" }}>No Audit Summaries Yet</h6>
          <p style={{ fontSize: "0.82rem", color: "#5e6d55", margin: "0 0 8px" }}>
            This node has received zero individual contracts or payments.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#5e6d55", margin: 0 }}>
            Switch to <strong>Eth Foundation</strong> from the account menu and click &quot;Generate Audit&quot;.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleAuditSummaries.map((a) => (
            <div key={a.contractId} className="gw-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#001e00" }}>
                    Audit Report &mdash; {a.reportPeriod}
                  </div>
                </div>
                <span className="gw-status-pill" style={{ background: "#ecfdf5", color: "#065f46" }}>
                  Verified
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div className="gw-stat-label">Total Contracts</div>
                  <div className="gw-stat-value">{a.totalContractsCount}</div>
                </div>
                <div>
                  <div className="gw-stat-label">Total Amount Paid</div>
                  <div className="gw-stat-value">${a.totalAmountPaid.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "#5e6d55", borderTop: "1px solid #f0f0f0", paddingTop: "8px" }}>
                Aggregate only &mdash; zero individual rates, descriptions, or freelancer names visible.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Privacy Badge ──────────────────────────────────── */}
      <div style={{ marginTop: "24px", fontSize: "0.78rem", color: "#5e6d55" }}>
        Canton&apos;s sub-transaction privacy ensures this node never receives individual contract data
      </div>
    </div>
  );
};

export default AuditorView;
