import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ProjectContract,
  ProjectProposal,
  PaymentRecord,
  AuditSummary,
  PartyRoleCategory,
  Party,
  PARTIES,
  PRESET_PARTIES,
  generateAvatar,
  roleColor,
} from "./types";
import { CantonDevNetClient, DevNetConfig, DevNetPartyConfig, loadAllConfigs, ApiCall, AvailableEnvironments, EnvironmentKey } from "./cantonApi";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "warning" | "danger";
}

/** Stored in localStorage alongside Party data */
interface DynamicPartyEntry extends Party {
  partyConfig: DevNetPartyConfig;
}

interface StoreContextType {
  activeParty: string;
  setActiveParty: (party: string) => void;
  visibleContracts: ProjectContract[];
  visibleProposals: ProjectProposal[];
  visiblePayments: PaymentRecord[];
  visibleAuditSummaries: AuditSummary[];
  createProposal: (
    freelancerRole: string,
    description: string,
    hourlyRate: number,
    totalBudget: number,
    milestonesTotal: number
  ) => void;
  acceptProposal: (contractId: string) => void;
  rejectProposal: (contractId: string) => void;
  submitMilestone: (contractId: string) => void;
  approveMilestone: (contractId: string, payment: number) => void;
  rejectMilestone: (contractId: string) => void;
  cancelContract: (contractId: string) => void;
  generateAuditSummary: (reportPeriod: string) => void;
  apiCalls: ApiCall[];
  actionLog: string[];
  isLoading: boolean;
  isConnected: boolean;
  configsLoaded: boolean;
  connectionError: string | null;
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
  // Dynamic account creation
  allParties: Record<string, Party>;
  createAccount: (displayName: string, role: PartyRoleCategory) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

/** localStorage key for dynamic parties, scoped by environment */
function dynamicPartiesKey(env: EnvironmentKey): string {
  return `gw-parties-${env}`;
}

/** Load dynamic parties from localStorage and register them in PARTIES + client config */
function loadDynamicParties(env: EnvironmentKey, client: CantonDevNetClient | null): DynamicPartyEntry[] {
  try {
    const json = localStorage.getItem(dynamicPartiesKey(env));
    if (!json) return [];
    const entries: DynamicPartyEntry[] = JSON.parse(json);
    for (const entry of entries) {
      // Re-populate the global PARTIES map
      PARTIES[entry.id] = entry;
      // Re-register in the API client
      if (client && entry.partyConfig) {
        client.registerParty(entry.id, entry.partyConfig);
      }
    }
    return entries;
  } catch {
    return [];
  }
}

/** Save dynamic parties to localStorage */
function saveDynamicParties(env: EnvironmentKey, entries: DynamicPartyEntry[]): void {
  localStorage.setItem(dynamicPartiesKey(env), JSON.stringify(entries));
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ── Environment management ───────────────────────────────────────
  const [environments, setEnvironments] = useState<AvailableEnvironments>({});
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentKey>("local");
  const devNetClientRef = useRef<CantonDevNetClient | null>(null);

  // ── State ─────────────────────────────────────────────────────────
  const [activeParty, setActivePartyRaw] = useState<string>(() => {
    try {
      return localStorage.getItem("gw-active-party") || "client";
    } catch {
      return "client";
    }
  });
  const setActiveParty = useCallback((party: string) => {
    setActivePartyRaw(party);
    try { localStorage.setItem("gw-active-party", party); } catch { /* ignore */ }
  }, []);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [configsLoaded, setConfigsLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // ── Contract state (from real Canton API) ─────────────────────────
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
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

  // ── Dynamic parties ──────────────────────────────────────────────
  const [dynamicParties, setDynamicParties] = useState<DynamicPartyEntry[]>([]);

  // Merged party map: presets + dynamic
  const allParties = useMemo<Record<string, Party>>(() => {
    const merged: Record<string, Party> = { ...PRESET_PARTIES };
    for (const dp of dynamicParties) {
      merged[dp.id] = dp;
    }
    return merged;
  }, [dynamicParties]);

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
        const client = new CantonDevNetClient(config);
        devNetClientRef.current = client;
        setIsConnected(true);
        const modeLabel = config.mode === "local" ? "Local Sandbox" : "Canton DevNet";
        log(`Connected to ${modeLabel} at ${config.ledgerApiUrl}`);

        // Load dynamic parties from localStorage
        const saved = loadDynamicParties(initialEnv, client);
        if (saved.length > 0) {
          setDynamicParties(saved);
          log(`Loaded ${saved.length} custom account(s) from local storage`);
        }

        const otherEnv: EnvironmentKey = initialEnv === "local" ? "devnet" : "local";
        if (envs[otherEnv]) {
          log(`${otherEnv === "local" ? "Local Sandbox" : "DevNet"} also available — use the environment switcher`);
        }
      } else {
        log("No ledger config found — run setup-local.sh or deploy-devnet.sh");
        setConnectionError("No ledger configuration found. Run setup-local.sh or deploy-devnet.sh to connect.");
      }
      setConfigsLoaded(true);
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
    setProposals([]);
    setPayments([]);
    setAuditSummaries([]);

    // Reset active party to "client" on environment switch
    setActiveParty("client");

    // Create new client for the target environment
    const client = new CantonDevNetClient(config);
    devNetClientRef.current = client;
    setActiveEnvironment(env);
    setIsConnected(true);

    // Load dynamic parties for this environment
    const saved = loadDynamicParties(env, client);
    setDynamicParties(saved);

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
      setProposals(result.proposals);
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

  // ── Create proposal (no auto-accept) ─────────────────────────────
  const createProposal = useCallback(
    (
      freelancerRole: string,
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
      const freelancerParty = allParties[freelancerRole];
      const freelancerName = freelancerParty?.shortName || freelancerRole;
      devNetClientRef.current
        .createProposal(activeParty, freelancerRole, description, hourlyRate, totalBudget, milestonesTotal)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast(`Proposal sent to ${freelancerName}. Switch to their account to accept it.`, "success");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error creating proposal: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, allParties, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Accept proposal ──────────────────────────────────────────────
  const acceptProposal = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction(`acceptProposal:${contractId}`);
      devNetClientRef.current
        .acceptProposal(contractId, activeParty)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Contract created! Submit milestones to track progress.", "success");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error accepting proposal: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Reject proposal ──────────────────────────────────────────────
  const rejectProposal = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction(`rejectProposal:${contractId}`);
      devNetClientRef.current
        .rejectProposal(contractId, activeParty)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Proposal declined", "info");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error declining proposal: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Submit milestone ──────────────────────────────────────────────
  const submitMilestone = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      // Use activeParty — should be a freelancer
      const role = activeParty;

      setIsLoading(true);
      setLoadingAction(`submitMilestone:${contractId}`);
      devNetClientRef.current
        .submitMilestone(contractId, role)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Milestone submitted. Switch to the Client to approve and pay.", "info");
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
        .approveMilestone(contractId, payment, activeParty)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast(`Milestone approved — $${payment.toLocaleString()} paid to freelancer.`, "success");
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
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Reject milestone ─────────────────────────────────────────────
  const rejectMilestone = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction(`rejectMilestone:${contractId}`);
      devNetClientRef.current
        .rejectMilestone(contractId, activeParty)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Milestone rejected — sent back for revision", "warning");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error rejecting milestone: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Cancel contract ─────────────────────────────────────────────
  const cancelContract = useCallback(
    (contractId: string) => {
      if (!devNetClientRef.current) {
        log("Not connected");
        return;
      }
      setIsLoading(true);
      setLoadingAction(`cancelContract:${contractId}`);
      devNetClientRef.current
        .cancelContract(contractId, activeParty)
        .then(({ apiCall }) => {
          log(apiCall.description);
          addToast("Contract cancelled", "info");
          syncApiCalls();
          refreshContracts();
        })
        .catch((err) => {
          log(`Error: ${String(err)}`);
          addToast(`Error cancelling contract: ${String(err)}`, "danger");
          syncApiCalls();
        })
        .finally(() => { setIsLoading(false); setLoadingAction(null); });
    },
    [activeParty, log, refreshContracts, addToast, syncApiCalls]
  );

  // ── Generate audit summary ────────────────────────────────────────
  const generateAuditSummary = useCallback((reportPeriod: string) => {
    if (!devNetClientRef.current) {
      log("Not connected");
      return;
    }
    // Find first available auditor
    const auditorEntry = Object.entries(allParties).find(([, p]) => p.role === "Auditor");
    if (!auditorEntry) {
      addToast("No auditor account found — create one first", "warning");
      return;
    }
    const auditorRole = auditorEntry[0];

    setIsLoading(true);
    setLoadingAction("generateAudit");
    const totalContracts = contracts.length;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    devNetClientRef.current
      .generateAuditSummary(totalContracts, totalPaid, activeParty, auditorRole, reportPeriod)
      .then(({ apiCall }) => {
        log(apiCall.description);
        addToast("Audit generated. Switch to the Auditor to see aggregate-only data.", "success");
        syncApiCalls();
        refreshContracts();
      })
      .catch((err) => {
        log(`Error: ${String(err)}`);
        addToast(`Error generating audit: ${String(err)}`, "danger");
        syncApiCalls();
      })
      .finally(() => { setIsLoading(false); setLoadingAction(null); });
  }, [activeParty, allParties, contracts, payments, log, refreshContracts, addToast, syncApiCalls]);

  // ── Create account (dynamic party) ────────────────────────────────
  const createAccount = useCallback(async (displayName: string, roleCategory: PartyRoleCategory) => {
    if (!devNetClientRef.current) {
      log("Not connected");
      return;
    }
    if (devNetConfig?.mode !== "local") {
      addToast("Account creation is available in Sandbox mode only", "warning");
      return;
    }

    setIsLoading(true);
    setLoadingAction("createAccount");

    try {
      // Generate unique identifiers
      const sanitized = displayName.replace(/[^a-zA-Z0-9_]/g, "_");
      const ts = Date.now();
      const hint = `${sanitized}_${ts}`;
      const userId = `${sanitized.toLowerCase()}_user_${ts}`;
      const partyKey = `${roleCategory.toLowerCase()}_${sanitized.toLowerCase()}_${ts}`;

      // Step 1: Allocate party on Canton ledger
      const partyId = await devNetClientRef.current.allocateParty(hint, displayName);
      log(`Allocated party: ${partyId}`);

      // Step 2: Create user with rights
      await devNetClientRef.current.createUser(userId, partyId);
      log(`Created user: ${userId}`);

      // Step 3: Register in client config
      const partyConfig: DevNetPartyConfig = { partyId, userId, token: "" };
      devNetClientRef.current.registerParty(partyKey, partyConfig);

      // Step 4: Create Party object for UI
      const newEntry: DynamicPartyEntry = {
        id: partyKey,
        name: hint,
        displayName: `${displayName} (${roleCategory})`,
        shortName: displayName,
        avatar: generateAvatar(displayName),
        role: roleCategory,
        color: roleColor(roleCategory),
        isPreset: false,
        partyConfig,
      };

      // Step 5: Add to global PARTIES map
      PARTIES[partyKey] = newEntry;

      // Step 6: Update dynamic parties state + persist
      setDynamicParties((prev) => {
        const updated = [...prev, newEntry];
        saveDynamicParties(activeEnvironment, updated);
        return updated;
      });

      // Step 7: Switch to new account
      setActiveParty(partyKey);
      addToast(`Account "${displayName}" created as ${roleCategory}`, "success");
    } catch (err) {
      log(`Error creating account: ${String(err)}`);
      addToast(`Failed to create account: ${String(err)}`, "danger");
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [devNetConfig, activeEnvironment, log, addToast]);

  return (
    <StoreContext.Provider
      value={{
        activeParty,
        setActiveParty,
        visibleContracts: contracts,
        visibleProposals: proposals,
        visiblePayments: payments,
        visibleAuditSummaries: auditSummaries,
        createProposal,
        acceptProposal,
        rejectProposal,
        submitMilestone,
        approveMilestone,
        rejectMilestone,
        cancelContract,
        generateAuditSummary,
        apiCalls,
        actionLog,
        isLoading,
        isConnected,
        configsLoaded,
        connectionError,
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
        allParties,
        createAccount,
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
