export const DELIVERY_PARTNER_ROLE = "delivery_partner";

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
