import React from "react";
import { useStore } from "./store";

const ToastNotifications: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  const bgMap: Record<string, string> = {
    success: "#198754",
    info: "#0d6efd",
    warning: "#ffc107",
    danger: "#dc3545",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 1080,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "360px",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            backgroundColor: bgMap[toast.type] || bgMap.info,
            color: toast.type === "warning" ? "#212529" : "#fff",
            padding: "0.75rem 1rem",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "0.875rem",
            animation: "cl-toast-slide 0.3s ease-out",
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes cl-toast-slide {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastNotifications;
