import { Redirect } from "expo-router";
import { Text } from "react-native";
import { AdminGovernedDashboard } from "@/components/admin-governed-dashboards";
import type { GovernedAdminRole } from "@/components/admin-governed-dashboards";
import { C1LiveRoleDashboard } from "@/components/c1-live-dashboards";
import type { C1LiveDashboardRole } from "@/components/c1-live-dashboards";
import { C1TransactionalDashboard } from "@/components/c1-transactional-dashboards";
import type { C1TransactionalRole } from "@/components/c1-transactional-dashboards";
import { C2C3GovernedDashboard } from "@/components/c2-c3-governed-dashboards";
import type { GovernedUnavailableRole } from "@/components/c2-c3-governed-dashboards";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

const TRANSACTIONAL_C1_ROLES = new Set<C1TransactionalRole>([
  "customer",
  "merchant",
  "delivery_partner",
]);

const LIVE_C1_ROLES = new Set<C1LiveDashboardRole>([
  "support_agent",
  "analyst",
  "compliance_officer",
  "fraud_detection",
  "performance_monitor",
  "incident_responder",
]);

const GOVERNED_UNAVAILABLE_ROLES = new Set<GovernedUnavailableRole>([
  "operations_manager",
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

function isTransactionalC1Role(role: string | null | undefined): role is C1TransactionalRole {
  return Boolean(role && TRANSACTIONAL_C1_ROLES.has(role as C1TransactionalRole));
}

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
  const { user, loading } = useDropiAuth();

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!user?.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (isTransactionalC1Role(user.dropiRole)) {
    if (user.dropiRole === "delivery_partner") {
      getDeliveryPartnerVerificationState(user);
    }
    return <C1TransactionalDashboard role={user.dropiRole} />;
  }

  if (isLiveC1Role(user.dropiRole)) {
    return <C1LiveRoleDashboard role={user.dropiRole} />;
  }

  if (isGovernedUnavailableRole(user.dropiRole)) {
    return <C2C3GovernedDashboard role={user.dropiRole} />;
  }

  if (isGovernedAdminRole(user.dropiRole)) {
    return <AdminGovernedDashboard role={user.dropiRole} />;
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground">Dashboard unavailable</Text>
      <Text className="text-sm text-muted mt-2">No governed dashboard contract exists for this account role.</Text>
    </ScreenContainer>
  );
}
