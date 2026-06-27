import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useDropiAuth();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  const role = user?.dropiRole || "client";

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
      {/* Home - visible to all roles */}
      <Tabs.Screen
        name="index"
        options={{
          title: role === "client" ? "Deliveries" : role === "merchant" ? "Queue" : role === "pilot" ? "Missions" : "Zone",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name={role === "pilot" ? "airplane" : role === "operator" ? "map.fill" : "house.fill"}
              color={color}
            />
          ),
        }}
      />

      {/* History - visible to client and merchant */}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          href: role === "client" || role === "merchant" ? "/history" : null,
        }}
      />

      {/* Active Mission - visible to pilot only */}
      <Tabs.Screen
        name="active"
        options={{
          title: "Active",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bolt.fill" color={color} />,
          href: role === "pilot" ? "/active" : null,
        }}
      />

      {/* Alerts - visible to operator only */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
          href: role === "operator" ? "/alerts" : null,
        }}
      />

      {/* Fleet - visible to operator only */}
      <Tabs.Screen
        name="fleet"
        options={{
          title: "Fleet",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bus.fill" color={color} />,
          href: role === "operator" ? "/fleet" : null,
        }}
      />

      {/* Profile - visible to all */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
