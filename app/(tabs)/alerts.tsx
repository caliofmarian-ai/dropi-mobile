import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  time: string;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "1",
    title: "Wind Speed Alert — Sector 3",
    description: "15 km/h gusts detected. Monitor active flights in this sector.",
    severity: "warning",
    time: "2 min ago",
  },
  {
    id: "2",
    title: "Drone DRN-012 — Low Battery",
    description: "Battery at 8%. Auto-returning to DronePort Alpha.",
    severity: "critical",
    time: "5 min ago",
  },
  {
    id: "3",
    title: "Delivery DEL-2026-015 Complete",
    description: "Successfully delivered to 78 Mabini Ave. No incidents.",
    severity: "info",
    time: "12 min ago",
  },
  {
    id: "4",
    title: "New Pilot Online — Carlos R.",
    description: "Pilot checked in for Manila-Central zone. 3 pilots active.",
    severity: "info",
    time: "18 min ago",
  },
  {
    id: "5",
    title: "DronePort Beta — Capacity Warning",
    description: "4/5 slots occupied. Consider redirecting incoming drones.",
    severity: "warning",
    time: "25 min ago",
  },
];

const SEVERITY_STYLES = {
  info: { bg: "bg-primary/10", border: "border-primary/20", dot: "#0066FF" },
  warning: { bg: "bg-warning/10", border: "border-warning/20", dot: "#F59E0B" },
  critical: { bg: "bg-error/10", border: "border-error/20", dot: "#EF4444" },
};

export default function AlertsScreen() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Alerts</Text>
      <Text className="text-sm text-muted mb-4">Real-time zone notifications</Text>
      <FlatList
        data={MOCK_ALERTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const styles = SEVERITY_STYLES[item.severity];
          return (
            <TouchableOpacity
              className={`${styles.bg} border ${styles.border} rounded-xl p-4 mb-2`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: styles.dot, marginTop: 5, marginRight: 10 }} />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{item.title}</Text>
                  <Text className="text-xs text-muted mt-1">{item.description}</Text>
                  <Text className="text-xs text-muted mt-1.5">{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}
