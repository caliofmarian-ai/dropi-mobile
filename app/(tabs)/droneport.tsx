import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

type StationType = "droneport" | "vehicle_depot" | "transfer_hub";
type StationStatus = "active" | "maintenance" | "offline";

interface LogisticsStation {
  id: string;
  name: string;
  type: StationType;
  zone: string;
  status: StationStatus;
  // Drone-specific
  dronesTotal?: number;
  dronesAvailable?: number;
  dronesInFlight?: number;
  dronesCharging?: number;
  batterySlots?: number;
  batteryAvailable?: number;
  // Terrestrial-specific
  vehiclesTotal?: number;
  vehiclesAvailable?: number;
  vehiclesInTransit?: number;
  vehicleTypes?: { auto: number; van: number; ebike: number };
  // Transfer hub specific
  transferCapacity?: number;
  activeTransfers?: number;
  // Common
  lastInspection: string;
  nextMaintenance: string;
  coordinates: { lat: number; lng: number };
}

const STATIONS: LogisticsStation[] = [
  {
    id: "DP-001", name: "Central Hub Manila", type: "droneport", zone: "Manila-Central",
    status: "active", dronesTotal: 12, dronesAvailable: 7, dronesInFlight: 3, dronesCharging: 2,
    batterySlots: 24, batteryAvailable: 18, lastInspection: "2026-06-15",
    nextMaintenance: "2026-07-01", coordinates: { lat: 14.5995, lng: 120.9842 },
  },
  {
    id: "DP-002", name: "Makati DronePort", type: "droneport", zone: "Makati-CBD",
    status: "active", dronesTotal: 8, dronesAvailable: 5, dronesInFlight: 2, dronesCharging: 1,
    batterySlots: 16, batteryAvailable: 12, lastInspection: "2026-06-12",
    nextMaintenance: "2026-06-28", coordinates: { lat: 14.5547, lng: 121.0244 },
  },
  {
    id: "VD-001", name: "Quezon Vehicle Depot", type: "vehicle_depot", zone: "Quezon-North",
    status: "active", vehiclesTotal: 18, vehiclesAvailable: 12, vehiclesInTransit: 6,
    vehicleTypes: { auto: 8, van: 4, ebike: 6 }, lastInspection: "2026-06-14",
    nextMaintenance: "2026-06-30", coordinates: { lat: 14.6760, lng: 121.0437 },
  },
  {
    id: "VD-002", name: "Pasig Fleet Center", type: "vehicle_depot", zone: "Pasig-Ortigas",
    status: "active", vehiclesTotal: 14, vehiclesAvailable: 9, vehiclesInTransit: 5,
    vehicleTypes: { auto: 6, van: 3, ebike: 5 }, lastInspection: "2026-06-13",
    nextMaintenance: "2026-06-29", coordinates: { lat: 14.5764, lng: 121.0851 },
  },
  {
    id: "TH-001", name: "BGC Transfer Hub", type: "transfer_hub", zone: "Taguig-BGC",
    status: "active", transferCapacity: 50, activeTransfers: 12,
    dronesTotal: 4, dronesAvailable: 3, dronesInFlight: 1, dronesCharging: 0,
    vehiclesTotal: 6, vehiclesAvailable: 4, vehiclesInTransit: 2,
    vehicleTypes: { auto: 2, van: 2, ebike: 2 },
    lastInspection: "2026-06-16", nextMaintenance: "2026-07-02",
    coordinates: { lat: 14.5506, lng: 121.0494 },
  },
  {
    id: "TH-002", name: "Manila Port Transfer", type: "transfer_hub", zone: "Manila-Port",
    status: "maintenance", transferCapacity: 30, activeTransfers: 0,
    dronesTotal: 3, dronesAvailable: 0, dronesInFlight: 0, dronesCharging: 3,
    vehiclesTotal: 4, vehiclesAvailable: 2, vehiclesInTransit: 0,
    vehicleTypes: { auto: 2, van: 1, ebike: 1 },
    lastInspection: "2026-06-10", nextMaintenance: "2026-06-20",
    coordinates: { lat: 14.5833, lng: 120.9667 },
  },
];

const TYPE_INFO: Record<StationType, { icon: string; label: string; color: string }> = {
  droneport: { icon: "🚁", label: "DronePort", color: "#0066FF" },
  vehicle_depot: { icon: "🚗", label: "Vehicle Depot", color: "#10B981" },
  transfer_hub: { icon: "🔄", label: "Transfer Hub", color: "#6366F1" },
};

function StatusIndicator({ status }: { status: StationStatus }) {
  const colors = { active: "#10B981", maintenance: "#F59E0B", offline: "#EF4444" };
  const labels = { active: "ACTIV", maintenance: "MENTENANȚĂ", offline: "OFFLINE" };
  return (
    <View style={{ backgroundColor: colors[status] + "20", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color: colors[status], fontSize: 10, fontWeight: "700" }}>{labels[status]}</Text>
    </View>
  );
}

