#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}: {old[:140]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# ---------------------------------------------------------------------------
# Merchant order detail: replace local-only status simulation with server state.
# ---------------------------------------------------------------------------
replace_once(
    "app/merchant-order/[id].tsx",
    'import { useEffect, useState } from "react";\n',
    "",
)
replace_once(
    "app/merchant-order/[id].tsx",
    '''  const order = orderQuery.data;
  const [currentStatus, setCurrentStatus] = useState(order?.status || "validated");

  useEffect(() => {
    if (order?.status) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);
''',
    '''  const order = orderQuery.data;
  const transitionOrder = trpc.operations.transitionOrder.useMutation({
    onSuccess: async () => {
      await orderQuery.refetch();
    },
  });
''',
)
replace_once(
    "app/merchant-order/[id].tsx",
    '''  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode];

  const handleStartPreparing = () => {
    setCurrentStatus("preparing");
    Alert.alert("Status Updated", "Order is now in preparation.");
  };

  const handleMarkReady = () => {
    setCurrentStatus("ready");
    Alert.alert("Package Ready", "Order marked as ready for pickup. A pilot/driver will be assigned.");
  };
''',
    '''  const currentStatus = order.status;
  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode];

  const handleValidateOrder = async () => {
    try {
      await transitionOrder.mutateAsync({ orderId, newStatus: "validated" });
      Alert.alert("Order Validated", "The order is validated and can enter preparation.");
    } catch (error: any) {
      Alert.alert("Transition blocked", error?.message || "Order validation failed.");
    }
  };

  const handleStartPreparing = async () => {
    try {
      await transitionOrder.mutateAsync({ orderId, newStatus: "preparing" });
      Alert.alert("Status Updated", "Order is now in preparation.");
    } catch (error: any) {
      Alert.alert("Transition blocked", error?.message || "Preparation could not start.");
    }
  };

  const handleMarkReady = async () => {
    try {
      await transitionOrder.mutateAsync({ orderId, newStatus: "ready" });
      Alert.alert("Package Ready", "Order is READY. Eligible verified delivery partners may now accept it voluntarily.");
    } catch (error: any) {
      Alert.alert("Transition blocked", error?.message || "Order could not be marked READY.");
    }
  };
''',
)
replace_once(
    "app/merchant-order/[id].tsx",
    '''        <View className="mx-4 gap-3">
          {currentStatus === "validated" && (
''',
    '''        <View className="mx-4 gap-3">
          {currentStatus === "initiated" && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              activeOpacity={0.8}
              disabled={transitionOrder.isPending}
              onPress={handleValidateOrder}
            >
              <Text className="text-white font-bold text-base">Validate Order</Text>
            </TouchableOpacity>
          )}

          {currentStatus === "validated" && (
''',
)
replace_once(
    "app/merchant-order/[id].tsx",
    '''              activeOpacity={0.8}
              onPress={handleStartPreparing}
''',
    '''              activeOpacity={0.8}
              disabled={transitionOrder.isPending}
              onPress={handleStartPreparing}
''',
)
replace_once(
    "app/merchant-order/[id].tsx",
    '''              activeOpacity={0.8}
              onPress={handleMarkReady}
''',
    '''              activeOpacity={0.8}
              disabled={transitionOrder.isPending}
              onPress={handleMarkReady}
''',
)

# ---------------------------------------------------------------------------
# Customer order detail: auditable history + canonical pre-accept cancellation.
# ---------------------------------------------------------------------------
replace_once(
    "app/order/[id].tsx",
    'import { Text, View, ScrollView, TouchableOpacity } from "react-native";',
    'import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";',
)
replace_once(
    "app/order/[id].tsx",
    '''  const orderQuery = trpc.operations.myOrderById.useQuery(
    { id: orderId },
    { enabled: Number.isFinite(orderId) },
  );
  const order = orderQuery.data;
''',
    '''  const orderQuery = trpc.operations.myOrderById.useQuery(
    { id: orderId },
    { enabled: Number.isFinite(orderId) },
  );
  const timelineQuery = trpc.operations.myOrderTimeline.useQuery(
    { orderId },
    { enabled: Number.isFinite(orderId) },
  );
  const transitionOrder = trpc.operations.transitionOrder.useMutation({
    onSuccess: async () => {
      await Promise.all([orderQuery.refetch(), timelineQuery.refetch()]);
    },
  });
  const order = orderQuery.data;
''',
)
replace_once(
    "app/order/[id].tsx",
    '''  const currentStep = getStepIndex(order.status);
  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode as keyof typeof DELIVERY_MODE_INFO];
  const fallbackInfo = order.fallbackMode ? DELIVERY_MODE_INFO[order.fallbackMode as keyof typeof DELIVERY_MODE_INFO] : null;

  return (
''',
    '''  const currentStep = getStepIndex(order.status);
  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode as keyof typeof DELIVERY_MODE_INFO];
  const fallbackInfo = order.fallbackMode ? DELIVERY_MODE_INFO[order.fallbackMode as keyof typeof DELIVERY_MODE_INFO] : null;
  const canCancel = ["initiated", "validated", "preparing", "ready"].includes(order.status);
  const auditEvents = timelineQuery.data?.events ?? [];

  const handleCancel = () => {
    Alert.alert(
      "Cancel Order",
      "Cancel this order before a delivery partner accepts it?",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              await transitionOrder.mutateAsync({
                orderId,
                newStatus: "cancelled",
                reason: "Cancelled by customer before pilot acceptance",
              });
            } catch (error: any) {
              Alert.alert("Cancellation blocked", error?.message || "Order could not be cancelled.");
            }
          },
        },
      ],
    );
  };

  return (
''',
)
replace_once(
    "app/order/[id].tsx",
    '''        {/* Items */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
''',
    '''        {/* Verified audit history */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Verified History</Text>
          {auditEvents.length === 0 ? (
            <Text className="text-xs text-muted">No audit events recorded yet.</Text>
          ) : (
            auditEvents.slice(0, 12).map((event) => (
              <View key={event.id} className="py-2 border-b border-border">
                <Text className="text-sm text-foreground">{event.action.replace(/\./g, " ")}</Text>
                <Text className="text-xs text-muted">
                  {event.actorRole} • {new Date(event.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Items */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
''',
)
replace_once(
    "app/order/[id].tsx",
    '''        {/* Canonical Info */}
        <View className="mx-4 mb-4">
''',
    '''        {canCancel && (
          <View className="mx-4 mb-4">
            <TouchableOpacity
              className="border border-error rounded-xl py-3 items-center"
              activeOpacity={0.8}
              disabled={transitionOrder.isPending}
              onPress={handleCancel}
            >
              <Text className="text-error font-semibold">Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Canonical Info */}
        <View className="mx-4 mb-4">
''',
)

