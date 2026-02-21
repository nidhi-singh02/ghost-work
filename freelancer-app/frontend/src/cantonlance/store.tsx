import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  ProjectContract,
  PaymentRecord,
  AuditSummary,
  PartyRole,
} from "./types";
import { CantonDevNetClient, DevNetConfig, loadAllConfigs, ApiCall, AvailableEnvironments, EnvironmentKey } from "./cantonApi";

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
    } catch (err) {
      log(`Query error: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeParty, log]);

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
      devNetClientRef.current
        .createContract(freelancerRole, description, hourlyRate, totalBudget, milestonesTotal)
        .then(({ apiCall }) => {
          log(apiCall.description);
          refreshContracts();
        })
        .catch((err) => log(`Error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [log, refreshContracts]
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
      devNetClientRef.current
        .submitMilestone(contractId, role)
        .then(({ apiCall }) => {
          log(apiCall.description);
          refreshContracts();
        })
        .catch((err) => log(`Error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [activeParty, log, refreshContracts]
  );

  // ── Approve milestone ─────────────────────────────────────────────
  const approveMilestone = useCallback(
    (contractId: string, payment: number) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      devNetClientRef.current
        .approveMilestone(contractId, payment)
        .then(({ apiCall }) => {
          log(apiCall.description);
          refreshContracts();
        })
        .catch((err) => log(`Error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [log, refreshContracts]
  );

  // ── Generate audit summary ────────────────────────────────────────
  const generateAuditSummary = useCallback(() => {
    if (!devNetClientRef.current) {
      log("Not connected");
      return;
    }
    setIsLoading(true);
    const totalContracts = contracts.length;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    devNetClientRef.current
      .generateAuditSummary(totalContracts, totalPaid)
      .then(({ apiCall }) => {
        log(apiCall.description);
        refreshContracts();
      })
      .catch((err) => log(`Error: ${String(err)}`))
      .finally(() => setIsLoading(false));
  }, [contracts, payments, log, refreshContracts]);

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
        apiCalls: devNetClientRef.current?.getApiCalls() ?? [],
        actionLog,
        isLoading,
        isConnected,
        devNetConfig,
        refreshContracts,
        environments,
        activeEnvironment,
        switchEnvironment,
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
