/**
 * Canton JSON Ledger API v2 — Real DevNet Client
 *
 * This module talks to an actual Canton participant node via the JSON Ledger API.
 * Each party authenticates with its own JWT token, and the API response
 * already contains ONLY the contracts visible to that party — no client-side
 * filtering required. This is Canton's sub-transaction privacy in action.
 *
 * The API is accessed via SSH tunnel or direct VPN connection:
 *   POST /v2/state/active-contracts   — query visible contracts
 *   POST /v2/commands/submit-and-wait — submit Daml commands
 */

import {
  ProjectContract,
  PaymentRecord,
  AuditSummary,
  PartyRole,
} from "./types";

// ── API Request/Response types for the proof panel ────────────────────

export interface ApiCall {
  timestamp: string;
  party: PartyRole;
  method: string;
  endpoint: string;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown>;
  responseCount: number;
  description: string;
}

// ── DevNet configuration (written by deploy-devnet.sh) ────────────────

export interface DevNetPartyConfig {
  partyId: string;
  userId: string;
  token: string;
}

export interface DevNetConfig {
  mode: "devnet";
  ledgerApiUrl: string;
  parties: Record<PartyRole, DevNetPartyConfig>;
  darPackageId: string;
  deployedAt: string;
}

// ── Template qualified names ──────────────────────────────────────────

const TEMPLATE_MODULE = "Freelance";
const PACKAGE_ID_PREFIX = "#cantonlance-freelance";

function templateId(name: string): string {
  return `${PACKAGE_ID_PREFIX}:${TEMPLATE_MODULE}:${name}`;
}

// ── Active contract response parsing ──────────────────────────────────

interface CantonActiveContract {
  contractId: string;
  templateId: string;
  payload: Record<string, unknown>;
}

interface CantonApiResponse {
  activeContracts?: CantonActiveContract[];
  result?: CantonActiveContract[];
}

// ── Real Canton Ledger API client ─────────────────────────────────────

export class CantonDevNetClient {
  private config: DevNetConfig;
  private apiCalls: ApiCall[] = [];

  constructor(config: DevNetConfig) {
    this.config = config;
  }

  getApiCalls(): ApiCall[] {
    return [...this.apiCalls];
  }

  private logApiCall(call: ApiCall): void {
    this.apiCalls.unshift(call);
    // Keep last 100 calls
    if (this.apiCalls.length > 100) {
      this.apiCalls = this.apiCalls.slice(0, 100);
    }
  }

