import { Text, View, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

interface DroneStatus {
  id: string;
  name: string;
  status: "active" | "returning" | "charging" | "maintenance";
  battery: number;
  pilot: string;
  currentMission: string | null;
}

const MOCK_FLEET: DroneStatus[] = [
  { id: "1", name: "DRN-007", status: "active", battery: 74, pilot: "Carlos R.", currentMission: "DEL-2026-001" },
  { id: "2", name: "DRN-012", status: "returning", battery: 8, pilot: "Miguel T.", currentMission: null },
  { id: "3", name: "DRN-015", status: "active", battery: 91, pilot: "Ana P.", currentMission: "DEL-2026-003" },
  { id: "4", name: "DRN-019", status: "charging", battery: 45, pilot: "—", currentMission: null },
  { id: "5", name: "DRN-022", status: "active", battery: 62, pilot: "Jose M.", currentMission: "DEL-2026-005" },
  { id: "6", name: "DRN-025", status: "maintenance", battery: 100, pilot: "—", currentMission: null },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "#10B981" },
  returning: { label: "Returning", color: "#F59E0B" },
  charging: { label: "Charging", color: "#0066FF" },
  maintenance: { label: "Maintenance", color: "#6B7280" },
};

export default function FleetScreen() {
  const activeCount = MOCK_FLEET.filter((d) => d.status === "active").length;

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Fleet Status</Text>
      <Text className="text-sm text-muted mb-4">{activeCount}/{MOCK_FLEET.length} drones active</Text>
      <FlatList
        data={MOCK_FLEET}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status];
          const batteryColor = item.battery > 50 ? "#10B981" : item.battery > 20 ? "#F59E0B" : "#EF4444";
          return (
            <View className="bg-surface border border-border rounded-xl p-4 mb-2">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-base font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">Pilot: {item.pilot}</Text>
                </View>
                <View style={{ backgroundColor: config.color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: config.color, fontSize: 11, fontWeight: "600" }}>{config.label}</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <View className="flex-row items-center">
                  <View style={{ width: 32, height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ width: `${item.battery}%`, height: "100%", backgroundColor: batteryColor, borderRadius: 3 }} />
                  </View>
                  <Text className="text-xs text-muted ml-2">{item.battery}%</Text>
                </View>
                {item.currentMission && (
                  <Text className="text-xs text-primary">{item.currentMission}</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}
