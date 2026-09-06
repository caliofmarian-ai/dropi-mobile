export const DELIVERY_PARTNER_ROLE = "delivery_partner";

export const OPERATIONAL_PILOT_DOCUMENT_TYPES = [
  "driving_license",
  "drone_license",
] as const;

export type OperationalPilotDocumentType = typeof OPERATIONAL_PILOT_DOCUMENT_TYPES[number];

export type OperationalVerificationRecord = {
  status?: string | null;
  documentType?: string | null;
  expiryDate?: Date | string | null;
};

/**
 * Delivery partners must never become operationally verified by omission.
 * Verification is granted only by the governed verification flow after the
 * required evidence has been reviewed.
 */
export function resolveUserVerificationForCreate(
  dropiRole: string,
  requestedVerification?: boolean,
): boolean {
  if (dropiRole === DELIVERY_PARTNER_ROLE) return false;
  return requestedVerification ?? true;
}

/**
 * Moving an existing account into the delivery-partner role invalidates any
 * verification state inherited from a different role. Moving away from the
 * role does not silently grant verification.
 */
export function verificationPatchForRoleChange(
  dropiRole: string,
): { isVerified: false } | Record<string, never> {
  return dropiRole === DELIVERY_PARTNER_ROLE ? { isVerified: false } : {};
}

export function isOperationalPilotDocumentType(
  documentType: string | null | undefined,
): documentType is OperationalPilotDocumentType {
  return OPERATIONAL_PILOT_DOCUMENT_TYPES.includes(documentType as OperationalPilotDocumentType);
}

/**
 * Operational pilot authority requires reviewed license evidence that is still
 * valid at the instant authorization is evaluated. Non-license documents may
 * be approved for compliance purposes but never grant mission authority.
 */
export function isCurrentOperationalPilotVerification(
  record: OperationalVerificationRecord,
  now: Date = new Date(),
): boolean {
  if (record.status !== "approved") return false;
  if (!isOperationalPilotDocumentType(record.documentType)) return false;
  if (record.expiryDate == null) return true;

  const expiry = record.expiryDate instanceof Date
    ? record.expiryDate
    : new Date(record.expiryDate);

  return Number.isFinite(expiry.getTime()) && expiry.getTime() > now.getTime();
}

export function hasCurrentOperationalPilotVerification(
  records: OperationalVerificationRecord[],
  now: Date = new Date(),
): boolean {
  return records.some((record) => isCurrentOperationalPilotVerification(record, now));
}
