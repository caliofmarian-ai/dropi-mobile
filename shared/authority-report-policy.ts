export const AUTHORITY_REPORT_TARGETS = ["CAAP", "EASA", "FAA"] as const;
export type AuthorityReportTarget = (typeof AUTHORITY_REPORT_TARGETS)[number];

export interface AuthorityReportTemplateDescriptor {
  target: AuthorityReportTarget;
  adaptationContext: string;
  canonicalPurpose: string;
}

export const AUTHORITY_REPORT_TEMPLATES: AuthorityReportTemplateDescriptor[] = [
  {
    target: "CAAP",
    adaptationContext: "Philippines / Zone 0 operational evidence adaptation",
    canonicalPurpose: "Support a CAAP-facing evidence package using verified DROPi operational, safety and audit records.",
  },
  {
    target: "EASA",
    adaptationContext: "European UAS operational evidence adaptation",
    canonicalPurpose: "Support an EASA-facing evidence package using verified DROPi operational, safety and audit records.",
  },
  {
    target: "FAA",
    adaptationContext: "United States UAS operational evidence adaptation",
    canonicalPurpose: "Support an FAA-facing evidence package using verified DROPi operational, safety and audit records.",
  },
];

export const AUTHORITY_REPORT_DISCLAIMER =
  "This is a DROPi internal evidence pack template. It is not an official CAAP, EASA, FAA or other authority filing form and must be reviewed/adapted against the authority's current submission requirements before external use.";

export function authorityTemplate(target: AuthorityReportTarget): AuthorityReportTemplateDescriptor {
  const template = AUTHORITY_REPORT_TEMPLATES.find((item) => item.target === target);
  if (!template) throw new Error("Unsupported authority report target");
  return template;
}

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
