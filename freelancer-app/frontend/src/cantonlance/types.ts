export interface ProjectProposal {
  contractId: string;
  client: string;
  freelancer: string;
  description: string;
  hourlyRate: number;
  totalBudget: number;
  milestonesTotal: number;
}

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
  status: "Active" | "Completed";
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

/** Role category — used for view routing and color assignment */
export type PartyRoleCategory = "Client" | "Freelancer" | "Auditor";

/** Preset party keys (the 4 built-in demo accounts) */
export type PresetPartyRole = "client" | "freelancerA" | "freelancerB" | "auditor";

/** Party role key — string to support both preset and dynamically created parties */
export type PartyRole = string;

export interface Party {
  id: string;
  name: string;
  displayName: string;
  shortName: string;
  avatar: string;
  role: PartyRoleCategory;
  color: string;
  isPreset?: boolean;
}

/** The 4 built-in demo parties */
export const PRESET_PARTIES: Record<PresetPartyRole, Party> = {
  client: {
    id: "client",
    name: "Client_EthFoundation",
    displayName: "Ethereum Foundation (Client)",
    shortName: "Eth Foundation",
    avatar: "EF",
    role: "Client",
    color: "#0d6efd",
    isPreset: true,
  },
  freelancerA: {
    id: "freelancerA",
    name: "FreelancerA_Nidhi",
    displayName: "Nidhi (Freelancer)",
    shortName: "Nidhi",
    avatar: "N",
    role: "Freelancer",
    color: "#198754",
    isPreset: true,
  },
  freelancerB: {
    id: "freelancerB",
    name: "FreelancerB_Akash",
    displayName: "Akash (Freelancer)",
    shortName: "Akash",
    avatar: "A",
    role: "Freelancer",
    color: "#6f42c1",
    isPreset: true,
  },
  auditor: {
    id: "auditor",
    name: "Auditor_Eve",
    displayName: "Eve (Auditor)",
    shortName: "Eve",
    avatar: "E",
    role: "Auditor",
    color: "#dc3545",
    isPreset: true,
  },
};

/** Mutable party map — starts with presets, augmented at runtime with dynamic parties */
export const PARTIES: Record<string, Party> = { ...PRESET_PARTIES };

/** Get a consistent color for a role category */
export function roleColor(role: PartyRoleCategory): string {
  switch (role) {
    case "Client": return "#0d6efd";
    case "Freelancer": return "#198754";
    case "Auditor": return "#dc3545";
  }
}

/** Generate avatar initials from a display name */
export function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

/** Maps a raw Canton party ID (e.g. "FreelancerA_Nidhi::1220abcd...") to a short display name */
export function formatPartyName(raw: string): string {
  const partyList = Object.values(PARTIES);
  for (const p of partyList) {
    if (raw.startsWith(p.name)) {
      return p.shortName;
    }
  }
  const idx = raw.indexOf("::");
  return idx > 0 ? raw.substring(0, idx) : raw;
}

/** Find a party by raw Canton party ID prefix */
export function findPartyByRawId(raw: string): Party | undefined {
  return Object.values(PARTIES).find((p) => raw.startsWith(p.name));
}
