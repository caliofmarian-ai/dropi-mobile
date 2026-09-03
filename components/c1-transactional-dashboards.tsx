import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { OnboardingNudgeBanner } from "@/components/onboarding-nudge-banner";
import { useDropiAuth } from "@/lib/auth-context";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import type { DeliveryMode } from "@/lib/marketplace-data";
import { trpc } from "@/lib/trpc";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/shared/types";
import type { OrderStatus } from "@/shared/types";

export type C1TransactionalRole = "customer" | "merchant" | "delivery_partner";

const VEHICLE_ICONS: Record<string, string> = {
  drone: "🚁",
  auto: "🚗",
  van: "🚐",
  ebike: "🚲",
};

function DeliveryModeBadge({ mode }: { mode: DeliveryMode }) {
  const info = DELIVERY_MODE_INFO[mode];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: info.color + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 }}>
      <Text style={{ fontSize: 12 }}>{info.icon}</Text>
      <Text style={{ fontSize: 10, color: info.color, fontWeight: "600", marginLeft: 3 }}>{info.label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = ORDER_STATUS_COLORS[status];
  return (
    <View style={{ backgroundColor: color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

function CustomerDashboard() {
  const router = useRouter();
  const ordersQuery = trpc.operations.myOrders.useQuery({ includeCompleted: false });
  const activeOrders = ordersQuery.data?.orders ?? [];
  const onRefresh = useCallback(async () => {
    await ordersQuery.refetch();
  }, [ordersQuery]);

  return (
    <ScreenContainer className="px-4 pt-4">
      <OnboardingNudgeBanner />
      <Text className="text-2xl font-bold text-foreground mb-1">My Deliveries</Text>
      <Text className="text-sm text-muted mb-4">{activeOrders.length} active</Text>
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={ordersQuery.isFetching} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-surface border border-border rounded-2xl p-4 mb-3" activeOpacity={0.7} onPress={() => router.push(`/order/${item.id}`)}>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
                <Text className="text-xs text-muted mt-0.5">{item.orderUid}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm text-muted" numberOfLines={1} style={{ flex: 1 }}>{item.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</Text>
              <Text className="text-sm font-medium text-foreground ml-2">₱{item.totalAmount}</Text>
            </View>
            <View className="flex-row items-center mt-2">
              <DeliveryModeBadge mode={item.deliveryMode} />
              {item.vehicleType && (
                <Text style={{ fontSize: 10, color: "#6B7280" }}>{VEHICLE_ICONS[item.vehicleType]} {item.vehicleId}</Text>
              )}
            </View>
            {item.status === "in_execution" && (
              <TouchableOpacity
                className="mt-3 bg-primary/10 rounded-lg px-3 py-2"
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/pilot/live-tracking", params: { deliveryId: String(item.id), target: "order" } } as any)}
              >
                <Text className="text-primary text-sm font-medium">
                  {VEHICLE_ICONS[item.vehicleType || "drone"]} Live Tracking — ETA {item.estimatedTime} min →
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No active deliveries</Text></View>}
      />
    </ScreenContainer>
  );
}

function MerchantDashboard() {
  const router = useRouter();
  const ordersQuery = trpc.operations.myOrders.useQuery({ includeCompleted: true });
  const allOrders = ordersQuery.data?.orders ?? [];
  const newOrders = allOrders.filter((o) => o.status === "initiated" || o.status === "validated");
  const preparingOrders = allOrders.filter((o) => o.status === "preparing");
  const readyOrders = allOrders.filter((o) => o.status === "ready");
  const onRefresh = useCallback(async () => {
    await ordersQuery.refetch();
  }, [ordersQuery]);
  const sections = [
    { title: "New Orders", data: newOrders, color: "#0066FF" },
    { title: "Preparing", data: preparingOrders, color: "#F59E0B" },
    { title: "Ready for Pickup", data: readyOrders, color: "#10B981" },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <OnboardingNudgeBanner />
      <Text className="text-2xl font-bold text-foreground mb-1">Order Queue</Text>
      <Text className="text-sm text-muted mb-4">{allOrders.length} loaded orders</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={ordersQuery.isFetching} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: section }) => (
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: section.color, marginRight: 8 }} />
              <Text className="text-base font-semibold text-foreground">{section.title}</Text>
              <Text className="text-sm text-muted ml-2">({section.data.length})</Text>
            </View>
            {section.data.map((order) => (
              <TouchableOpacity key={order.id} className="bg-surface border border-border rounded-xl p-4 mb-2" activeOpacity={0.7} onPress={() => router.push(`/merchant-order/${order.id}`)}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{order.orderUid}</Text>
                    <Text className="text-xs text-muted mt-1">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">₱{order.totalAmount}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {section.data.length === 0 && <Text className="text-xs text-muted italic ml-4">No orders</Text>}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

function DeliveryPartnerDashboard() {
  const router = useRouter();
  const { user } = useDropiAuth();
  const marketplaceAvailableQuery = trpc.operations.availableMarketplaceOrders.useQuery();
  const marketplaceAssignedQuery = trpc.operations.myMarketplacePilotOrders.useQuery();
  const transitionMarketplaceOrder = trpc.operations.transitionOrder.useMutation({
    onSuccess: async () => {
      await Promise.all([marketplaceAvailableQuery.refetch(), marketplaceAssignedQuery.refetch()]);
    },
  });
  const marketplaceAvailable = marketplaceAvailableQuery.data?.orders ?? [];
  const marketplaceAssigned = marketplaceAssignedQuery.data?.orders ?? [];
  const onRefresh = useCallback(async () => {
    await Promise.all([marketplaceAvailableQuery.refetch(), marketplaceAssignedQuery.refetch()]);
  }, [marketplaceAvailableQuery, marketplaceAssignedQuery]);
  const isUnverified = user && !(user as any).isVerified;

  return (
    <ScreenContainer className="px-4 pt-4">
      {isUnverified && (
        <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B", borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>⚠️</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E" }}>Verification Required</Text>
          </View>
          <Text style={{ fontSize: 12, color: "#78350F", lineHeight: 18 }}>
            Your account is not yet verified. Please submit your documents from Profile → Documents to start accepting Marketplace missions.
          </Text>
        </View>
      )}
      <OnboardingNudgeBanner />
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-2xl font-bold text-foreground">Mission Radar</Text>
        <TouchableOpacity
          style={{ backgroundColor: "#0066FF15", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}
          onPress={() => router.push("/pilot/leaderboard")}
        >
          <Text style={{ color: "#0066FF", fontSize: 12, fontWeight: "600" }}>🏆 Leaderboard</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-sm text-muted mb-4">{marketplaceAvailable.length} Marketplace missions available</Text>

      <FlatList
        data={marketplaceAvailable}
        keyExtractor={(item) => `market-ready-${item.id}`}
        refreshControl={<RefreshControl refreshing={marketplaceAvailableQuery.isFetching || marketplaceAssignedQuery.isFetching} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {marketplaceAssigned.length > 0 && (
              <View className="mb-4">
                <Text className="text-base font-semibold text-foreground mb-2">My Marketplace Deliveries</Text>
                {marketplaceAssigned.slice(0, 5).map((item) => (
                  <View key={`market-assigned-${item.id}`} className="bg-surface border border-border rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{item.merchantName}</Text>
                        <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
                        <Text className="text-xs text-muted mt-1">{item.status.replace(/_/g, " ").toUpperCase()}</Text>
                      </View>
                      {(item.status === "accepted" || item.status === "in_execution") && (
                        <TouchableOpacity
                          className="bg-primary/10 rounded-lg px-3 py-2"
                          onPress={() => router.push({ pathname: "/pilot/live-tracking", params: { deliveryId: String(item.id), target: "order" } } as any)}
                        >
                          <Text className="text-primary text-xs font-semibold">Live Track</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {item.status === "accepted" && (
                      <TouchableOpacity
                        className="bg-primary rounded-lg py-2 items-center mt-3"
                        disabled={transitionMarketplaceOrder.isPending}
                        onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "in_execution" })}
                      >
                        <Text className="text-white text-sm font-bold">Confirm pickup & start delivery</Text>
                      </TouchableOpacity>
                    )}
                    {(item.status === "in_execution" || item.status === "fallback") && (
                      <TouchableOpacity
                        className="bg-success rounded-lg py-2 items-center mt-3"
                        onPress={() => router.push({ pathname: "/pilot/complete-order", params: { orderId: String(item.id) } } as any)}
                      >
                        <Text className="text-white text-sm font-bold">Record proof & complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
            <Text className="text-base font-semibold text-foreground mb-2">Marketplace — READY</Text>
          </>
        }
        renderItem={({ item }) => (
          <View className="bg-surface border border-border rounded-xl p-3 mb-2">
            <Text className="text-sm font-semibold text-foreground">{item.merchantName}</Text>
            <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
            <Text className="text-xs text-muted mt-1">{item.pickupZone} → {item.deliveryZone}</Text>
            <TouchableOpacity
              className="bg-success rounded-lg py-2 items-center mt-3"
              activeOpacity={0.8}
              disabled={transitionMarketplaceOrder.isPending}
              onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "accepted" })}
            >
              <Text className="text-white text-sm font-bold">Accept Voluntarily</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No Marketplace missions available</Text></View>}
      />
    </ScreenContainer>
  );
}

export function C1TransactionalDashboard({ role }: { role: C1TransactionalRole }) {
  switch (role) {
    case "customer":
      return <CustomerDashboard />;
    case "merchant":
      return <MerchantDashboard />;
    case "delivery_partner":
      return <DeliveryPartnerDashboard />;
  }
}
