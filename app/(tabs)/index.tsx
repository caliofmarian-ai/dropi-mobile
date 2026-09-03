import { C1LiveRoleDashboard } from "@/components/c1-live-dashboards";
import type { C1LiveDashboardRole } from "@/components/c1-live-dashboards";
import LegacyHomeScreen from "@/components/legacy-home-screen";
import { useDropiAuth } from "@/lib/auth-context";

const LIVE_C1_ROLES = new Set<C1LiveDashboardRole>([
  "support_agent",
  "analyst",
  "compliance_officer",
  "fraud_detection",
  "performance_monitor",
  "incident_responder",
]);

function isLiveC1Role(role: string | null | undefined): role is C1LiveDashboardRole {
  return Boolean(role && LIVE_C1_ROLES.has(role as C1LiveDashboardRole));
}

function getDeliveryPartnerVerificationState(user: unknown) {
  const isUnverified = user && !(user as any).isVerified;
  return isUnverified ? "Verification Required" : "Verified";
}

export default function HomeScreen() {
  const { user } = useDropiAuth();

  if (user?.isAuthenticated && isLiveC1Role(user.dropiRole)) {
    return <C1LiveRoleDashboard role={user.dropiRole} />;
  }

  if (user?.dropiRole === "delivery_partner") {
    getDeliveryPartnerVerificationState(user);
  }

  return <LegacyHomeScreen />;
}
