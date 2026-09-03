import { AdminGovernedDashboard } from "@/components/admin-governed-dashboards";
import type { GovernedAdminRole } from "@/components/admin-governed-dashboards";
import { C1LiveRoleDashboard } from "@/components/c1-live-dashboards";
import type { C1LiveDashboardRole } from "@/components/c1-live-dashboards";
import { C2C3GovernedDashboard } from "@/components/c2-c3-governed-dashboards";
import type { GovernedUnavailableRole } from "@/components/c2-c3-governed-dashboards";
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

const GOVERNED_UNAVAILABLE_ROLES = new Set<GovernedUnavailableRole>([
  "logistics_coordinator",
  "fleet_manager",
  "c2_compliance_officer",
  "c2_performance_monitor",
  "c2_incident_responder",
  "data_analyst",
  "quality_assurance",
  "emergency_coordinator",
  "dispatch_manager",
  "resource_allocator",
  "communication_officer",
  "c3_data_analyst",
  "incident_commander",
]);

const GOVERNED_ADMIN_ROLES = new Set<GovernedAdminRole>([
  "system_administrator",
  "security_officer",
  "audit_manager",
  "configuration_manager",
  "analytics_manager",
  "support_coordinator",
]);

function isLiveC1Role(role: string | null | undefined): role is C1LiveDashboardRole {
  return Boolean(role && LIVE_C1_ROLES.has(role as C1LiveDashboardRole));
}

function isGovernedUnavailableRole(role: string | null | undefined): role is GovernedUnavailableRole {
  return Boolean(role && GOVERNED_UNAVAILABLE_ROLES.has(role as GovernedUnavailableRole));
}

function isGovernedAdminRole(role: string | null | undefined): role is GovernedAdminRole {
  return Boolean(role && GOVERNED_ADMIN_ROLES.has(role as GovernedAdminRole));
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

  if (user?.isAuthenticated && isGovernedUnavailableRole(user.dropiRole)) {
    return <C2C3GovernedDashboard role={user.dropiRole} />;
  }

  if (user?.isAuthenticated && isGovernedAdminRole(user.dropiRole)) {
    return <AdminGovernedDashboard role={user.dropiRole} />;
  }

  if (user?.dropiRole === "delivery_partner") {
    getDeliveryPartnerVerificationState(user);
  }

  return <LegacyHomeScreen />;
}
