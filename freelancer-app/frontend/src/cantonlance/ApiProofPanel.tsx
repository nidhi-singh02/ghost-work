import React, { useState } from "react";
import { useStore } from "./store";
import { PARTIES } from "./types";

const ApiProofPanel: React.FC = () => {
  const { apiCalls, activeEnvironment } = useStore();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (apiCalls.length === 0) return null;

  const envLabel = activeEnvironment === "local" ? "Local Sandbox" : "DevNet";

  return (
    <div className="mt-3">
      <div
        className="d-flex align-items-center gap-2 py-2 px-3 rounded-top"
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderBottom: open ? "none" : "1px solid #dee2e6",
          borderRadius: open ? "0.375rem 0.375rem 0 0" : "0.375rem",
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Canton API Log
        </span>
        <span className="badge bg-secondary" style={{ fontSize: "0.65rem" }}>
          {apiCalls.length}
        </span>
        <small className="text-muted">
          Real JSON Ledger API v2 &middot; {envLabel}
        </small>
        <span className="ms-auto" style={{ fontSize: "0.75rem" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </div>
      {open && (
        <div
          className="border rounded-bottom"
          style={{
            borderTop: "none",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {apiCalls.map((call, i) => {
            const party = PARTIES[call.party];
            const isExpanded = expanded === i;
            return (
              <div
                key={i}
                className="border-bottom"
                style={{ fontSize: "0.8rem" }}
              >
                <div
                  className="d-flex align-items-center gap-2 px-3 py-2"
                  style={{ cursor: "pointer", backgroundColor: isExpanded ? "#f8f9fa" : "transparent" }}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                >
                  <span
                    className="badge"
                    style={{
                      backgroundColor: party.color,
                      minWidth: "70px",
                      fontWeight: 400,
                      fontSize: "0.7rem",
                    }}
                  >
                    {party.displayName.split(" (")[0]}
                  </span>
                  <code className="text-primary" style={{ fontSize: "0.72rem" }}>{call.method}</code>
                  <code className="text-muted" style={{ fontSize: "0.72rem" }}>{call.endpoint}</code>
                  <span className="ms-auto text-muted">
                    <small>{call.description}</small>
                  </span>
                  <span className="ms-1">{isExpanded ? "\u25B2" : "\u25BC"}</span>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="row">
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1 fw-bold">
                          Request:
                        </small>
                        <pre
                          className="bg-dark text-light p-2 rounded mb-0"
                          style={{
                            fontSize: "0.7rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {JSON.stringify(call.requestBody, null, 2)}
                        </pre>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1 fw-bold">
                          Response:
                        </small>
                        <pre
                          className="bg-dark text-success p-2 rounded mb-0"
                          style={{
                            fontSize: "0.7rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {JSON.stringify(call.responseBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApiProofPanel;