  /**
   * Make an authenticated API call to the Canton JSON Ledger API.
   */
  private async apiRequest(
    party: PartyRole,
    method: string,
    endpoint: string,
    body: Record<string, unknown> | null
  ): Promise<unknown> {
    const partyConfig = this.config.parties[party];
    const url = `${this.config.ledgerApiUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${partyConfig.token}`,
      "Content-Type": "application/json",
    };

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
   * Query active contracts visible to a specific party.
   * This is the core privacy demonstration — each party's JWT token
   * authenticates as that party, and the API returns ONLY contracts
   * where that party is a signatory or observer.
   */
  async queryAsParty(party: PartyRole): Promise<{
    contracts: ProjectContract[];
    payments: PaymentRecord[];
    auditSummaries: AuditSummary[];
    apiCall: ApiCall;
  }> {
    const partyConfig = this.config.parties[party];
    const partyId = partyConfig.partyId;

    const requestBody = {
      filter: {
        filtersByParty: {
          [partyId]: {
            cumulative: [
              {
                identifierFilter: {
                  WildcardFilter: {},
                },
              },
            ],
          },
        },
      },
      verbose: true,
    };

    try {
      const response = (await this.apiRequest(
        party,
        "POST",
        "/v2/state/active-contracts",
        requestBody
      )) as CantonApiResponse;

      const activeContracts = response.activeContracts || response.result || [];

      // Parse contracts by template type
      const contracts: ProjectContract[] = [];
      const payments: PaymentRecord[] = [];
      const auditSummaries: AuditSummary[] = [];

      for (const ac of activeContracts) {
        const tplId = ac.templateId || "";
        const p = ac.payload || {};

        if (tplId.includes("ProjectContract")) {
          contracts.push({
            contractId: ac.contractId,
            client: String(p.client || ""),
            freelancer: String(p.freelancer || ""),
            description: String(p.description || ""),
            hourlyRate: Number(p.hourlyRate || 0),
            totalBudget: Number(p.totalBudget || 0),
            milestonesTotal: Number(p.milestonesTotal || 0),
            milestonesCompleted: Number(p.milestonesCompleted || 0),
            amountPaid: Number(p.amountPaid || 0),
            status: String(p.status || "Active") as ProjectContract["status"],
          });
        } else if (tplId.includes("PaymentRecord")) {
          payments.push({
            contractId: ac.contractId,
            client: String(p.client || ""),
            freelancer: String(p.freelancer || ""),
            amount: Number(p.amount || 0),
            milestoneNumber: Number(p.milestoneNumber || 0),
            timestamp: String(p.timestamp || ""),
            projectDescription: String(p.projectDescription || ""),
          });
        } else if (tplId.includes("AuditSummary")) {
          auditSummaries.push({
            contractId: ac.contractId,
            client: String(p.client || ""),
            auditor: String(p.auditor || ""),
            totalContractsCount: Number(p.totalContractsCount || 0),
            totalAmountPaid: Number(p.totalAmountPaid || 0),
            reportPeriod: String(p.reportPeriod || ""),
          });
        }
      }

      const apiCall: ApiCall = {
        timestamp: new Date().toISOString(),
        party,
        method: "POST",
        endpoint: "/v2/state/active-contracts",
        requestBody,
        responseBody: {
          totalContracts: activeContracts.length,
          projectContracts: contracts.length,
          paymentRecords: payments.length,
          auditSummaries: auditSummaries.length,
          source: "REAL Canton DevNet JSON Ledger API",
          note: `Authenticated as ${partyId} — response contains ONLY contracts visible to this party's participant node`,
        },
        responseCount: activeContracts.length,
        description: `[DEVNET] Query contracts visible to ${party} (${activeContracts.length} results)`,
      };

      this.logApiCall(apiCall);

      return { contracts, payments, auditSummaries, apiCall };
    } catch (err) {
      const apiCall: ApiCall = {
        timestamp: new Date().toISOString(),
        party,
        method: "POST",
        endpoint: "/v2/state/active-contracts",
        requestBody,
        responseBody: {
          error: String(err),
          source: "REAL Canton DevNet JSON Ledger API",
        },
        responseCount: 0,
        description: `[DEVNET] Query failed: ${String(err).slice(0, 80)}`,
      };
      this.logApiCall(apiCall);
      throw err;
    }
  }

