import { Text, View, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";
import type { OrderStatus } from "@/shared/types";
import { trpc } from "@/lib/trpc";

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = ORDER_STATUS_COLORS[status];
  return (
    <View style={{ backgroundColor: color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useDropiAuth();
  const role = user?.dropiRole;
  const ordersQuery = trpc.operations.myOrders.useQuery(
    { includeCompleted: true },
    { enabled: role === "customer" || role === "merchant" },
  );
  const missionsHistoryQuery = trpc.operations.myPilotMissionHistory.useQuery(undefined, {
    enabled: role === "delivery_partner",
  });

  // Delivery partner sees completed missions
  if (role === "delivery_partner") {
    const completedMissions = missionsHistoryQuery.data?.missions ?? [];
    return (
      <ScreenContainer className="px-4 pt-4">
        <Text className="text-2xl font-bold text-foreground mb-1">Mission History</Text>
        <Text className="text-sm text-muted mb-4">Completed deliveries</Text>
        <FlatList
          data={completedMissions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View className="bg-surface border border-border rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-base font-medium text-foreground">{item.merchantName}</Text>
                <View style={{ backgroundColor: "#10B98120", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "600" }}>Completed</Text>
                </View>
              </View>
              <Text className="text-xs text-muted">{item.pickupZone} → {item.deliveryZone}</Text>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-xs text-muted">{item.distance} km • {item.time}</Text>
                <Text className="text-xs text-muted">{new Date(item.date).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No completed missions</Text></View>}
        />
      </ScreenContainer>
    );
  }

  // Merchant and Customer see order history
  const orders = (ordersQuery.data?.orders ?? []).filter((o) => o.status === "completed" || o.status === "cancelled");

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">History</Text>
      <Text className="text-sm text-muted mb-4">Past orders and deliveries</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="bg-surface border border-border rounded-xl p-4 mb-3">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">{item.merchantName}</Text>
                <Text className="text-xs text-muted mt-0.5">{item.orderUid}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-xs text-muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Text className="text-sm font-medium text-foreground">₱{item.totalAmount}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No history yet</Text></View>}
      />
    </ScreenContainer>
  );
}
