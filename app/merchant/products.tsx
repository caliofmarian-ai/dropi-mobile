/**
 * Merchant Products List Screen
 * 
 * Shows all products for the merchant's store with filtering by status.
 * Uses product.myProducts query which returns products with fields from the products table.
 */
import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

const STATUS_COLORS: Record<string, string> = {
  approved: "#10B981",
  pending_review: "#F59E0B",
  draft: "#6B7280",
  rejected: "#EF4444",
  suspended: "#DC2626",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Live",
  pending_review: "In Review",
  draft: "Draft",
  rejected: "Rejected",
  suspended: "Suspended",
};

type FilterStatus = "all" | "draft" | "pending_review" | "approved" | "rejected" | "suspended";

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Live" },
  { key: "pending_review", label: "In Review" },
  { key: "draft", label: "Drafts" },
  { key: "rejected", label: "Rejected" },
];

export default function MerchantProductsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  const productsQuery = trpc.product.myProducts.useQuery({
    status: filter === "all" ? undefined : filter,
    limit: 50,
  });

  const products = productsQuery.data?.products || [];
  const total = productsQuery.data?.total || 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    productsQuery.refetch().finally(() => setRefreshing(false));
  }, []);

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Products</Text>
            <Text className="text-xs text-muted">{total} total</Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-2.5"
          activeOpacity={0.8}
          onPress={() => router.push("/merchant/product-new" as any)}
        >
          <Text className="text-background font-semibold text-sm">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="flex-row mb-4 gap-2">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`px-3 py-1.5 rounded-full ${filter === f.key ? "bg-primary" : "bg-surface border border-border"}`}
            activeOpacity={0.7}
            onPress={() => setFilter(f.key)}
          >
            <Text className={`text-xs font-medium ${filter === f.key ? "text-background" : "text-muted"}`}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product List */}
      {productsQuery.isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] || "#6B7280";
            // deliveryModes is stored as a JSON array of strings
            const modes = (item.deliveryModes as string[] | null) || [];
            const hasDrone = modes.includes("drone");

            return (
              <TouchableOpacity
                className="bg-surface border border-border rounded-xl p-4 mb-3"
                activeOpacity={0.7}
                onPress={() => router.push(`/merchant/product/${item.id}` as any)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-foreground" numberOfLines={2}>{item.name}</Text>
                    <Text className="text-xs text-muted mt-1">{item.category}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-foreground">{item.currency} {item.price}</Text>
                    <View className="flex-row items-center mt-1">
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor, marginRight: 4 }} />
                      <Text style={{ color: statusColor, fontSize: 11, fontWeight: "600" }}>
                        {STATUS_LABELS[item.status] || item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delivery modes & info */}
                <View className="flex-row items-center mt-2 gap-2">
                  {modes.includes("terrestrial") && (
                    <View className="flex-row items-center bg-blue-500/10 px-2 py-0.5 rounded">
                      <Text style={{ fontSize: 10 }}>🚗</Text>
                      <Text className="text-xs text-muted ml-1">Ground</Text>
                    </View>
                  )}
                  {hasDrone && (
                    <View className="flex-row items-center bg-purple-500/10 px-2 py-0.5 rounded">
                      <Text style={{ fontSize: 10 }}>🚁</Text>
                      <Text className="text-xs text-muted ml-1">Drone</Text>
                    </View>
                  )}
                  {item.stock !== null && (
                    <Text className="text-xs text-muted">Stock: {item.stock}</Text>
                  )}
                </View>

                {/* Moderation note for rejected products */}
                {item.status === "rejected" && item.moderationNote && (
                  <View className="mt-2 bg-error/10 rounded-lg px-3 py-1.5">
                    <Text className="text-xs" style={{ color: "#EF4444" }}>
                      Reason: {item.moderationNote}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
              <Text className="text-base text-muted">No products yet</Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-5 py-2.5 rounded-xl"
                onPress={() => router.push("/merchant/product-new" as any)}
              >
                <Text className="text-background font-semibold">Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
