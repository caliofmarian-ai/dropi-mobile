/**
 * Admin Monitoring Panel — Sprint 6B+
 *
 * Displays real-time system stats including:
 * - WebSocket connections (tracking + notifications)
 * - Server uptime and health
 * - Active users and sessions
 * - Push notification delivery stats
 */
import { useCallback, useEffect, useState } from "react";
import { Text, View, ScrollView, Pressable, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AdminMonitoringScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch } = trpc.notifications.getSystemStats.useQuery(undefined, {
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          >
            <Text className="text-2xl text-primary">←</Text>
          </Pressable>
          <View>
            <Text className="text-2xl font-bold text-foreground">System Monitoring</Text>
            <Text className="text-sm text-muted">Real-time platform stats</Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">Server Status</Text>
            <View className="flex-row items-center gap-2">
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stats ? colors.success : colors.error }} />
              <Text style={{ color: stats ? colors.success : colors.error }} className="font-semibold">
                {stats ? "Online" : "Checking..."}
              </Text>
            </View>
          </View>
        </View>

        {/* WebSocket Stats */}
        <Text className="text-lg font-bold text-foreground mb-3">WebSocket Connections</Text>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-3xl font-bold text-primary">{stats?.wsNotifications?.connectedUsers ?? "—"}</Text>
            <Text className="text-xs text-muted mt-1">Connected Users</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-3xl font-bold text-primary">{stats?.wsNotifications?.totalConnections ?? "—"}</Text>
            <Text className="text-xs text-muted mt-1">Total Connections</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-3xl font-bold" style={{ color: colors.success }}>{stats?.wsTracking?.activeDeliveries ?? "—"}</Text>
            <Text className="text-xs text-muted mt-1">Active Deliveries</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-3xl font-bold" style={{ color: colors.success }}>{stats?.wsTracking?.activePilots ?? "—"}</Text>
            <Text className="text-xs text-muted mt-1">Active Pilots</Text>
          </View>
        </View>

        {/* Push Notification Stats */}
        <Text className="text-lg font-bold text-foreground mb-3">Push Notifications</Text>
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">Registered Tokens</Text>
            <Text className="text-sm font-semibold text-foreground">{stats?.push?.registeredTokens ?? "—"}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">FCM Status</Text>
            <Text className="text-sm font-semibold" style={{ color: stats?.push?.fcmConfigured ? colors.success : colors.warning }}>
              {stats?.push?.fcmConfigured ? "Configured" : "Not Configured"}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Active Devices</Text>
            <Text className="text-sm font-semibold text-foreground">{stats?.push?.activeDevices ?? "—"}</Text>
          </View>
        </View>

        {/* In-App Notifications Stats */}
        <Text className="text-lg font-bold text-foreground mb-3">In-App Notifications</Text>
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">Total Sent (24h)</Text>
            <Text className="text-sm font-semibold text-foreground">{stats?.inApp?.last24h ?? "—"}</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">Unread (all users)</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.warning }}>{stats?.inApp?.totalUnread ?? "—"}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Total Notifications</Text>
            <Text className="text-sm font-semibold text-foreground">{stats?.inApp?.total ?? "—"}</Text>
          </View>
        </View>

        {/* Auto-refresh indicator */}
        <View className="items-center mt-4">
          <Text className="text-xs text-muted">Auto-refreshes every 10 seconds</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
