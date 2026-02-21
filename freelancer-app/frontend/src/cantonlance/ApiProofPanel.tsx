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
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderBottom: open ? "none" : "1px solid #e0e0e0",
          borderRadius: open ? "12px 12px 0 0" : "12px",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontSize: "1rem" }}>&#x1F4E1;</span>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#001e00" }}>
          Canton API Log
        </span>
        <span
          style={{
            backgroundColor: "#14A800",
            color: "#fff",
            borderRadius: "100px",
            padding: "1px 8px",
            fontSize: "0.65rem",
            fontWeight: 600,
          }}
        >
          {apiCalls.length}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#5e6d55" }}>
          Real JSON Ledger API v2 &middot; {envLabel}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#5e6d55" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </div>
      {open && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            maxHeight: "400px",
            overflowY: "auto",
            backgroundColor: "#fff",
          }}
        >
          {apiCalls.map((call, i) => {
            const party = PARTIES[call.party];
            const isExpanded = expanded === i;
            return (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: "0.8rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    backgroundColor: isExpanded ? "#f9fafb" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                >
                  <div
                    className="gw-avatar-xs"
                    style={{ backgroundColor: party.color, flexShrink: 0 }}
                  >
                    {party.avatar}
                  </div>
                  <code style={{ color: "#14A800", fontSize: "0.72rem", fontWeight: 600 }}>
                    {call.method}
                  </code>
                  <code style={{ color: "#5e6d55", fontSize: "0.72rem" }}>
                    {call.endpoint}
                  </code>
                  <span style={{ marginLeft: "auto", color: "#5e6d55", fontSize: "0.72rem" }}>
                    {call.description}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#5e6d55" }}>
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </div>
                {isExpanded && (
                  <div style={{ padding: "0 16px 14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5e6d55", marginBottom: "6px" }}>
                          Request
                        </div>
                        <pre
                          style={{
                            backgroundColor: "#1a1a2e",
                            color: "#e0e0e0",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            fontSize: "0.68rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(call.requestBody, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5e6d55", marginBottom: "6px" }}>
                          Response
                        </div>
                        <pre
                          style={{
                            backgroundColor: "#1a1a2e",
                            color: "#14A800",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            fontSize: "0.68rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                            margin: 0,
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