# ---------------------------------------------------------------------------
# Merchant dashboard: initiated orders must be visible before validation.
# ---------------------------------------------------------------------------
replace_once(
    "app/(tabs)/index.tsx",
    '  const newOrders = allOrders.filter((o) => o.status === "validated");',
    '  const newOrders = allOrders.filter((o) => o.status === "initiated" || o.status === "validated");',
)

# ---------------------------------------------------------------------------
# Pilot dashboard: preserve B2B missions and add voluntary Marketplace flow.
# ---------------------------------------------------------------------------
replace_once(
    "app/(tabs)/index.tsx",
    '''  const missionsQuery = trpc.operations.myPilotMissions.useQuery();
  const availableMissions = (missionsQuery.data?.missions ?? []).filter((m) => m.status === "available");
  const onRefresh = useCallback(async () => {
    await missionsQuery.refetch();
  }, [missionsQuery]);
''',
    '''  const missionsQuery = trpc.operations.myPilotMissions.useQuery();
  const marketplaceAvailableQuery = trpc.operations.availableMarketplaceOrders.useQuery();
  const marketplaceAssignedQuery = trpc.operations.myMarketplacePilotOrders.useQuery();
  const transitionMarketplaceOrder = trpc.operations.transitionOrder.useMutation({
    onSuccess: async () => {
      await Promise.all([marketplaceAvailableQuery.refetch(), marketplaceAssignedQuery.refetch()]);
    },
  });
  const availableMissions = (missionsQuery.data?.missions ?? []).filter((m) => m.status === "available");
  const marketplaceAvailable = marketplaceAvailableQuery.data?.orders ?? [];
  const marketplaceAssigned = marketplaceAssignedQuery.data?.orders ?? [];
  const onRefresh = useCallback(async () => {
    await Promise.all([
      missionsQuery.refetch(),
      marketplaceAvailableQuery.refetch(),
      marketplaceAssignedQuery.refetch(),
    ]);
  }, [missionsQuery, marketplaceAvailableQuery, marketplaceAssignedQuery]);
''',
)
replace_once(
    "app/(tabs)/index.tsx",
    '''      <Text className="text-sm text-muted mb-4">{availableMissions.length} missions available in your area</Text>
      <FlatList
''',
    '''      <Text className="text-sm text-muted mb-4">
        {availableMissions.length + marketplaceAvailable.length} missions available in your area
      </Text>

      {marketplaceAvailable.length > 0 && (
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Marketplace — READY</Text>
          {marketplaceAvailable.slice(0, 5).map((item) => (
            <View key={`market-ready-${item.id}`} className="bg-surface border border-border rounded-xl p-3 mb-2">
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
          ))}
        </View>
      )}

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
                    onPress={() => router.push({ pathname: '/pilot/live-tracking', params: { deliveryId: String(item.id), target: 'order' } } as any)}
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
                  <Text className="text-white text-sm font-bold">Start Delivery</Text>
                </TouchableOpacity>
              )}
              {(item.status === "in_execution" || item.status === "fallback") && (
                <TouchableOpacity
                  className="bg-success rounded-lg py-2 items-center mt-3"
                  disabled={transitionMarketplaceOrder.isPending}
                  onPress={() => transitionMarketplaceOrder.mutate({ orderId: item.id, newStatus: "completed" })}
                >
                  <Text className="text-white text-sm font-bold">Complete Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      <Text className="text-base font-semibold text-foreground mb-2">B2B Missions</Text>
      <FlatList
''',
)

print("Canonical Marketplace order UI wiring applied.")
