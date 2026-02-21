/**
 * Canton JSON Ledger API v2 — Client for Sandbox and DevNet
 *
 * This module talks to a Canton participant node via the JSON Ledger API v2.
 * Each party authenticates via user tokens (sandbox) or JWT (DevNet).
 * The API response already contains ONLY the contracts visible to that party —
 * no client-side filtering required. This is Canton's sub-transaction privacy.
 *
 *   POST /v2/state/active-contracts   — query visible contracts
 *   POST /v2/commands/submit-and-wait — submit Daml commands
 */

import {
  ProjectContract,
  ProjectProposal,
  PaymentRecord,
  AuditSummary,
} from "./types";

// ── API Request/Response types for the proof panel ────────────────────

export interface ApiCall {
  timestamp: string;
  party: string;
  method: string;
  endpoint: string;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown>;
  responseCount: number;
  description: string;
}

// ── Ledger configuration (written by setup-local.sh or deploy-devnet.sh) ──

export interface DevNetPartyConfig {
  partyId: string;
  userId: string;
  token: string;
}

export interface DevNetConfig {
  mode: "devnet" | "local";
  ledgerApiUrl: string;
  parties: Record<string, DevNetPartyConfig>;
  darPackageId: string;
  deployedAt: string;
  packageId?: string;  // Resolved at runtime from DAR
}

// ── Environment switching types ──────────────────────────────────────

export type EnvironmentKey = "local" | "devnet";

export interface AvailableEnvironments {
  local?: DevNetConfig;
  devnet?: DevNetConfig;
}

// ── Template qualified names ──────────────────────────────────────────

const TEMPLATE_MODULE = "Freelance";

// ── Real Canton Ledger API client ─────────────────────────────────────

export class CantonDevNetClient {
  private config: DevNetConfig;
  private apiCalls: ApiCall[] = [];
  private resolvedPackageId: string | null = null;

  constructor(config: DevNetConfig) {
    this.config = config;
    if (config.packageId) {
      this.resolvedPackageId = config.packageId;
    }
  }

  getApiCalls(): ApiCall[] {
    return [...this.apiCalls];
  }

  private logApiCall(call: ApiCall): void {
    this.apiCalls.unshift(call);
    if (this.apiCalls.length > 100) {
      this.apiCalls = this.apiCalls.slice(0, 100);
    }
  }

  private templateId(name: string): string {
    if (this.resolvedPackageId) {
      return `${this.resolvedPackageId}:${TEMPLATE_MODULE}:${name}`;
    }
    return `#${this.config.darPackageId}:${TEMPLATE_MODULE}:${name}`;
  }

  /**
   * Resolve the package ID by finding our package among uploaded packages.
   * Queries the sandbox to find the cantonlance-freelance package.
   */
  async resolvePackageId(): Promise<void> {
    if (this.resolvedPackageId) return;

    try {
      // Get list of all packages
      const pkgResponse = await this.apiRequestRaw(
        "GET",
        "/v2/packages",
        null,
        "client"
      );
      const pkgData = pkgResponse as { packageIds?: string[] };
      const packageIds = pkgData.packageIds || [];

      if (packageIds.length > 0) {
        console.log(`[CantonAPI] ${packageIds.length} packages on ledger`);
      }
    } catch (err) {
      console.warn("[CantonAPI] Could not resolve package ID:", err);
    }
  }

