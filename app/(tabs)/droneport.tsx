import { Text, View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

interface DronePortStation {
  id: string;
  name: string;
  zone: string;
  status: "active" | "maintenance" | "offline";
  dronesTotal: number;
  dronesAvailable: number;
  dronesInFlight: number;
  dronesCharging: number;
  batterySlots: number;
  batteryAvailable: number;
  lastInspection: string;
  nextMaintenance: string;
  coordinates: { lat: number; lng: number };
}

const DRONEPORTS: DronePortStation[] = [
  {
    id: "DP-001", name: "Central Hub Manila", zone: "Manila-Central",
    status: "active", dronesTotal: 12, dronesAvailable: 7, dronesInFlight: 3, dronesCharging: 2,
    batterySlots: 24, batteryAvailable: 18, lastInspection: "2024-01-15",
    nextMaintenance: "2024-02-01", coordinates: { lat: 14.5995, lng: 120.9842 },
  },
  {
    id: "DP-002", name: "Makati Station", zone: "Makati-CBD",
    status: "active", dronesTotal: 8, dronesAvailable: 5, dronesInFlight: 2, dronesCharging: 1,
    batterySlots: 16, batteryAvailable: 12, lastInspection: "2024-01-12",
    nextMaintenance: "2024-01-28", coordinates: { lat: 14.5547, lng: 121.0244 },
  },
  {
    id: "DP-003", name: "BGC Tower", zone: "Taguig-BGC",
    status: "maintenance", dronesTotal: 6, dronesAvailable: 0, dronesInFlight: 0, dronesCharging: 6,
    batterySlots: 12, batteryAvailable: 4, lastInspection: "2024-01-10",
    nextMaintenance: "2024-01-20", coordinates: { lat: 14.5506, lng: 121.0494 },
  },
  {
    id: "DP-004", name: "QC North Station", zone: "Quezon-North",
    status: "active", dronesTotal: 10, dronesAvailable: 6, dronesInFlight: 3, dronesCharging: 1,
    batterySlots: 20, batteryAvailable: 15, lastInspection: "2024-01-14",
    nextMaintenance: "2024-01-30", coordinates: { lat: 14.6760, lng: 121.0437 },
  },
  {
    id: "DP-005", name: "Emergency Reserve", zone: "Manila-Port",
    status: "active", dronesTotal: 4, dronesAvailable: 4, dronesInFlight: 0, dronesCharging: 0,
    batterySlots: 8, batteryAvailable: 8, lastInspection: "2024-01-16",
    nextMaintenance: "2024-02-05", coordinates: { lat: 14.5833, lng: 120.9667 },
  },
];

function StatusIndicator({ status }: { status: DronePortStation["status"] }) {
  const colors = { active: "#10B981", maintenance: "#F59E0B", offline: "#EF4444" };
  const labels = { active: "ACTIVE", maintenance: "MAINTENANCE", offline: "OFFLINE" };
  return (
    <View style={{ backgroundColor: colors[status] + "20", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color: colors[status], fontSize: 10, fontWeight: "700" }}>{labels[status]}</Text>
    </View>
  );
}

function DronePortCard({ port }: { port: DronePortStation }) {
  const [expanded, setExpanded] = useState(false);
  const utilizationRate = ((port.dronesInFlight + port.dronesCharging) / port.dronesTotal * 100).toFixed(0);

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{port.name}</Text>
          <Text className="text-xs text-muted mt-0.5">{port.id} • {port.zone}</Text>
        </View>
        <StatusIndicator status={port.status} />
      </View>

      {/* Quick Stats Row */}
      <View className="flex-row mt-3 gap-2">
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-success">{port.dronesAvailable}</Text>
          <Text className="text-[10px] text-muted">Available</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-primary">{port.dronesInFlight}</Text>
          <Text className="text-[10px] text-muted">In Flight</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-warning">{port.dronesCharging}</Text>
          <Text className="text-[10px] text-muted">Charging</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-2 items-center">
          <Text className="text-lg font-bold text-foreground">{port.dronesTotal}</Text>
          <Text className="text-[10px] text-muted">Total</Text>
        </View>
      </View>

      {expanded && (
        <View className="mt-3 pt-3 border-t border-border">
          {/* Battery Status */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-1">Battery Status</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                <View
                  style={{ width: `${(port.batteryAvailable / port.batterySlots) * 100}%`, height: "100%", backgroundColor: "#10B981", borderRadius: 6 }}
                />
              </View>
              <Text className="text-xs text-muted">{port.batteryAvailable}/{port.batterySlots}</Text>
            </View>
          </View>

          {/* Utilization */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Utilization Rate</Text>
            <Text className="text-xs font-medium text-foreground">{utilizationRate}%</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Last Inspection</Text>
            <Text className="text-xs font-medium text-foreground">{port.lastInspection}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Next Maintenance</Text>
            <Text className="text-xs font-medium text-foreground">{port.nextMaintenance}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Coordinates</Text>
            <Text className="text-xs font-medium text-foreground">{port.coordinates.lat.toFixed(4)}, {port.coordinates.lng.toFixed(4)}</Text>
          </View>

          {/* Actions */}
          {port.status === "active" && (
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity className="flex-1 bg-primary/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                <Text className="text-primary text-xs font-semibold">Request Drone</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-warning/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                <Text className="text-warning text-xs font-semibold">Schedule Maint.</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DronePortScreen() {
  const { user } = useDropiAuth();
  const totalDrones = DRONEPORTS.reduce((sum, p) => sum + p.dronesTotal, 0);
  const totalAvailable = DRONEPORTS.reduce((sum, p) => sum + p.dronesAvailable, 0);
  const totalInFlight = DRONEPORTS.reduce((sum, p) => sum + p.dronesInFlight, 0);
  const activeStations = DRONEPORTS.filter((p) => p.status === "active").length;

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">DronePort Network</Text>
      <Text className="text-sm text-muted mb-4">{activeStations} active stations • {totalDrones} drones</Text>

      {/* Summary Cards */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-success/10 border border-success/20 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-success">{totalAvailable}</Text>
          <Text className="text-[10px] text-muted">Available</Text>
        </View>
        <View className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-primary">{totalInFlight}</Text>
          <Text className="text-[10px] text-muted">In Flight</Text>
        </View>
        <View className="flex-1 bg-surface border border-border rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-foreground">{DRONEPORTS.length}</Text>
          <Text className="text-[10px] text-muted">Stations</Text>
        </View>
      </View>

      {/* Station List */}
      <FlatList
        data={DRONEPORTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DronePortCard port={item} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
