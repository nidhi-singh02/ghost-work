import React, { useState } from "react";
import { useStore } from "./store";
import { PARTIES } from "./types";

const ApiProofPanel: React.FC = () => {
  const { apiCalls, activeEnvironment } = useStore();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (apiCalls.length === 0) return null;

  const envLabel = activeEnvironment === "local" ? "Local Sandbox" : "DevNet";

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">
          Canton API Log{" "}
          <span className="badge bg-secondary">{apiCalls.length}</span>
        </h6>
        <small className="text-muted">
          Real Canton JSON Ledger API v2 requests and responses from {envLabel}
        </small>
      </div>
      <div className="border rounded" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {apiCalls.map((call, i) => {
          const party = PARTIES[call.party];
          const isExpanded = expanded === i;
          return (
            <div
              key={i}
              className="border-bottom"
              style={{ fontSize: "0.82rem" }}
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
                    minWidth: "90px",
                    fontWeight: 400,
                  }}
                >
                  {party.displayName.split(" ")[0]}
                </span>
                <code className="text-primary me-1">{call.method}</code>
                <code className="text-muted">{call.endpoint}</code>
                <span className="ms-auto text-muted">
                  <small>{call.description}</small>
                </span>
                <span className="ms-2">{isExpanded ? "\u25B2" : "\u25BC"}</span>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted d-block mb-1 fw-bold">
                        Request Body:
                      </small>
                      <pre
                        className="bg-dark text-light p-2 rounded mb-0"
                        style={{
                          fontSize: "0.75rem",
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
                          fontSize: "0.75rem",
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
    </div>
  );
};

export default ApiProofPanel;
