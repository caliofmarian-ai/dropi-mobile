/**
 * Merchant Orders Screen — Sprint E++
 *
 * Real-time B2B delivery list with status filters, tracking codes,
 * expandable detail with delivery timeline, pilot info, and webhook status.
 */
import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

type DeliveryStatus = "pending" | "assigned" | "pickup_enroute" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "failed";

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "Pending", color: "#F59E0B", icon: "⏳" },
  assigned: { label: "Assigned", color: "#3B82F6", icon: "👤" },
  pickup_enroute: { label: "En Route to Pickup", color: "#8B5CF6", icon: "🚗" },
  picked_up: { label: "Picked Up", color: "#6366F1", icon: "📦" },
  in_transit: { label: "In Transit", color: "#0a7ea4", icon: "🚁" },
  delivered: { label: "Delivered", color: "#22C55E", icon: "✓" },
  cancelled: { label: "Cancelled", color: "#6B7280", icon: "✗" },
  failed: { label: "Failed", color: "#EF4444", icon: "⚠" },
};

const FILTER_OPTIONS: { value: DeliveryStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

export default function MerchantOrdersScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const deliveriesQuery = trpc.b2bDelivery.list.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter },
    { refetchInterval: 15000 } // Auto-refresh every 15s
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await deliveriesQuery.refetch();
    setRefreshing(false);
  }, []);

  const deliveries = deliveriesQuery.data?.deliveries || [];
  const total = deliveriesQuery.data?.total || 0;

  // Stats
  const activeCount = deliveries.filter((d) => ["assigned", "pickup_enroute", "picked_up", "in_transit"].includes(d.status)).length;
  const completedCount = deliveries.filter((d) => d.status === "delivered").length;
  const failedCount = deliveries.filter((d) => ["cancelled", "failed"].includes(d.status)).length;

  const renderDeliveryItem = ({ item }: { item: typeof deliveries[0] }) => {
    const config = STATUS_CONFIG[item.status as DeliveryStatus];
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        style={{ marginBottom: 8 }}
      >
        <View className="bg-surface border border-border rounded-xl p-4">
          {/* Header Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text style={{ fontSize: 18, marginRight: 8 }}>{config.icon}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {item.trackingCode}
                </Text>
                <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                  Order: {item.externalOrderId || "N/A"}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: config.color + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: config.color, fontSize: 10, fontWeight: "700" }}>{config.label}</Text>
            </View>
          </View>

          {/* Addresses */}
          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E", marginRight: 8 }} />
              <Text className="text-xs text-muted flex-1" numberOfLines={1}>{item.pickupAddress}</Text>
            </View>
            <View className="flex-row items-center">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", marginRight: 8 }} />
              <Text className="text-xs text-muted flex-1" numberOfLines={1}>{item.deliveryAddress}</Text>
            </View>
          </View>

          {/* Bottom Row */}
          <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-border/50">
            <Text className="text-xs text-muted">
              {item.deliveryMode === "drone" ? "🚁 Drone" : item.deliveryMode === "terrestrial" ? "🚗 Terrestrial" : "📦 " + (item.deliveryMode || "Auto")}
            </Text>
            <Text className="text-xs text-muted">
              {item.quotedPrice ? `${item.quotedPrice} ${item.currency || "RON"}` : "—"}
            </Text>
            <Text className="text-xs text-muted">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Expanded Detail */}
          {isExpanded && (
            <View className="mt-3 pt-3 border-t border-border">
              {/* Delivery Timeline */}
              <Text className="text-xs font-semibold text-foreground mb-2">Delivery Timeline</Text>
              <View className="gap-1.5 mb-3">
                {getTimeline(item).map((step, i) => (
                  <View key={i} className="flex-row items-center">
                    <View style={{
                      width: 16, height: 16, borderRadius: 8,
                      backgroundColor: step.completed ? config.color + "30" : "#E5E7EB",
                      alignItems: "center", justifyContent: "center", marginRight: 8,
                    }}>
                      {step.completed && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: config.color }} />}
                    </View>
                    <Text className={`text-xs ${step.completed ? "text-foreground" : "text-muted"}`}>{step.label}</Text>
                    {step.time && <Text className="text-xs text-muted ml-auto">{step.time}</Text>}
                  </View>
                ))}
              </View>

              {/* Price Info */}
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-muted">Quoted Price</Text>
                <Text className="text-xs font-medium text-foreground">{item.quotedPrice || "—"} {item.currency || "RON"}</Text>
              </View>
              {item.finalPrice && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-muted">Final Price</Text>
                  <Text className="text-xs font-medium text-foreground">{item.finalPrice} {item.currency || "RON"}</Text>
                </View>
              )}

              {/* Timestamps */}
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Created</Text>
                <Text className="text-xs text-foreground">{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-muted">Last Updated</Text>
                <Text className="text-xs text-foreground">{new Date(item.updatedAt).toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12, padding: 4 }}>
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground flex-1">B2B Orders</Text>
          <Text className="text-xs text-muted">{total} total</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row px-4 gap-2 mb-3">
          <View className="flex-1 bg-primary/10 rounded-xl p-3 items-center">
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0a7ea4" }}>{activeCount}</Text>
            <Text className="text-xs text-muted">Active</Text>
          </View>
          <View className="flex-1 bg-success/10 rounded-xl p-3 items-center">
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#22C55E" }}>{completedCount}</Text>
            <Text className="text-xs text-muted">Completed</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3 items-center">
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#EF4444" }}>{failedCount}</Text>
            <Text className="text-xs text-muted">Failed</Text>
          </View>
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" contentContainerStyle={{ gap: 6 }}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setStatusFilter(opt.value)}
              style={{
                backgroundColor: statusFilter === opt.value ? "#0a7ea4" : "transparent",
                borderWidth: 1,
                borderColor: statusFilter === opt.value ? "#0a7ea4" : "#E5E7EB",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: statusFilter === opt.value ? "#fff" : "#687076", fontSize: 12, fontWeight: "600" }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Delivery List */}
        {deliveriesQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-muted text-sm mt-2">Loading orders...</Text>
          </View>
        ) : deliveries.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text className="text-lg font-semibold text-foreground mb-1">No Orders Yet</Text>
            <Text className="text-sm text-muted text-center">
              {statusFilter === "all"
                ? "B2B delivery orders will appear here once your external system sends requests via the Logistic API."
                : `No orders with status "${statusFilter}" found.`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

/** Generate timeline steps based on delivery status */
function getTimeline(delivery: { status: string; createdAt: string; updatedAt: string }) {
  const statusOrder: DeliveryStatus[] = ["pending", "assigned", "pickup_enroute", "picked_up", "in_transit", "delivered"];
  const currentIndex = statusOrder.indexOf(delivery.status as DeliveryStatus);
  const isFailed = delivery.status === "failed" || delivery.status === "cancelled";

  const steps = [
    { label: "Order Received", completed: true, time: new Date(delivery.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    { label: "Pilot Assigned", completed: currentIndex >= 1 || isFailed },
    { label: "En Route to Pickup", completed: currentIndex >= 2 },
    { label: "Package Picked Up", completed: currentIndex >= 3 },
    { label: "In Transit", completed: currentIndex >= 4 },
    { label: "Delivered", completed: currentIndex >= 5 },
  ];

  if (isFailed) {
    steps.push({ label: delivery.status === "cancelled" ? "Cancelled" : "Failed", completed: true, time: new Date(delivery.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  }

  return steps;
}
