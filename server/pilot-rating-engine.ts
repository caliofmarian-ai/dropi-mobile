export * from "./pilot-rating-engine-core";

import {
  getAutoSelectedPilot as getAutoSelectedPilotCore,
  getEligiblePilotsForCOS as getEligiblePilotsForCOSCore,
  validateManualAssignment as validateManualAssignmentCore,
  type PilotCandidate,
} from "./pilot-rating-engine-core";
import {
  isOperationalPilotVerified,
  refreshOperationalPilotVerificationFlags,
} from "./pilot-operational-verification";

/**
 * Selection entry points are wrapped with the authoritative license-evidence
 * refresh. Rating/proximity/rotation remain owned by pilot-rating-engine-core;
 * this module adds the trust boundary that the historical engine lacked.
 */
export async function getAutoSelectedPilot(
  pickupLat: number,
  pickupLng: number,
  requiredVehicleType?: string,
  zone?: string,
): Promise<PilotCandidate | null> {
  try {
    const refresh = await refreshOperationalPilotVerificationFlags();
    if (!refresh.refreshed) return null;

    const candidate = await getAutoSelectedPilotCore(
      pickupLat,
      pickupLng,
      requiredVehicleType,
      zone,
    );

    if (!candidate || !refresh.verifiedUserIds.has(candidate.userId)) return null;
    return candidate;
  } catch (error) {
    console.error("[PILOT_SELECTION] Operational verification refresh failed", error);
    return null;
  }
}

export async function getEligiblePilotsForCOS(
  pickupLat?: number,
  pickupLng?: number,
  vehicleTypeFilter?: string,
  zoneFilter?: string,
): Promise<PilotCandidate[]> {
  try {
    const refresh = await refreshOperationalPilotVerificationFlags();
    if (!refresh.refreshed) return [];

    const candidates = await getEligiblePilotsForCOSCore(
      pickupLat,
      pickupLng,
      vehicleTypeFilter,
      zoneFilter,
    );

    return candidates.filter((candidate) => refresh.verifiedUserIds.has(candidate.userId));
  } catch (error) {
    console.error("[PILOT_SELECTION] COS verification refresh failed", error);
    return [];
  }
}

export async function validateManualAssignment(pilotUserId: number): Promise<string | null> {
  try {
    if (!await isOperationalPilotVerified(pilotUserId)) {
      return "Pilot does not have an approved, unexpired driving or drone license";
    }
  } catch (error) {
    console.error("[PILOT_SELECTION] Manual assignment verification failed", error);
    return "Pilot operational verification could not be confirmed";
  }

  return validateManualAssignmentCore(pilotUserId);
}
