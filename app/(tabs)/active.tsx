import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "18", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export default function ActiveMissionScreen() {
  const router = useRouter();
  const colors = useColors();
  const marketplaceQuery = trpc.operations.myMarketplacePilotOrders.useQuery();
  const b2bQuery = trpc.operations.myPilotMissions.useQuery();

  const marketplaceDeliveries = marketplaceQuery.data?.orders ?? [];
  const b2bMissions = (b2bQuery.data?.missions ?? []).filter((mission) => mission.status !== "available");
  const hasActiveWork = marketplaceDeliveries.length > 0 || b2bMissions.length > 0;
  const isRefreshing = marketplaceQuery.isFetching || b2bQuery.isFetching;

  const refresh = async () => {
    await Promise.all([marketplaceQuery.refetch(), b2bQuery.refetch()]);
  };

  if (marketplaceQuery.isLoading || b2bQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm text-muted mt-3">Loading assigned deliveries…</Text>
      </ScreenContainer>
    );
  }

  if (marketplaceQuery.error && b2bQuery.error) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text className="text-lg font-semibold text-foreground mb-2">Active deliveries unavailable</Text>
        <Text className="text-sm text-muted text-center mb-5">
          DROPi could not load your assigned Marketplace orders or B2B missions.
        </Text>
        <TouchableOpacity className="bg-primary rounded-xl px-6 py-3" onPress={() => void refresh()}>
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />}
      >
        <Text className="text-2xl font-bold text-foreground mb-1">Active Deliveries</Text>
        <Text className="text-sm text-muted mb-5">
          {marketplaceDeliveries.length + b2bMissions.length} assigned delivery item{marketplaceDeliveries.length + b2bMissions.length === 1 ? "" : "s"}
        </Text>

        {!hasActiveWork && (
          <View className="items-center justify-center py-14 px-6 bg-surface border border-border rounded-2xl">
            <View className="w-16 h-16 rounded-full bg-background border border-border items-center justify-center mb-4">
              <Text className="text-2xl">📦</Text>
            </View>
            <Text className="text-lg font-semibold text-foreground mb-1">No Active Delivery</Text>
            <Text className="text-sm text-muted text-center">
              Accept a Marketplace delivery or an assigned B2B mission to see it here.
            </Text>
          </View>
        )}

        {marketplaceDeliveries.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-2">C1 Marketplace</Text>
            {marketplaceDeliveries.map((item) => {
              const statusLabel = item.status.replace(/_/g, " ").toUpperCase();
              const statusColor = item.status === "in_execution" ? colors.primary : item.status === "fallback" ? colors.warning : colors.success;
              return (
                <View key={`market-${item.id}`} className="bg-surface border border-border rounded-2xl p-4 mb-3">
                  <View className="flex-row justify-between items-start gap-3">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-primary mb-1">C1 MARKETPLACE</Text>
                      <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
                      <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
                    </View>
                    <StatusPill label={statusLabel} color={statusColor} />
                  </View>

                  <View className="mt-3 bg-background rounded-xl p-3">
                    <Text className="text-xs text-muted">Pickup</Text>
                    <Text className="text-sm text-foreground mt-0.5">{item.pickupZone || "Unavailable"}</Text>
                    <Text className="text-xs text-muted mt-2">Destination</Text>
                    <Text className="text-sm text-foreground mt-0.5">{item.deliveryZone || "Unavailable"}</Text>
                  </View>

                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="flex-1 bg-primary/10 border border-primary/30 rounded-xl py-3 items-center"
                      activeOpacity={0.7}
                      onPress={() => router.push(`/order/${item.id}` as any)}
                    >
                      <Text className="text-primary text-sm font-semibold">Open order</Text>
                    </TouchableOpacity>
                    {item.status === "in_execution" && (
                      <TouchableOpacity
                        className="flex-1 bg-success/10 border border-success/30 rounded-xl py-3 items-center"
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: "/pilot/live-tracking", params: { deliveryId: String(item.id), target: "order" } } as any)}
                      >
                        <Text className="text-success text-sm font-semibold">Live tracking</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="text-[10px] text-muted mt-3">
                    Transport mode is shown only on governed order/tracking surfaces when authoritative evidence exists.
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {b2bMissions.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-foreground mb-2">B2B Logistics</Text>
            {b2bMissions.map((mission) => {
              const statusLabel = mission.status.replace(/_/g, " ").toUpperCase();
              const statusColor = mission.status === "in_progress" ? colors.primary : colors.success;
              return (
                <TouchableOpacity
                  key={`b2b-${mission.id}`}
                  className="bg-surface border border-border rounded-2xl p-4 mb-3"
                  activeOpacity={0.7}
                  onPress={() => router.push(`/mission/${mission.id}` as any)}
                >
                  <View className="flex-row justify-between items-start gap-3">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-primary mb-1">B2B LOGISTICS</Text>
                      <Text className="text-base font-semibold text-foreground">{mission.merchantName}</Text>
                    </View>
                    <StatusPill label={statusLabel} color={statusColor} />
                  </View>

                  <View className="mt-3 bg-background rounded-xl p-3">
                    <Text className="text-xs text-muted">Pickup</Text>
                    <Text className="text-sm text-foreground mt-0.5">{mission.pickupZone || "Unavailable"}</Text>
                    <Text className="text-xs text-muted mt-2">Destination</Text>
                    <Text className="text-sm text-foreground mt-0.5">{mission.deliveryZone || "Unavailable"}</Text>
                  </View>

                  <View className="flex-row justify-between mt-3">
                    <Text className="text-xs text-muted">Package</Text>
                    <Text className="text-xs text-foreground font-medium">{mission.packageWeight} kg</Text>
                  </View>
                  <Text className="text-primary text-sm font-semibold mt-3">Open mission →</Text>
                  <Text className="text-[10px] text-muted mt-2">
                    Vehicle-specific checks and controls are resolved inside the governed mission flow.
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
