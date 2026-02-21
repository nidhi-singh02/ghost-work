import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  ProjectContract,
  PaymentRecord,
  AuditSummary,
  PartyRole,
} from "./types";
import { CantonDevNetClient, DevNetConfig, loadDevNetConfig, ApiCall } from "./cantonApi";

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
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ── DevNet backend ────────────────────────────────────────────────
  const [devNetConfig, setDevNetConfig] = useState<DevNetConfig | null>(null);
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

  const log = useCallback((msg: string) => {
    setActionLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev,
    ]);
  }, []);

  // ── Load DevNet config on mount ───────────────────────────────────
  useEffect(() => {
    loadDevNetConfig().then((config) => {
      if (config) {
        setDevNetConfig(config);
        devNetClientRef.current = new CantonDevNetClient(config);
        setIsConnected(true);
        log("Connected to Canton DevNet at " + config.ledgerApiUrl);
      } else {
        log("Waiting for DevNet config — run deploy-devnet.sh first");
      }
    });
  }, [log]);

  // ── Refresh contracts from DevNet ─────────────────────────────────
  const refreshContracts = useCallback(async () => {
    if (!devNetClientRef.current) return;

    setIsLoading(true);
    try {
      const result = await devNetClientRef.current.queryAsParty(activeParty);
      setContracts(result.contracts);
      setPayments(result.payments);
      setAuditSummaries(result.auditSummaries);
    } catch (err) {
      log(`DevNet query error: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeParty, log]);

  // Auto-refresh when party changes
  useEffect(() => {
    if (isConnected) {
      refreshContracts();
    }
  }, [isConnected, activeParty, refreshContracts]);

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
        log("Not connected to DevNet");
        return;
      }
      setIsLoading(true);
      devNetClientRef.current
        .createContract(freelancerRole, description, hourlyRate, totalBudget, milestonesTotal)
        .then(({ apiCall }) => {
          log(apiCall.description);
          refreshContracts();
        })
        .catch((err) => log(`DevNet error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [log, refreshContracts]
  );

  // ── Submit milestone ──────────────────────────────────────────────
  const submitMilestone = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected to DevNet");
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
        .catch((err) => log(`DevNet error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [activeParty, log, refreshContracts]
  );

  // ── Approve milestone ─────────────────────────────────────────────
  const approveMilestone = useCallback(
    (contractId: string, payment: number) => {
      if (!devNetClientRef.current) {
        log("Not connected to DevNet");
        return;
      }
      setIsLoading(true);
      devNetClientRef.current
        .approveMilestone(contractId, payment)
        .then(({ apiCall }) => {
          log(apiCall.description);
          refreshContracts();
        })
        .catch((err) => log(`DevNet error: ${String(err)}`))
        .finally(() => setIsLoading(false));
    },
    [log, refreshContracts]
  );

  // ── Generate audit summary ────────────────────────────────────────
  const generateAuditSummary = useCallback(() => {
    if (!devNetClientRef.current) {
      log("Not connected to DevNet");
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
      .catch((err) => log(`DevNet error: ${String(err)}`))
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
