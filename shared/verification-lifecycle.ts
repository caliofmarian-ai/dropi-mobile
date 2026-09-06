export const VERIFICATION_EXPIRY_WARNING_DAYS = 30;

export type VerificationDecisionStatus = "pending" | "approved" | "rejected";
export type VerificationLifecycleState =
  | "not_submitted"
  | "pending"
  | "approved"
  | "expiring"
  | "expired"
  | "rejected";

export type VerificationLifecycleInput = {
  status: VerificationDecisionStatus;
  expiryDate?: string | Date | null;
};

export type VerificationLifecycleView = {
  state: VerificationLifecycleState;
  label: string;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function deriveVerificationLifecycle(
  verification: VerificationLifecycleInput | null | undefined,
  now: Date = new Date(),
): VerificationLifecycleView {
  if (!verification) {
    return {
      state: "not_submitted",
      label: "Not submitted",
      expiryDate: null,
      daysUntilExpiry: null,
    };
  }

  if (verification.status === "pending") {
    return {
      state: "pending",
      label: "Pending review",
      expiryDate: verification.expiryDate ? new Date(verification.expiryDate) : null,
      daysUntilExpiry: null,
    };
  }

  if (verification.status === "rejected") {
    return {
      state: "rejected",
      label: "Rejected",
      expiryDate: verification.expiryDate ? new Date(verification.expiryDate) : null,
      daysUntilExpiry: null,
    };
  }

  const expiryDate = verification.expiryDate ? new Date(verification.expiryDate) : null;
  if (!expiryDate || Number.isNaN(expiryDate.getTime())) {
    return {
      state: "approved",
      label: "Approved",
      expiryDate: null,
      daysUntilExpiry: null,
    };
  }

  const daysUntilExpiry = Math.ceil((startOfUtcDay(expiryDate) - startOfUtcDay(now)) / DAY_MS);
  if (daysUntilExpiry < 0) {
    return {
      state: "expired",
      label: "Expired",
      expiryDate,
      daysUntilExpiry,
    };
  }
  if (daysUntilExpiry <= VERIFICATION_EXPIRY_WARNING_DAYS) {
    return {
      state: "expiring",
      label: `Approved · expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`,
      expiryDate,
      daysUntilExpiry,
    };
  }

  return {
    state: "approved",
    label: "Approved",
    expiryDate,
    daysUntilExpiry,
  };
}

export function latestVerificationByDocumentType<T extends { documentType: string; createdAt: string | Date }>(
  records: readonly T[],
): Map<string, T> {
  const result = new Map<string, T>();
  const sorted = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const record of sorted) {
    if (!result.has(record.documentType)) result.set(record.documentType, record);
  }
  return result;
}
