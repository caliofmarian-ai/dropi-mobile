import { Text, View, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { CLIENT_ORDERS, MERCHANT_ORDERS, PILOT_MISSIONS } from "@/lib/mock-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";
import type { OrderStatus } from "@/shared/types";

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = ORDER_STATUS_COLORS[status];
  return (
    <View style={{ backgroundColor: color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

function ClientDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const activeOrders = CLIENT_ORDERS.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">My Deliveries</Text>
      <Text className="text-sm text-muted mb-4">{activeOrders.length} active</Text>
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-surface border border-border rounded-2xl p-4 mb-3"
            activeOpacity={0.7}
            onPress={() => router.push(`/order/${item.id}`)}
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
                <Text className="text-xs text-muted mt-0.5">{item.orderUid}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm text-muted">
                {item.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
              </Text>
              <Text className="text-sm font-medium text-foreground">₱{item.totalAmount}</Text>
            </View>
            {item.status === "in_execution" && (
              <View className="mt-3 bg-primary/10 rounded-lg px-3 py-2 flex-row items-center">
                <Text className="text-primary text-sm font-medium">Live Tracking — ETA {item.estimatedTime} min</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted text-base">No active deliveries</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function MerchantDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const newOrders = MERCHANT_ORDERS.filter((o) => o.status === "validated");
  const preparingOrders = MERCHANT_ORDERS.filter((o) => o.status === "preparing");
  const readyOrders = MERCHANT_ORDERS.filter((o) => o.status === "ready");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const sections = [
    { title: "New Orders", data: newOrders, color: "#0066FF" },
    { title: "Preparing", data: preparingOrders, color: "#F59E0B" },
    { title: "Ready for Pickup", data: readyOrders, color: "#10B981" },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Order Queue</Text>
      <Text className="text-sm text-muted mb-4">{MERCHANT_ORDERS.length} orders today</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: section }) => (
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: section.color, marginRight: 8 }} />
              <Text className="text-base font-semibold text-foreground">{section.title}</Text>
              <Text className="text-sm text-muted ml-2">({section.data.length})</Text>
            </View>
            {section.data.map((order) => (
              <TouchableOpacity
                key={order.id}
                className="bg-surface border border-border rounded-xl p-4 mb-2"
                activeOpacity={0.7}
                onPress={() => router.push(`/merchant-order/${order.id}`)}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{order.orderUid}</Text>
                    <Text className="text-xs text-muted mt-1">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">₱{order.totalAmount}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {section.data.length === 0 && (
              <Text className="text-xs text-muted italic ml-4">No orders</Text>
            )}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

function PilotDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const availableMissions = PILOT_MISSIONS.filter((m) => m.status === "available");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Mission Radar</Text>
      <Text className="text-sm text-muted mb-4">{availableMissions.length} available in your zone</Text>
      <FlatList
        data={availableMissions}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-surface border border-border rounded-2xl p-4 mb-3"
            activeOpacity={0.7}
            onPress={() => router.push(`/mission/${item.id}`)}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
              <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
                <Text className="text-primary text-xs font-semibold">{item.estimatedTime} min</Text>
              </View>
            </View>
            <View className="gap-1.5 mt-1">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-success mr-2" />
                <Text className="text-sm text-muted">Pickup: {item.pickupZone}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-error mr-2" />
                <Text className="text-sm text-muted">Delivery: {item.deliveryZone}</Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted">{item.packageWeight} kg</Text>
              <Text className="text-xs text-muted">{item.distance} km</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted text-base">No missions available</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function OperatorDashboard() {
  const activeDrones = 5;
  const alertCount = 2;

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Zone Control</Text>
      <Text className="text-sm text-muted mb-4">Manila-Central</Text>

      {/* Stats Grid */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-surface border border-border rounded-xl p-4">
          <Text className="text-2xl font-bold text-success">{activeDrones}</Text>
          <Text className="text-xs text-muted mt-1">Active Drones</Text>
        </View>
        <View className="flex-1 bg-surface border border-border rounded-xl p-4">
          <Text className="text-2xl font-bold text-warning">{alertCount}</Text>
          <Text className="text-xs text-muted mt-1">Alerts</Text>
        </View>
        <View className="flex-1 bg-surface border border-border rounded-xl p-4">
          <Text className="text-2xl font-bold text-primary">3</Text>
          <Text className="text-xs text-muted mt-1">DronePort</Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View className="bg-surface border border-border rounded-2xl h-48 items-center justify-center mb-4">
        <Text className="text-muted text-sm">Zone Map View</Text>
        <Text className="text-xs text-muted mt-1">Real-time fleet positions</Text>
      </View>

      {/* Recent Alerts */}
      <Text className="text-base font-semibold text-foreground mb-2">Recent Alerts</Text>
      <View className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-2">
        <Text className="text-sm font-medium text-foreground">Wind Speed Alert — Sector 3</Text>
        <Text className="text-xs text-muted mt-0.5">15 km/h gusts detected. Monitor flights.</Text>
      </View>
      <View className="bg-error/10 border border-error/30 rounded-xl p-3 mb-2">
        <Text className="text-sm font-medium text-foreground">Drone DRN-012 — Low Battery</Text>
        <Text className="text-xs text-muted mt-0.5">Returning to DronePort Alpha. 8% remaining.</Text>
      </View>

      {/* Ground All Button */}
      <TouchableOpacity
        className="bg-error rounded-xl py-4 items-center mt-4"
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-base">⛔ GROUND ALL — Suspend Zone</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
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

  switch (user.dropiRole) {
    case "client":
      return <ClientDashboard />;
    case "merchant":
      return <MerchantDashboard />;
    case "pilot":
      return <PilotDashboard />;
    case "operator":
      return <OperatorDashboard />;
    default:
      return <ClientDashboard />;
  }
}
