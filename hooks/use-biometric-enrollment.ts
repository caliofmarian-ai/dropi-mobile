import { useCallback, useMemo } from "react";

export const BIOMETRIC_OWNER_DECISION_ISSUE = 278;

export type BiometricEnrollmentCode =
  | "OWNER_DECISION_PENDING"
  | "NATIVE_CAPABILITY_NOT_INSTALLED";

export interface BiometricEnrollmentState {
  available: false;
  enrolled: false;
  canEnroll: false;
  code: BiometricEnrollmentCode;
  message: string;
}

/**
 * IMPL-008 biometric landing zone.
 *
 * This build intentionally does not import expo-local-authentication. OWNER-001
 * (#278) is still unresolved, so enabling device biometrics would make a product
 * and threat-model decision that the repository has not authorized yet.
 *
 * Consumers get a stable enrollment hook and an explicit fail-closed state. A
 * later native-runtime change can replace this implementation without changing
 * the UI contract or silently enabling biometric sign-in.
 */
export function useBiometricEnrollment() {
  const state = useMemo<BiometricEnrollmentState>(
    () => ({
      available: false,
      enrolled: false,
      canEnroll: false,
      code: "OWNER_DECISION_PENDING",
      message:
        "Face ID / fingerprint sign-in is not enabled in this build. The owner decision and native capability are still pending.",
    }),
    [],
  );

  const requestEnrollment = useCallback(async (): Promise<BiometricEnrollmentState> => state, [state]);

  return {
    ...state,
    requestEnrollment,
  };
}
