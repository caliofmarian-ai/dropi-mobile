import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBadgeTab } from "@/components/notification-badge-tab";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import type { Channel, DropiRole } from "@/shared/types";

function getHomeTitle(role: DropiRole, channel: Channel): string {
  if (role === "customer") return "Ordersle Mele";
  if (role === "merchant") return "Magazin";
  if (role === "delivery_partner") return "Missions";
  switch (channel) {
    case "C1": return "Dashboard";
    case "C2": return "Operations";
    case "C3": return "Emergency";
    case "ADMIN": return "Admin";
    default: return "Home";
  }
}

function getHomeIcon(role: DropiRole): string {
  if (role === "delivery_partner") return "airplane";
  if (role === "fleet_manager") return "bus.fill";
  if (role === "emergency_coordinator" || role === "incident_commander") return "bolt.fill";
  if (role === "security_officer") return "shield.fill";
  return "house.fill";
}

// Roles that should see the Marketplace (Shop) tab
const MARKETPLACE_ROLES: DropiRole[] = ["customer"];

// Roles that should see the History tab
const HISTORY_ROLES: DropiRole[] = ["customer", "merchant", "delivery_partner"];

// Roles that should see the Active tab (pilot-like roles)
const ACTIVE_ROLES: DropiRole[] = ["delivery_partner"];

// Roles that should see the Alerts tab
const ALERTS_ROLES: DropiRole[] = [
  "compliance_officer", "fraud_detection", "incident_responder",
  "c2_compliance_officer", "c2_incident_responder",
  "emergency_coordinator", "dispatch_manager", "incident_commander", "communication_officer",
  "security_officer", "audit_manager",
];

// Roles that should see the Fleet tab
const FLEET_ROLES: DropiRole[] = [
  "fleet_manager", "operations_manager", "logistics_coordinator",
  "resource_allocator",
];

// Roles that should see the DronePort tab
const DRONEPORT_ROLES: DropiRole[] = [
  "fleet_manager", "operations_manager", "logistics_coordinator",
  "delivery_partner", "resource_allocator",
  "system_administrator", "configuration_manager",
];

// Roles that should see the Authorities tab
const AUTHORITIES_ROLES: DropiRole[] = [
  "compliance_officer", "c2_compliance_officer",
  "operations_manager", "system_administrator",
  "security_officer", "audit_manager",
];

// Roles that should see the Accounting tab
const ACCOUNTING_ROLES: DropiRole[] = [
  "operations_manager", "system_administrator",
  "analytics_manager", "support_coordinator",
  "merchant",
];

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useDropiAuth();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  const role: DropiRole = (user?.dropiRole as DropiRole) || "customer";
  const channel: Channel = (user?.channel as Channel) || "C1";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* Home Dashboard - visible to all roles */}
      <Tabs.Screen
        name="index"
        options={{
          title: getHomeTitle(role, channel),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name={getHomeIcon(role) as any} color={color} />
          ),
        }}
      />

      {/* Marketplace (Shop) - visible to customer */}
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          href: MARKETPLACE_ROLES.includes(role) ? "/marketplace" : null,
        }}
      />

      {/* History - visible to customer, merchant, delivery_partner */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Istoric",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          href: HISTORY_ROLES.includes(role) ? "/history" : null,
        }}
      />

      {/* Active Mission - visible to delivery_partner */}
      <Tabs.Screen
        name="active"
        options={{
          title: "Activ",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bolt.fill" color={color} />,
          href: ACTIVE_ROLES.includes(role) ? "/active" : null,
        }}
      />

      {/* Alerts - visible to compliance, fraud, incident, security, audit roles */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerte",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
          href: ALERTS_ROLES.includes(role) ? "/alerts" : null,
        }}
      />

      {/* Fleet - visible to fleet, ops, logistics, resource roles */}
      <Tabs.Screen
        name="fleet"
        options={{
          title: "Fleet",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bus.fill" color={color} />,
          href: FLEET_ROLES.includes(role) ? "/fleet" : null,
        }}
      />

      {/* DronePort - visible to fleet, ops, pilot, resource, admin roles */}
      <Tabs.Screen
        name="droneport"
        options={{
          title: "DronePort",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.fill" color={color} />,
          href: DRONEPORT_ROLES.includes(role) ? "/droneport" : null,
        }}
      />

      {/* Authorities - visible to compliance, ops, admin roles */}
      <Tabs.Screen
        name="authorities"
        options={{
          title: "Regulatoriu",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shield.fill" color={color} />,
          href: AUTHORITIES_ROLES.includes(role) ? "/authorities" : null,
        }}
      />

      {/* Accounting - visible to ops, admin, analytics, merchant roles */}
      <Tabs.Screen
        name="accounting"
        options={{
          title: "Finance",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
          href: ACCOUNTING_ROLES.includes(role) ? "/accounting" : null,
        }}
      />

      {/* Notifications - visible to all authenticated users */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificări",
          tabBarIcon: ({ color }) => <NotificationBadgeTab color={color} size={24} />,
        }}
      />

      {/* Profile - visible to all */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
