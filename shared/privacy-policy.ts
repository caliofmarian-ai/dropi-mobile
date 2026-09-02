export type PrivacyLawfulBasis =
  | "consent"
  | "contract"
  | "legal_obligation"
  | "vital_interests"
  | "public_task"
  | "legitimate_interests";

export type PrivacyRetentionMode =
  | "fixed_duration"
  | "expiry_timestamp"
  | "account_or_rights_lifecycle";

export type PrivacyRetentionAction = "delete" | "anonymize" | "defer_to_rights_workflow";

export interface PrivacyRetentionPolicy {
  key: string;
  label: string;
  description: string;
  mode: PrivacyRetentionMode;
  retentionDays: number | null;
  action: PrivacyRetentionAction;
  automatic: boolean;
  authority: string;
}

export interface PrivacyPurpose {
  key: string;
  version: number;
  label: string;
  description: string;
  dataCategories: string[];
  lawfulBasis: PrivacyLawfulBasis;
  consentRequired: boolean;
  retentionPolicyKeys: string[];
}

export const PRIVACY_RETENTION_POLICIES: PrivacyRetentionPolicy[] = [
  {
    key: "session_expiry",
    label: "Authentication session expiry",
    description: "Authentication sessions are removed after their persisted expiry timestamp.",
    mode: "expiry_timestamp",
    retentionDays: null,
    action: "delete",
    automatic: true,
    authority: "Existing persisted session expiry contract",
  },
  {
    key: "credential_expiry",
    label: "Temporary credential expiry",
    description: "Password-reset and email-verification secrets are scrubbed after their persisted expiry timestamp.",
    mode: "expiry_timestamp",
    retentionDays: null,
    action: "anonymize",
    automatic: true,
    authority: "Existing persisted credential expiry contract",
  },
  {
    key: "audit_operational_2y",
    label: "Operational audit evidence",
    description: "Operational audit evidence is retained for two years.",
    mode: "fixed_duration",
    retentionDays: 730,
    action: "delete",
    automatic: true,
    authority: "DROPi Marketplace Blueprint §11.3",
  },
  {
    key: "audit_security_5y",
    label: "Security audit evidence",
    description: "Security audit evidence is retained for five years.",
    mode: "fixed_duration",
    retentionDays: 1825,
    action: "delete",
    automatic: true,
    authority: "DROPi Marketplace Blueprint §11.3",
  },
  {
    key: "audit_financial_10y",
    label: "Financial audit evidence",
    description: "Financial audit evidence is retained for ten years.",
    mode: "fixed_duration",
    retentionDays: 3650,
    action: "delete",
    automatic: true,
    authority: "DROPi Marketplace Blueprint §11.3",
  },
  {
    key: "account_rights_lifecycle",
    label: "Account and service lifecycle",
    description: "Personal account and service data has no invented fixed timer; erasure/anonymization is delegated to the governed data-rights workflow.",
    mode: "account_or_rights_lifecycle",
    retentionDays: null,
    action: "defer_to_rights_workflow",
    automatic: false,
    authority: "DROPi Roadmap 6.2.2 / BATCH-022",
  },
];

export const PRIVACY_PURPOSES: PrivacyPurpose[] = [
  {
    key: "account_authentication",
    version: 1,
    label: "Account authentication and security",
    description: "Create, authenticate and secure the DROPi account and its active sessions.",
    dataCategories: ["identity", "contact", "authentication", "device", "ip_address"],
    lawfulBasis: "contract",
    consentRequired: false,
    retentionPolicyKeys: ["session_expiry", "credential_expiry", "account_rights_lifecycle"],
  },
  {
    key: "delivery_fulfilment",
    version: 1,
    label: "Delivery fulfilment",
    description: "Validate, prepare, assign, execute and reconstruct requested delivery operations.",
    dataCategories: ["identity", "contact", "address", "order", "location", "operational_event"],
    lawfulBasis: "contract",
    consentRequired: false,
    retentionPolicyKeys: ["account_rights_lifecycle", "audit_operational_2y"],
  },
  {
    key: "platform_security_audit",
    version: 1,
    label: "Platform security and accountability",
    description: "Protect platform integrity, investigate access and preserve security accountability.",
    dataCategories: ["identity", "role", "access", "device", "ip_address", "security_event"],
    lawfulBasis: "legitimate_interests",
    consentRequired: false,
    retentionPolicyKeys: ["audit_security_5y"],
  },
  {
    key: "operational_auditability",
    version: 1,
    label: "Operational auditability",
    description: "Preserve factual state changes, access and operational decisions by governed channel.",
    dataCategories: ["identity", "role", "channel", "access", "decision", "operational_event"],
    lawfulBasis: "legitimate_interests",
    consentRequired: false,
    retentionPolicyKeys: ["audit_operational_2y"],
  },
  {
    key: "financial_audit_evidence",
    version: 1,
    label: "Financial audit evidence",
    description: "Preserve financial audit evidence subject to the longer canonical retention window.",
    dataCategories: ["financial_event", "order_reference", "merchant_reference"],
    lawfulBasis: "legal_obligation",
    consentRequired: false,
    retentionPolicyKeys: ["audit_financial_10y"],
  },
];

const PURPOSE_BY_KEY = new Map(PRIVACY_PURPOSES.map((purpose) => [purpose.key, purpose]));
const RETENTION_BY_KEY = new Map(PRIVACY_RETENTION_POLICIES.map((policy) => [policy.key, policy]));

export function getPrivacyPurpose(key: string): PrivacyPurpose | undefined {
  return PURPOSE_BY_KEY.get(key);
}

export function getPrivacyRetentionPolicy(key: string): PrivacyRetentionPolicy | undefined {
  return RETENTION_BY_KEY.get(key);
}

export function isConsentRequiredForPurpose(key: string): boolean {
  return getPrivacyPurpose(key)?.consentRequired === true;
}

export function assertConsentChangeAllowed(key: string, version: number): PrivacyPurpose {
  const purpose = getPrivacyPurpose(key);
  if (!purpose) throw new Error("Unknown privacy purpose");
  if (!purpose.consentRequired || purpose.lawfulBasis !== "consent") {
    throw new Error("This processing purpose is not controlled by consent");
  }
  if (purpose.version !== version) throw new Error("Privacy purpose version is stale");
  return purpose;
}

export type AuditRetentionClass = "operational" | "security" | "financial";

export function classifyAuditRetention(action: string): AuditRetentionClass {
  const normalized = action.trim().toLowerCase();
  if (normalized.startsWith("financial.") || normalized.includes("commission") || normalized.includes("escrow")) {
    return "financial";
  }
  if (
    normalized.startsWith("auth.") ||
    normalized.startsWith("admin.") ||
    normalized.startsWith("security.") ||
    normalized.includes("phantom") ||
    normalized.includes("change_role") ||
    normalized.includes("deactivate_user")
  ) {
    return "security";
  }
  return "operational";
}

export function retentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}
