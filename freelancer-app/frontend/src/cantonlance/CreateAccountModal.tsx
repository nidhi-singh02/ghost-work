import React, { useState } from "react";
import { useStore } from "./store";
import { PartyRoleCategory } from "./types";

interface Props {
  onClose: () => void;
}

const ROLES: { value: PartyRoleCategory; label: string; desc: string; color: string }[] = [
  { value: "Client", label: "Client", desc: "Hire freelancers and manage projects", color: "#0d6efd" },
  { value: "Freelancer", label: "Freelancer", desc: "Accept contracts and submit milestones", color: "#198754" },
  { value: "Auditor", label: "Auditor", desc: "View aggregate compliance reports", color: "#dc3545" },
];

const CreateAccountModal: React.FC<Props> = ({ onClose }) => {
  const { createAccount, loadingAction, activeEnvironment } = useStore();
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<PartyRoleCategory>("Freelancer");
  const isDevNet = activeEnvironment === "devnet";
  const isCreating = loadingAction === "createAccount";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isCreating) return;
    await createAccount(displayName.trim(), selectedRole);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 1080,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#001e00",
            margin: "0 0 4px",
          }}
        >
          Create Account
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "#5e6d55",
            margin: "0 0 20px",
          }}
        >
          Allocate a new Canton party on the ledger
        </p>

        {isDevNet ? (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "0.82rem",
              color: "#92400e",
              marginBottom: "16px",
            }}
          >
            Account creation is available in Sandbox mode only. Switch to
            Sandbox to create new accounts.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Display Name */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#5e6d55",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sarah, Acme Corp, Audit Partners"
                required
                autoFocus
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "0.9rem",
                  width: "100%",
                  outline: "none",
                  background: "#fff",
                  color: "#001e00",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Role Selection */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#5e6d55",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Select Role
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border:
                        selectedRole === r.value
                          ? "2px solid #14A800"
                          : "1px solid #e0e0e0",
                      background:
                        selectedRole === r.value ? "#f0fdf4" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: r.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {r.value[0]}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "#001e00",
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{ fontSize: "0.75rem", color: "#5e6d55" }}
                      >
                        {r.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                className="gw-btn-primary"
                style={{ flex: 1 }}
                disabled={!displayName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                    />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              <button
                type="button"
                className="gw-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateAccountModal;