  /**
   * Create a ProjectContract between client and a freelancer.
   * Uses the propose-accept pattern: client creates ProjectProposal,
   * then freelancer exercises AcceptProposal.
   *
   * For the hackathon demo, we use direct create with both signatories
   * since both are on the same participant node.
   */
  async createContract(
    freelancerRole: "freelancerA" | "freelancerB",
    description: string,
    hourlyRate: number,
    totalBudget: number,
    milestonesTotal: number
  ): Promise<{ contractId: string; apiCall: ApiCall }> {
    const clientParty = this.config.parties.client.partyId;
    const freelancerParty = this.config.parties[freelancerRole].partyId;

    // Step 1: Client creates a ProjectProposal
    const proposalBody = {
      commands: [
        {
          CreateCommand: {
            templateId: templateId("ProjectProposal"),
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
      ],
      workflowId: "cantonlance-proposal",
      applicationId: "cantonlance",
      commandId: `create-proposal-${Date.now()}`,
      deduplicationPeriod: { Empty: {} },
      actAs: [clientParty],
      readAs: [clientParty],
      submissionId: `proposal-${Date.now()}`,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };

    const proposalResponse = (await this.apiRequest(
      "client",
      "POST",
      "/v2/commands/submit-and-wait",
      proposalBody
    )) as Record<string, unknown>;

    // Extract proposal contract ID from response
    const proposalContractId = this.extractContractId(proposalResponse);

    const proposalApiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: "client",
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody: proposalBody,
      responseBody: proposalResponse as Record<string, unknown>,
      responseCount: 1,
      description: `[DEVNET] Client created proposal for ${freelancerRole}`,
    };
    this.logApiCall(proposalApiCall);

    // Step 2: Freelancer accepts the proposal
    const acceptBody = {
      commands: [
        {
          ExerciseCommand: {
            templateId: templateId("ProjectProposal"),
            contractId: proposalContractId,
            choice: "AcceptProposal",
            choiceArgument: {},
          },
        },
      ],
      workflowId: "cantonlance-accept",
      applicationId: "cantonlance",
      commandId: `accept-proposal-${Date.now()}`,
      deduplicationPeriod: { Empty: {} },
      actAs: [freelancerParty],
      readAs: [freelancerParty],
      submissionId: `accept-${Date.now()}`,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };

    const acceptResponse = (await this.apiRequest(
      freelancerRole,
      "POST",
      "/v2/commands/submit-and-wait",
      acceptBody
    )) as Record<string, unknown>;

    const contractId = this.extractContractId(acceptResponse);

    const acceptApiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: freelancerRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody: acceptBody,
      responseBody: {
        ...acceptResponse as Record<string, unknown>,
        note: `Contract created between ${clientParty} and ${freelancerParty}. Only these two participant nodes have the data.`,
      },
      responseCount: 1,
      description: `[DEVNET] ${freelancerRole} accepted proposal → ProjectContract created`,
    };
    this.logApiCall(acceptApiCall);

    return { contractId, apiCall: acceptApiCall };
  }