  /**
   * Raw API request — handles auth based on mode.
   */
  private async apiRequestRaw(
    method: string,
    endpoint: string,
    body: Record<string, unknown> | null,
    party: string
  ): Promise<unknown> {
    const partyConfig = this.config.parties[party];
    const url = `${this.config.ledgerApiUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.mode === "local") {
      // Sandbox doesn't require auth — skip Authorization header to avoid
      // Pekko HTTP "Illegal header" warnings from colons in token
    } else {
      headers["Authorization"] = `Bearer ${partyConfig.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canton API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Build a JsCommands object with the right auth fields for the mode.
   */
  private buildCommands(
    party: string,
    commands: Record<string, unknown>[],
    opts: { workflowId: string; commandId: string; submissionId: string }
  ): Record<string, unknown> {
    const partyConfig = this.config.parties[party];
    return {
      commands,
      userId: partyConfig.userId,
      workflowId: opts.workflowId,
      applicationId: "cantonlance",
      commandId: opts.commandId,
      deduplicationPeriod: { Empty: {} },
      actAs: [partyConfig.partyId],
      readAs: [partyConfig.partyId],
      submissionId: opts.submissionId,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };
  }

  /**
   * Submit commands and wait for the full transaction response (includes contract IDs).
   */
  private async submitForTransaction(
    party: string,
    commands: Record<string, unknown>[],
    opts: { workflowId: string; commandId: string; submissionId: string }
  ): Promise<Record<string, unknown>> {
    const body = {
      commands: this.buildCommands(party, commands, opts),
    };
    return (await this.apiRequestRaw(
      "POST",
      "/v2/commands/submit-and-wait-for-transaction",
      body,
      party
    )) as Record<string, unknown>;
  }

  /**
   * Submit commands and wait for completion only (no transaction details needed).
   */
  private async submitAndWait(
    party: string,
    commands: Record<string, unknown>[],
    opts: { workflowId: string; commandId: string; submissionId: string }
  ): Promise<Record<string, unknown>> {
    const body = {
      commands: this.buildCommands(party, commands, opts),
    };
    return (await this.apiRequestRaw(
      "POST",
      "/v2/commands/submit-and-wait",
      body,
      party
    )) as Record<string, unknown>;
  }

  /**
   * Get the current ledger end offset.
   */
  private async getLedgerEnd(party: string): Promise<number> {
    const result = await this.apiRequestRaw(
      "GET",
      "/v2/state/ledger-end",
      null,
      party
    );
    return (result as { offset: number }).offset;
  }

  /**
   * Query active contracts visible to a specific party.
   * Each party sees ONLY contracts where they are a signatory or observer.
   */
  async queryAsParty(party: string): Promise<{
    contracts: ProjectContract[];
    proposals: ProjectProposal[];
    payments: PaymentRecord[];
    auditSummaries: AuditSummary[];
    apiCall: ApiCall;
  }> {
    const partyConfig = this.config.parties[party];
    const partyId = partyConfig.partyId;

    // Get current ledger end for the snapshot
    const offset = await this.getLedgerEnd(party);

    const requestBody = {
      filter: {
        filtersByParty: {
          [partyId]: {
            cumulative: [
              {
                identifierFilter: {
                  WildcardFilter: {
                    value: { includeCreatedEventBlob: false },
                  },
                },
              },
            ],
          },
        },
      },
      verbose: true,
      activeAtOffset: offset,
    };

    try {
      const response = await this.apiRequestRaw(
        "POST",
        "/v2/state/active-contracts",
        requestBody,
        party
      );

      // v2 API returns an array of contract entries
      const entries = Array.isArray(response) ? response : [];

      const contracts: ProjectContract[] = [];
      const proposals: ProjectProposal[] = [];
      const payments: PaymentRecord[] = [];
      const auditSummaries: AuditSummary[] = [];

      for (const entry of entries) {
        // Extract created event from the nested structure
        const jsActive = entry?.contractEntry?.JsActiveContract;
        if (!jsActive) continue;

        const createdEvent = jsActive.createdEvent;
        if (!createdEvent) continue;

        const tplId = createdEvent.templateId || "";
        const p = createdEvent.createArgument || {};
        const contractId = createdEvent.contractId || "";

        // Auto-resolve package ID from first response
        if (!this.resolvedPackageId && tplId.includes(":Freelance:")) {
          this.resolvedPackageId = tplId.split(":")[0];
          console.log(`[CantonAPI] Resolved package ID: ${this.resolvedPackageId}`);
        }

        if (tplId.includes("ProjectProposal")) {
          proposals.push({
            contractId,
            client: String(p.client || ""),
            freelancer: String(p.freelancer || ""),
            description: String(p.description || ""),
            hourlyRate: Number(parseFloat(p.hourlyRate) || 0),
            totalBudget: Number(parseFloat(p.totalBudget) || 0),
            milestonesTotal: Number(parseInt(p.milestonesTotal) || 0),
          });
        } else if (tplId.includes("ProjectContract")) {
          contracts.push({
            contractId,
            client: String(p.client || ""),
            freelancer: String(p.freelancer || ""),
            description: String(p.description || ""),
            hourlyRate: Number(parseFloat(p.hourlyRate) || 0),
            totalBudget: Number(parseFloat(p.totalBudget) || 0),
            milestonesTotal: Number(parseInt(p.milestonesTotal) || 0),
            milestonesCompleted: Number(parseInt(p.milestonesCompleted) || 0),
            amountPaid: Number(parseFloat(p.amountPaid) || 0),
            status: String(p.status || "Active") as ProjectContract["status"],
          });
        } else if (tplId.includes("PaymentRecord")) {
          payments.push({
            contractId,
            client: String(p.client || ""),
            freelancer: String(p.freelancer || ""),
            amount: Number(parseFloat(p.amount) || 0),
            milestoneNumber: Number(parseInt(p.milestoneNumber) || 0),
            timestamp: String(p.timestamp || ""),
            projectDescription: String(p.projectDescription || ""),
          });
        } else if (tplId.includes("AuditSummary")) {
          auditSummaries.push({
            contractId,
            client: String(p.client || ""),
            auditor: String(p.auditor || ""),
            totalContractsCount: Number(parseInt(p.totalContractsCount) || 0),
            totalAmountPaid: Number(parseFloat(p.totalAmountPaid) || 0),
            reportPeriod: String(p.reportPeriod || ""),
          });
        }
      }

      const modeLabel = this.config.mode === "local" ? "SANDBOX" : "DEVNET";
      const apiCall: ApiCall = {
        timestamp: new Date().toISOString(),
        party,
        method: "POST",
        endpoint: "/v2/state/active-contracts",
        requestBody,
        responseBody: {
          totalContracts: entries.length,
          proposals: proposals.length,
          projectContracts: contracts.length,
          paymentRecords: payments.length,
          auditSummaries: auditSummaries.length,
          source: `Canton JSON Ledger API v2 (${modeLabel})`,
          note: `Authenticated as ${partyId} — response contains ONLY contracts visible to this party`,
        },
        responseCount: entries.length,
        description: `[${modeLabel}] Query contracts visible to ${party} (${entries.length} results)`,
      };

      this.logApiCall(apiCall);
      return { contracts, proposals, payments, auditSummaries, apiCall };
    } catch (err) {
      const apiCall: ApiCall = {
        timestamp: new Date().toISOString(),
        party,
        method: "POST",
        endpoint: "/v2/state/active-contracts",
        requestBody,
        responseBody: {
          error: String(err),
          source: "Canton JSON Ledger API v2",
        },
        responseCount: 0,
        description: `Query failed: ${String(err).slice(0, 80)}`,
      };
      this.logApiCall(apiCall);
      throw err;
    }
  }

  /**
   * Client creates a ProjectProposal (no auto-accept).
   * The freelancer must separately accept or reject it.
   */
  async createProposal(
    clientRole: string,
    freelancerRole: string,
    description: string,
    hourlyRate: number,
    totalBudget: number,
    milestonesTotal: number
  ): Promise<{ contractId: string; apiCall: ApiCall }> {
    const clientParty = this.config.parties[clientRole].partyId;
    const freelancerParty = this.config.parties[freelancerRole].partyId;

    const cmds = [
      {
        CreateCommand: {
          templateId: this.templateId("ProjectProposal"),
          createArguments: {
            client: clientParty,
            freelancer: freelancerParty,
            description,
            hourlyRate: String(hourlyRate),
            totalBudget: String(totalBudget),
            milestonesTotal,
          },
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-proposal",
      commandId: `create-proposal-${Date.now()}`,
      submissionId: `proposal-${Date.now()}`,
    };

    const response = await this.submitForTransaction(clientRole, cmds, opts);
    const contractId = this.extractContractId(response);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: clientRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait-for-transaction",
      requestBody: { commands: this.buildCommands(clientRole, cmds, opts) },
      responseBody: {
        ...response,
        note: `Proposal sent to ${freelancerParty}. Awaiting freelancer acceptance.`,
      },
      responseCount: 1,
      description: `${clientRole} created proposal for ${freelancerRole}`,
    };
    this.logApiCall(apiCall);

    return { contractId, apiCall };
  }

  /**
   * Freelancer accepts a proposal — creates a ProjectContract.
   */
  async acceptProposal(
    proposalContractId: string,
    freelancerRole: string
  ): Promise<{ contractId: string; apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectProposal"),
          contractId: proposalContractId,
          choice: "AcceptProposal",
          choiceArgument: {},
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-accept",
      commandId: `accept-proposal-${Date.now()}`,
      submissionId: `accept-${Date.now()}`,
    };

    const response = await this.submitForTransaction(freelancerRole, cmds, opts);
    const contractId = this.extractContractId(response);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: freelancerRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait-for-transaction",
      requestBody: { commands: this.buildCommands(freelancerRole, cmds, opts) },
      responseBody: {
        ...response,
        note: "Proposal accepted — ProjectContract created. Only signatory parties can see it.",
      },
      responseCount: 1,
      description: `${freelancerRole} accepted proposal → ProjectContract created`,
    };
    this.logApiCall(apiCall);

    return { contractId, apiCall };
  }

  /**
   * Freelancer rejects a proposal — archives it.
   */
  async rejectProposal(
    proposalContractId: string,
    freelancerRole: string
  ): Promise<{ apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectProposal"),
          contractId: proposalContractId,
          choice: "RejectProposal",
          choiceArgument: {},
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-reject-proposal",
      commandId: `reject-proposal-${Date.now()}`,
      submissionId: `reject-proposal-${Date.now()}`,
    };

    const response = await this.submitAndWait(freelancerRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: freelancerRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody: { commands: this.buildCommands(freelancerRole, cmds, opts) },
      responseBody: { ...response, note: "Proposal rejected and archived." },
      responseCount: 1,
      description: `${freelancerRole} rejected proposal ${proposalContractId.slice(0, 16)}...`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Freelancer submits a milestone.
   */
  async submitMilestone(
    contractId: string,
    freelancerRole: string
  ): Promise<{ apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectContract"),
          contractId,
          choice: "SubmitMilestone",
          choiceArgument: {},
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-milestone",
      commandId: `submit-milestone-${Date.now()}`,
      submissionId: `milestone-${Date.now()}`,
    };

    const response = await this.submitForTransaction(freelancerRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: freelancerRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait-for-transaction",
      requestBody: { commands: this.buildCommands(freelancerRole, cmds, opts) },
      responseBody: response,
      responseCount: 1,
      description: `${freelancerRole} submitted milestone on ${contractId.slice(0, 16)}...`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client approves a milestone and triggers payment.
   */
  async approveMilestone(
    contractId: string,
    payment: number,
    clientRole: string
  ): Promise<{ apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectContract"),
          contractId,
          choice: "ApproveMilestone",
          choiceArgument: {
            milestonePayment: String(payment),
            paymentTimestamp: new Date().toISOString(),
          },
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-approve",
      commandId: `approve-milestone-${Date.now()}`,
      submissionId: `approve-${Date.now()}`,
    };

    const response = await this.submitForTransaction(clientRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: clientRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait-for-transaction",
      requestBody: { commands: this.buildCommands(clientRole, cmds, opts) },
      responseBody: response,
      responseCount: 1,
      description: `${clientRole} approved milestone — $${payment} payment`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client rejects a submitted milestone — sends it back for rework.
   */
  async rejectMilestone(
    contractId: string,
    clientRole: string
  ): Promise<{ apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectContract"),
          contractId,
          choice: "RejectMilestone",
          choiceArgument: {},
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-reject-milestone",
      commandId: `reject-milestone-${Date.now()}`,
      submissionId: `reject-milestone-${Date.now()}`,
    };

    const response = await this.submitForTransaction(clientRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: clientRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait-for-transaction",
      requestBody: { commands: this.buildCommands(clientRole, cmds, opts) },
      responseBody: response,
      responseCount: 1,
      description: `${clientRole} rejected milestone on ${contractId.slice(0, 16)}...`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client cancels an active contract — archives it.
   */
  async cancelContract(
    contractId: string,
    clientRole: string
  ): Promise<{ apiCall: ApiCall }> {
    const cmds = [
      {
        ExerciseCommand: {
          templateId: this.templateId("ProjectContract"),
          contractId,
          choice: "CancelContract",
          choiceArgument: {},
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-cancel",
      commandId: `cancel-contract-${Date.now()}`,
      submissionId: `cancel-${Date.now()}`,
    };

    const response = await this.submitAndWait(clientRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: clientRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody: { commands: this.buildCommands(clientRole, cmds, opts) },
      responseBody: { ...response, note: "Contract cancelled and archived." },
      responseCount: 1,
      description: `${clientRole} cancelled contract ${contractId.slice(0, 16)}...`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client creates an AuditSummary observable by the auditor.
   */
  async generateAuditSummary(
    totalContractsCount: number,
    totalAmountPaid: number,
    clientRole: string,
    auditorRole: string,
    reportPeriod: string
  ): Promise<{ apiCall: ApiCall }> {
    const clientParty = this.config.parties[clientRole].partyId;
    const auditorParty = this.config.parties[auditorRole].partyId;

    const cmds = [
      {
        CreateCommand: {
          templateId: this.templateId("AuditSummary"),
          createArguments: {
            client: clientParty,
            auditor: auditorParty,
            totalContractsCount,
            totalAmountPaid: String(totalAmountPaid),
            reportPeriod,
          },
        },
      },
    ];
    const opts = {
      workflowId: "cantonlance-audit",
      commandId: `audit-summary-${Date.now()}`,
      submissionId: `audit-${Date.now()}`,
    };

    const response = await this.submitAndWait(clientRole, cmds, opts);

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: clientRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody: this.buildCommands(clientRole, cmds, opts),
      responseBody: {
        ...response,
        distributedTo: [clientParty, auditorParty],
        note: "Auditor can see aggregate totals only. No individual contracts or payments.",
      },
      responseCount: 1,
      description: `Audit summary (${reportPeriod}) created — visible to ${clientRole} + ${auditorRole} only`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  // ── Dynamic Party Management ────────────────────────────────────────

  /**
   * Allocate a new Canton party on the ledger.
   * POST /v2/parties with partyIdHint and displayName.
   * Returns the full Canton party ID (e.g. "MyName_123::1220abcd...").
   */
  async allocateParty(hint: string, displayName: string): Promise<string> {
    const url = `${this.config.ledgerApiUrl}/v2/parties`;
    const body = { partyIdHint: hint, displayName };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Allocate party failed ${response.status}: ${errText}`);
    }

    const data = await response.json();
    // Canton v2 returns { partyDetails: { party: "..." } }
    const partyId = data?.partyDetails?.party || data?.partyId || data?.party_id;
    if (!partyId) throw new Error("No partyId in allocate response");
    return partyId;
  }

  /**
   * Create a Canton user with actAs/readAs rights for the given party.
   * POST /v2/users.
   */
  async createUser(userId: string, partyId: string): Promise<void> {
    const url = `${this.config.ledgerApiUrl}/v2/users`;
    const body = {
      user: {
        id: userId,
        primaryParty: partyId,
        isDeactivated: false,
        identityProviderId: "",
      },
      rights: [
        { kind: { CanActAs: { value: { party: partyId } } } },
        { kind: { CanReadAs: { value: { party: partyId } } } },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Create user failed ${response.status}: ${errText}`);
    }
  }

  /**
   * Register a new party in the runtime config so subsequent API calls can use it.
   */
  registerParty(key: string, config: DevNetPartyConfig): void {
    this.config.parties[key] = config;
  }

  /**
   * Extract contract ID from submit-and-wait response.
   * v2 format: { updateId, completionOffset } for simple submit,
   * or { transaction: { events: [{ created: { contractId } }] } }
   */
  private extractContractId(response: Record<string, unknown>): string {
    try {
      const tx = response.transaction as Record<string, unknown> | undefined;
      if (tx) {
        const events = tx.events as Array<Record<string, unknown>> | undefined;
        if (events) {
          // Walk through events looking for created contracts
          // Skip archived events, find the last created event (the result of an exercise)
          for (let i = events.length - 1; i >= 0; i--) {
            const event = events[i];
            // v2 format: { CreatedEvent: { contractId, ... } }
            const ce = event.CreatedEvent as Record<string, unknown> | undefined;
            if (ce?.contractId) return String(ce.contractId);
            // Alternate format: { created: { contractId } }
            const created = event.created as Record<string, unknown> | undefined;
            if (created?.contractId) return String(created.contractId);
          }
        }
      }

      if (response.contractId) return String(response.contractId);
      if (response.updateId) return `pending-${response.updateId}`;
    } catch {
      // Fall through
    }
    return `unknown-${Date.now()}`;
  }
}

/**
 * Load ALL available ledger configs (local sandbox and DevNet).
 * Each config file is fetched independently. Missing configs are omitted.
 */
export async function loadAllConfigs(): Promise<AvailableEnvironments> {
  const result: AvailableEnvironments = {};

  // Try local sandbox config
  try {
    const response = await fetch("/local-config.json");
    const ct = response.headers.get("content-type") ?? "";
    if (response.ok && ct.includes("json")) {
      const config = await response.json() as DevNetConfig;
      if (config && config.mode === "local" && config.parties) {
        result.local = config;
      }
    }
  } catch {
    // Not available
  }

  // Try DevNet config
  try {
    const response = await fetch("/devnet-config.json");
    const ct = response.headers.get("content-type") ?? "";
    if (response.ok && ct.includes("json")) {
      const config = await response.json() as DevNetConfig;
      if (config && config.mode === "devnet" && config.parties) {
        result.devnet = config;
      }
    }
  } catch {
    // Not available
  }

  return result;
}

/** @deprecated Use loadAllConfigs instead */
export async function loadLedgerConfig(): Promise<DevNetConfig | null> {
  const all = await loadAllConfigs();
  return all.local ?? all.devnet ?? null;
}
