import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  ProjectContract,
  PaymentRecord,
  AuditSummary,
  PartyRole,
} from "./types";
import { CantonDevNetClient, DevNetConfig, loadAllConfigs, ApiCall, AvailableEnvironments, EnvironmentKey } from "./cantonApi";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "warning" | "danger";
}

interface StoreContextType {
  activeParty: PartyRole;
  setActiveParty: (party: PartyRole) => void;
  visibleContracts: ProjectContract[];
  visiblePayments: PaymentRecord[];
  visibleAuditSummaries: AuditSummary[];
  createProposal: (
    freelancerRole: "freelancerA" | "freelancerB",
    description: string,
    hourlyRate: number,
    totalBudget: number,
    milestonesTotal: number
  ) => void;
  submitMilestone: (contractId: string) => void;
  approveMilestone: (contractId: string, payment: number) => void;
  generateAuditSummary: () => void;
  apiCalls: ApiCall[];
  actionLog: string[];
  isLoading: boolean;
  isConnected: boolean;
  devNetConfig: DevNetConfig | null;
  refreshContracts: () => void;
  // Environment switching
  environments: AvailableEnvironments;
  activeEnvironment: EnvironmentKey;
  switchEnvironment: (env: EnvironmentKey) => void;
  // Toast notifications
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  // Loading action tracking
  loadingAction: string | null;
  // Demo guide
  demoStep: number | null;
  setDemoStep: (step: number | null) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ── Environment management ───────────────────────────────────────
  const [environments, setEnvironments] = useState<AvailableEnvironments>({});
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentKey>("local");
  const devNetClientRef = useRef<CantonDevNetClient | null>(null);

  // ── State ─────────────────────────────────────────────────────────
  const [activeParty, setActiveParty] = useState<PartyRole>("client");
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ── Contract state (from real Canton API) ─────────────────────────
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [auditSummaries, setAuditSummaries] = useState<AuditSummary[]>([]);

  // ── API call log (tracked in state so consumers re-render) ──────
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  // ── Toast notifications ──────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ── Loading action tracking ──────────────────────────────────────
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // ── Demo guide ───────────────────────────────────────────────────
  const [demoStep, setDemoStep] = useState<number | null>(null);

  // Sync apiCalls from the client ref into React state
  const syncApiCalls = useCallback(() => {
    if (devNetClientRef.current) {
      setApiCalls(devNetClientRef.current.getApiCalls());
    }
  }, []);

  // Derive the active config from environments + activeEnvironment
  const devNetConfig = environments[activeEnvironment] ?? null;