function StationCard({ station }: { station: LogisticsStation }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const typeInfo = TYPE_INFO[station.type];

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>{typeInfo.icon}</Text>
            <Text className="text-base font-semibold text-foreground">{station.name}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View style={{ backgroundColor: typeInfo.color + "15", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
              <Text style={{ color: typeInfo.color, fontSize: 9, fontWeight: "700" }}>{typeInfo.label}</Text>
            </View>
            <Text className="text-xs text-muted">{station.id} • {station.zone}</Text>
          </View>
        </View>
        <StatusIndicator status={station.status} />
      </View>

      {/* Quick Stats Row */}
      <View className="flex-row mt-3 gap-2">
        {station.type === "droneport" && (
          <>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-success">{station.dronesAvailable}</Text>
              <Text className="text-[10px] text-muted">Disponibile</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-primary">{station.dronesInFlight}</Text>
              <Text className="text-[10px] text-muted">În Zbor</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-warning">{station.dronesCharging}</Text>
              <Text className="text-[10px] text-muted">Încărcare</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-foreground">{station.dronesTotal}</Text>
              <Text className="text-[10px] text-muted">Total</Text>
            </View>
          </>
        )}
        {station.type === "vehicle_depot" && (
          <>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-success">{station.vehiclesAvailable}</Text>
              <Text className="text-[10px] text-muted">Disponibile</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-primary">{station.vehiclesInTransit}</Text>
              <Text className="text-[10px] text-muted">În Tranzit</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-foreground">{station.vehiclesTotal}</Text>
              <Text className="text-[10px] text-muted">Total</Text>
            </View>
          </>
        )}
        {station.type === "transfer_hub" && (
          <>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-primary">{station.activeTransfers}</Text>
              <Text className="text-[10px] text-muted">Transferuri</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-success">{station.dronesAvailable || 0}</Text>
              <Text className="text-[10px] text-muted">Drone</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-success">{station.vehiclesAvailable || 0}</Text>
              <Text className="text-[10px] text-muted">Vehicule</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-2 items-center">
              <Text className="text-lg font-bold text-foreground">{station.transferCapacity}</Text>
              <Text className="text-[10px] text-muted">Capacitate</Text>
            </View>
          </>
        )}
      </View>

      {expanded && (
        <View className="mt-3 pt-3 border-t border-border">
          {/* Vehicle breakdown for depots and hubs */}
          {station.vehicleTypes && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-foreground mb-2">Flotă Vehicule</Text>
              <View className="flex-row gap-3">
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 14 }}>🚗</Text>
                  <Text className="text-xs text-muted ml-1">Auto: {station.vehicleTypes.auto}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 14 }}>🚐</Text>
                  <Text className="text-xs text-muted ml-1">Van: {station.vehicleTypes.van}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 14 }}>🚲</Text>
                  <Text className="text-xs text-muted ml-1">E-Bike: {station.vehicleTypes.ebike}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Battery status for droneports */}
          {station.batterySlots && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-foreground mb-1">Baterii Drone</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                  <View
                    style={{ width: `${(station.batteryAvailable! / station.batterySlots) * 100}%`, height: "100%", backgroundColor: "#10B981", borderRadius: 6 }}
                  />
                </View>
                <Text className="text-xs text-muted">{station.batteryAvailable}/{station.batterySlots}</Text>
              </View>
            </View>
          )}

          {/* Maintenance info */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Ultima Inspecție</Text>
            <Text className="text-xs font-medium text-foreground">{station.lastInspection}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">Următoarea Mentenanță</Text>
            <Text className="text-xs font-medium text-foreground">{station.nextMaintenance}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Coordonate</Text>
            <Text className="text-xs font-medium text-foreground">{station.coordinates.lat.toFixed(4)}, {station.coordinates.lng.toFixed(4)}</Text>
          </View>

          {/* Actions */}
          {station.status === "active" && (
            <View className="flex-row gap-2 mt-3">
              {station.type === "droneport" && (
                <TouchableOpacity className="flex-1 bg-primary/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                  <Text className="text-primary text-xs font-semibold">Solicită Dronă</Text>
                </TouchableOpacity>
              )}
              {station.type === "vehicle_depot" && (
                <TouchableOpacity className="flex-1 bg-primary/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                  <Text className="text-primary text-xs font-semibold">Solicită Vehicul</Text>
                </TouchableOpacity>
              )}
              {station.type === "transfer_hub" && (
                <TouchableOpacity className="flex-1 bg-primary/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                  <Text className="text-primary text-xs font-semibold">Inițiază Transfer</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity className="flex-1 bg-warning/10 rounded-lg py-2 items-center" activeOpacity={0.7}>
                <Text className="text-warning text-xs font-semibold">Programează Maint.</Text>
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
  const [filter, setFilter] = useState<"all" | StationType>("all");

  const filteredStations = filter === "all" ? STATIONS : STATIONS.filter((s) => s.type === filter);
  const totalDrones = STATIONS.reduce((sum, s) => sum + (s.dronesTotal || 0), 0);
  const totalVehicles = STATIONS.reduce((sum, s) => sum + (s.vehiclesTotal || 0), 0);
  const activeStations = STATIONS.filter((s) => s.status === "active").length;

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Rețea Logistică</Text>
      <Text className="text-sm text-muted mb-4">{activeStations} stații active • {totalDrones} drone • {totalVehicles} vehicule</Text>

      {/* Summary Cards */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-primary">{totalDrones}</Text>
          <Text className="text-[10px] text-muted">Drone</Text>
        </View>
        <View className="flex-1 bg-success/10 border border-success/20 rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-success">{totalVehicles}</Text>
          <Text className="text-[10px] text-muted">Vehicule</Text>
        </View>
        <View className="flex-1 bg-surface border border-border rounded-xl p-3 items-center">
          <Text className="text-xl font-bold text-foreground">{STATIONS.length}</Text>
          <Text className="text-[10px] text-muted">Stații</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        {([["all", "Toate"], ["droneport", "🚁 Drone"], ["vehicle_depot", "🚗 Vehicule"], ["transfer_hub", "🔄 Transfer"]] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: filter === key ? "#0066FF" : "transparent", borderWidth: 1, borderColor: filter === key ? "#0066FF" : "#E5E7EB" }}
            activeOpacity={0.7}
            onPress={() => setFilter(key)}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: filter === key ? "#FFFFFF" : "#687076" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Station List */}
      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StationCard station={item} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
