/**
 * Admin Marketplace Overview Panel
 * Shows: pending moderation count, trust alerts, store stats, flagged products,
 * recent marketplace activity, and quick actions for admin roles.
 */

import { useState } from "react";
import { Text, View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface MarketplaceStats {
  pendingModeration: number;
  pendingStores: number;
  flaggedProducts: number;
  activeStores: number;
  totalProducts: number;
  trustAlerts: number;
  avgTrustScore: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  type: "product_submitted" | "store_created" | "product_flagged" | "trust_warning" | "badge_assigned";
  description: string;
  time: string;
  severity: "info" | "warning" | "critical";
}

export default function MarketplaceOverviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch marketplace stats from multiple endpoints
  const pendingProducts = trpc.product.listActive.useQuery({ limit: 1 });
  const storeList = trpc.store.adminList.useQuery({});

  // Compute stats from available data
  const stores = storeList.data?.stores || [];
  const activeStores = stores.filter((s: any) => s.status === "active").length;
  const pendingStores = stores.filter((s: any) => s.status === "pending").length;
  const suspendedStores = stores.filter((s: any) => s.status === "suspended").length;
  const avgTrust = stores.length > 0
    ? Math.round(stores.reduce((sum: number, s: any) => sum + (s.trustScore || 0), 0) / stores.length)
    : 0;
  const lowTrustStores = stores.filter((s: any) => (s.trustScore || 0) < 40).length;

  const isLoading = storeList.isLoading;

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([storeList.refetch()]).finally(() => setRefreshing(false));
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading marketplace data...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Marketplace</Text>
            <Text className="text-sm text-muted">Admin Overview Panel</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]}
          >
            <Text className="text-primary text-sm font-medium">← Back</Text>
          </Pressable>
        </View>

        {/* Key Metrics Grid */}
        <View className="flex-row gap-3 mb-3">
          <MetricCard
            label="Pending Moderation"
            value="—"
            icon="📋"
            color="#F59E0B"
            onPress={() => router.push("/admin/moderation")}
          />
          <MetricCard
            label="Pending Stores"
            value={String(pendingStores)}
            icon="🏪"
            color="#8B5CF6"
            onPress={() => {}}
          />
        </View>
        <View className="flex-row gap-3 mb-3">
          <MetricCard
            label="Trust Alerts"
            value={String(lowTrustStores)}
            icon="⚠️"
            color="#EF4444"
            onPress={() => {}}
          />
          <MetricCard
            label="Active Stores"
            value={String(activeStores)}
            icon="✅"
            color="#10B981"
            onPress={() => {}}
          />
        </View>
        <View className="flex-row gap-3 mb-4">
          <MetricCard
            label="Avg Trust Score"
            value={String(avgTrust)}
            icon="📊"
            color={avgTrust >= 70 ? "#10B981" : avgTrust >= 50 ? "#F59E0B" : "#EF4444"}
            onPress={() => {}}
          />
          <MetricCard
            label="Suspended"
            value={String(suspendedStores)}
            icon="🚫"
            color="#EF4444"
            onPress={() => {}}
          />
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
        <View className="gap-2 mb-4">
          <ActionButton
            title="Review Pending Products"
            subtitle="Approve or reject submitted products"
            icon="📦"
            onPress={() => router.push("/admin/moderation")}
            colors={colors}
          />
          <ActionButton
            title="Manage Stores"
            subtitle="View, approve, or suspend merchant stores"
            icon="🏬"
            onPress={() => router.push("/admin/marketplace-overview" as any)}
            colors={colors}
          />
          <ActionButton
            title="View Audit Logs"
            subtitle="Full marketplace activity trail with filters"
            icon="📜"
            onPress={() => router.push("/admin/audit-logs" as any)}
            colors={colors}
          />
          <ActionButton
            title="Trust Score Management"
            subtitle="Recalculate scores, override badges"
            icon="🛡️"
            onPress={() => router.push("/admin/trust-management" as any)}
            colors={colors}
          />
          <ActionButton
            title="Verification Queue"
            subtitle="Review delivery partner documents"
            icon="📄"
            onPress={() => router.push("/admin/approvals")}
            colors={colors}
          />
        </View>

        {/* Store Health Summary */}
        <Text className="text-lg font-semibold text-foreground mb-3">Store Health Summary</Text>
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <HealthBar label="Active" count={activeStores} total={stores.length} color="#10B981" />
          <HealthBar label="Pending" count={pendingStores} total={stores.length} color="#F59E0B" />
          <HealthBar label="Suspended" count={suspendedStores} total={stores.length} color="#EF4444" />
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Total Stores</Text>
              <Text className="text-sm font-bold text-foreground">{stores.length}</Text>
            </View>
          </View>
        </View>

        {/* Trust Distribution */}
        <Text className="text-lg font-semibold text-foreground mb-3">Trust Score Distribution</Text>
        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <TrustDistribution stores={stores} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// === Helper Components ===

function MetricCard({ label, value, icon, color, onPress }: {
  label: string; value: string; icon: string; color: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="bg-surface border border-border rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ fontSize: 20 }}>{icon}</Text>
          <Text style={{ color, fontSize: 24, fontWeight: "800" }}>{value}</Text>
        </View>
        <Text className="text-xs text-muted">{label}</Text>
      </View>
    </Pressable>
  );
}

function ActionButton({ title, subtitle, icon, onPress, colors }: {
  title: string; subtitle: string; icon: string; onPress: () => void; colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        opacity: pressed ? 0.7 : 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
      }]}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
      </View>
      <Text className="text-muted">→</Text>
    </Pressable>
  );
}

function HealthBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-xs font-medium text-foreground">{count} ({Math.round(pct)}%)</Text>
      </View>
      <View style={{ height: 6, backgroundColor: color + "20", borderRadius: 3 }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function TrustDistribution({ stores }: { stores: any[] }) {
  const ranges = [
    { label: "Excellent (80-100)", min: 80, max: 100, color: "#10B981" },
    { label: "Good (60-79)", min: 60, max: 79, color: "#22D3EE" },
    { label: "Fair (40-59)", min: 40, max: 59, color: "#F59E0B" },
    { label: "Poor (20-39)", min: 20, max: 39, color: "#F97316" },
    { label: "Critical (0-19)", min: 0, max: 19, color: "#EF4444" },
  ];

  return (
    <View>
      {ranges.map((range) => {
        const count = stores.filter((s: any) => {
          const score = s.trustScore || 0;
          return score >= range.min && score <= range.max;
        }).length;
        const pct = stores.length > 0 ? (count / stores.length) * 100 : 0;
        return (
          <View key={range.label} className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted">{range.label}</Text>
              <Text className="text-xs font-medium text-foreground">{count}</Text>
            </View>
            <View style={{ height: 4, backgroundColor: range.color + "20", borderRadius: 2 }}>
              <View style={{ height: 4, width: `${Math.max(pct, 2)}%`, backgroundColor: range.color, borderRadius: 2 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