  const log = useCallback((msg: string) => {
    setActionLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev,
    ]);
  }, []);

  // ── Load ALL configs on mount ──────────────────────────────────
  useEffect(() => {
    loadAllConfigs().then((envs) => {
      setEnvironments(envs);

      // Pick initial environment: prefer local if available, else devnet
      const initialEnv: EnvironmentKey = envs.local ? "local" : envs.devnet ? "devnet" : "local";
      setActiveEnvironment(initialEnv);

      const config = envs[initialEnv];
      if (config) {
        devNetClientRef.current = new CantonDevNetClient(config);
        setIsConnected(true);
        const modeLabel = config.mode === "local" ? "Local Sandbox" : "Canton DevNet";
        log(`Connected to ${modeLabel} at ${config.ledgerApiUrl}`);

        const otherEnv: EnvironmentKey = initialEnv === "local" ? "devnet" : "local";
        if (envs[otherEnv]) {
          log(`${otherEnv === "local" ? "Local Sandbox" : "DevNet"} also available — use the environment switcher`);
        }
      } else {
        log("No ledger config found — run setup-local.sh or deploy-devnet.sh");
      }
    });
  }, [log]);

  // ── Switch environment ────────────────────────────────────────────
  const switchEnvironment = useCallback((env: EnvironmentKey) => {
    const config = environments[env];
    if (!config) {
      log(`Cannot switch to ${env} — no config available`);
      return;
    }

    // Clear current contract state
    setContracts([]);
    setPayments([]);
    setAuditSummaries([]);

    // Create new client for the target environment
    devNetClientRef.current = new CantonDevNetClient(config);
    setActiveEnvironment(env);
    setIsConnected(true);

    const modeLabel = config.mode === "local" ? "Local Sandbox" : "Canton DevNet";
    log(`Switched to ${modeLabel} at ${config.ledgerApiUrl}`);
  }, [environments, log]);

  // ── Refresh contracts ──────────────────────────────────────────────
  const refreshContracts = useCallback(async () => {
    if (!devNetClientRef.current) return;

    setIsLoading(true);
    try {
      const result = await devNetClientRef.current.queryAsParty(activeParty);
      setContracts(result.contracts);
      setPayments(result.payments);
      setAuditSummaries(result.auditSummaries);
      syncApiCalls();
    } catch (err) {
      log(`Query error: ${String(err)}`);
      syncApiCalls();
    } finally {
      setIsLoading(false);
    }
  }, [activeParty, log, syncApiCalls]);

  // Auto-refresh when party or environment changes
  useEffect(() => {
    if (isConnected) {
      refreshContracts();
    }
  }, [isConnected, activeParty, activeEnvironment, refreshContracts]);

  // ── Create proposal ───────────────────────────────────────────────
  const createProposal = useCallback(
    (
      freelancerRole: "freelancerA" | "freelancerB",
      description: string,
      hourlyRate: number,
      totalBudget: number,
      milestonesTotal: number
    ) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction("createProposal");
      const freelancerName = freelancerRole === "freelancerA" ? "Nidhi" : "Akash";
      devNetClientRef.current
        .createContract(freelancerRole, description, hourlyRate, totalBudget, milestonesTotal)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast(`Contract created with ${freelancerName}`, "success");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error creating contract: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Submit milestone ──────────────────────────────────────────────
  const submitMilestone = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      const role = activeParty === "freelancerA" || activeParty === "freelancerB"
        ? activeParty
        : "freelancerA";

      setIsLoading(true);
      setLoadingAction(`submitMilestone:${contractId}`);
      devNetClientRef.current
        .submitMilestone(contractId, role)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Milestone submitted successfully", "info");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error submitting milestone: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Approve milestone ─────────────────────────────────────────────
  const approveMilestone = useCallback(
    (contractId: string, payment: number) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction(`approveMilestone:${contractId}`);
      devNetClientRef.current
        .approveMilestone(contractId, payment)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast(`Milestone approved — $${payment.toLocaleString()} paid`, "success");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error approving milestone: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Generate audit summary ────────────────────────────────────────
  const generateAuditSummary = useCallback(() => {
    if (!devNetClientRef.current) {
      log("Not connected");
      return;
    }
    setIsLoading(true);
    setLoadingAction("generateAudit");
    const totalContracts = contracts.length;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    devNetClientRef.current
      .generateAuditSummary(totalContracts, totalPaid)
      .then(({ apiCall }) => {
        log(apiCall.description);
        addToast("Audit summary generated for auditor", "success");
        syncApiCalls();
        refreshContracts();
      })
      .catch((err) => {
        log(`Error: ${String(err)}`);
        addToast(`Error generating audit: ${String(err)}`, "danger");
        syncApiCalls();
      })
      .finally(() => { setIsLoading(false); setLoadingAction(null); });
  }, [contracts, payments, log, refreshContracts, addToast, syncApiCalls]);

  return (
    <StoreContext.Provider
      value={{
        activeParty,
        setActiveParty,
        visibleContracts: contracts,
        visiblePayments: payments,
        visibleAuditSummaries: auditSummaries,
        createProposal,
        submitMilestone,
        approveMilestone,
        generateAuditSummary,
        apiCalls,
        actionLog,
        isLoading,
        isConnected,
        devNetConfig,
        refreshContracts,
        environments,
        activeEnvironment,
        switchEnvironment,
        toasts,
        addToast,
        loadingAction,
        demoStep,
        setDemoStep,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
