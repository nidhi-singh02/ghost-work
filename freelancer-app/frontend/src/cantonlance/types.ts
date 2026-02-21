export interface ProjectContract {
  contractId: string;
  client: string;
  freelancer: string;
  description: string;
  hourlyRate: number;
  totalBudget: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  amountPaid: number;
  status: "Active" | "Completed" | "Disputed";
}

export interface PaymentRecord {
  contractId: string;
  client: string;
  freelancer: string;
  amount: number;
  milestoneNumber: number;
  timestamp: string;
  projectDescription: string;
}

export interface AuditSummary {
  contractId: string;
  client: string;
  auditor: string;
  totalContractsCount: number;
  totalAmountPaid: number;
  reportPeriod: string;
}

export type PartyRole = "client" | "freelancerA" | "freelancerB" | "auditor";

export interface Party {
  id: PartyRole;
  name: string;
  displayName: string;
  color: string;
}

export const PARTIES: Record<PartyRole, Party> = {
  client: {
    id: "client",
    name: "Client_EthFoundation",
    displayName: "Ethereum Foundation (Client)",
    color: "#0d6efd",
  },
  freelancerA: {
    id: "freelancerA",
    name: "FreelancerA_Nidhi",
    displayName: "Nidhi (Freelancer)",
    color: "#198754",
  },
  freelancerB: {
    id: "freelancerB",
    name: "FreelancerB_Akash",
    displayName: "Akash (Freelancer)",
    color: "#6f42c1",
  },
  auditor: {
    id: "auditor",
    name: "Auditor_Eve",
    displayName: "Eve (Auditor)",
    color: "#dc3545",
  },
};

/** Maps a raw Canton party ID (e.g. "FreelancerA_Nidhi::1220abcd...") to a short display name */
export function formatPartyName(raw: string): string {
  const partyList = Object.values(PARTIES);
  for (const p of partyList) {
    if (raw.startsWith(p.name)) {
      return p.displayName.split(" (")[0]; // "Nidhi", "Akash", "Ethereum Foundation", "Eve"
    }
  }
  // Fallback: strip the ::hash suffix
  const idx = raw.indexOf("::");
  return idx > 0 ? raw.substring(0, idx) : raw;
}