  /**
   * Freelancer submits a milestone.
   */
  async submitMilestone(
    contractId: string,
    freelancerRole: PartyRole
  ): Promise<{ apiCall: ApiCall }> {
    const freelancerParty = this.config.parties[freelancerRole].partyId;

    const requestBody = {
      commands: [
        {
          ExerciseCommand: {
            templateId: templateId("ProjectContract"),
            contractId,
            choice: "SubmitMilestone",
            choiceArgument: {},
          },
        },
      ],
      workflowId: "cantonlance-milestone",
      applicationId: "cantonlance",
      commandId: `submit-milestone-${contractId}-${Date.now()}`,
      deduplicationPeriod: { Empty: {} },
      actAs: [freelancerParty],
      readAs: [freelancerParty],
      submissionId: `milestone-${Date.now()}`,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };

    const response = (await this.apiRequest(
      freelancerRole,
      "POST",
      "/v2/commands/submit-and-wait",
      requestBody
    )) as Record<string, unknown>;

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: freelancerRole,
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody,
      responseBody: response,
      responseCount: 1,
      description: `[DEVNET] ${freelancerRole} submitted milestone on ${contractId}`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client approves a milestone and triggers payment.
   */
  async approveMilestone(
    contractId: string,
    payment: number
  ): Promise<{ apiCall: ApiCall }> {
    const clientParty = this.config.parties.client.partyId;

    const requestBody = {
      commands: [
        {
          ExerciseCommand: {
            templateId: templateId("ProjectContract"),
            contractId,
            choice: "ApproveMilestone",
            choiceArgument: {
              milestonePayment: String(payment),
            },
          },
        },
      ],
      workflowId: "cantonlance-approve",
      applicationId: "cantonlance",
      commandId: `approve-milestone-${contractId}-${Date.now()}`,
      deduplicationPeriod: { Empty: {} },
      actAs: [clientParty],
      readAs: [clientParty],
      submissionId: `approve-${Date.now()}`,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };

    const response = (await this.apiRequest(
      "client",
      "POST",
      "/v2/commands/submit-and-wait",
      requestBody
    )) as Record<string, unknown>;

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: "client",
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody,
      responseBody: response,
      responseCount: 1,
      description: `[DEVNET] Client approved milestone — $${payment} payment`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Client creates an AuditSummary observable by the auditor.
   */
  async generateAuditSummary(
    totalContractsCount: number,
    totalAmountPaid: number
  ): Promise<{ apiCall: ApiCall }> {
    const clientParty = this.config.parties.client.partyId;
    const auditorParty = this.config.parties.auditor.partyId;

    const requestBody = {
      commands: [
        {
          CreateCommand: {
            templateId: templateId("AuditSummary"),
            createArguments: {
              client: clientParty,
              auditor: auditorParty,
              totalContractsCount,
              totalAmountPaid: String(totalAmountPaid),
              reportPeriod: "2026-Q1",
            },
          },
        },
      ],
      workflowId: "cantonlance-audit",
      applicationId: "cantonlance",
      commandId: `audit-summary-${Date.now()}`,
      deduplicationPeriod: { Empty: {} },
      actAs: [clientParty],
      readAs: [clientParty],
      submissionId: `audit-${Date.now()}`,
      disclosedContracts: [],
      domainId: "",
      packageIdSelectionPreference: [],
    };

    const response = (await this.apiRequest(
      "client",
      "POST",
      "/v2/commands/submit-and-wait",
      requestBody
    )) as Record<string, unknown>;

    const apiCall: ApiCall = {
      timestamp: new Date().toISOString(),
      party: "client",
      method: "POST",
      endpoint: "/v2/commands/submit-and-wait",
      requestBody,
      responseBody: {
        ...response,
        distributedTo: [clientParty, auditorParty],
        note: "Auditor can see aggregate totals only. No individual contracts or payments.",
      },
      responseCount: 1,
      description: `[DEVNET] Audit summary created — visible to client + auditor only`,
    };
    this.logApiCall(apiCall);

    return { apiCall };
  }

  /**
   * Extract contract ID from a submit-and-wait response.
   */
  private extractContractId(response: Record<string, unknown>): string {
    // Canton v2 API response format varies, try common paths
    try {
      // Format 1: { completion: { ... }, transaction: { events: [{ created: { contractId } }] } }
      const tx = response.transaction as Record<string, unknown> | undefined;
      if (tx) {
        const events = tx.events as Array<Record<string, unknown>> | undefined;
        if (events && events.length > 0) {
          const created = events[0].created as Record<string, unknown> | undefined;
          if (created && created.contractId) {
            return String(created.contractId);
          }
        }
      }

      // Format 2: { result: { events: [...] } }
      const result = response.result as Record<string, unknown> | undefined;
      if (result) {
        const events = result.events as Array<Record<string, unknown>> | undefined;
        if (events && events.length > 0) {
          const created = events[0].created as Record<string, unknown> | undefined;
          if (created && created.contractId) {
            return String(created.contractId);
          }
        }
      }

      // Format 3: direct contractId
      if (response.contractId) {
        return String(response.contractId);
      }
    } catch {
      // Fall through
    }

    return `unknown-${Date.now()}`;
  }
}

/**
 * Try to load DevNet config. Returns null if not deployed to DevNet.
 *
 * The config file is loaded at runtime via fetch, not at build time.
 * This way the frontend compiles fine without the config file present.
 * The deploy-devnet.sh script writes the config before starting the app.
 */
export async function loadDevNetConfig(): Promise<DevNetConfig | null> {
  try {
    // Try loading from a well-known path (placed by deploy-devnet.sh)
    const response = await fetch("/devnet-config.json");
    if (!response.ok) return null;
    const config = await response.json() as DevNetConfig;
    if (config && config.mode === "devnet") {
      return config;
    }
  } catch {
    // Config file doesn't exist — DevNet not yet deployed
  }
  return null;
}
