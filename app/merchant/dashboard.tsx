/**
 * Merchant Marketplace Dashboard
 * 
 * The main hub for merchants to manage their store, products, orders, and analytics.
 * Supports two store types: internal (products in DROPi) and external (redirect + Logistic API).
 */
import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

function StatCard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color: string }) {
  return (
    <View className="bg-surface border border-border rounded-xl p-4 flex-1 min-w-[140px]">
      <Text className="text-xs text-muted mb-1">{title}</Text>
      <Text style={{ color, fontSize: 24, fontWeight: "700" }}>{value}</Text>
      {subtitle && <Text className="text-xs text-muted mt-1">{subtitle}</Text>}
    </View>
  );
}

function BadgeChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6 }}>
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch store data
  const storeQuery = trpc.store.getMyStore.useQuery();
  const productsQuery = trpc.product.myProducts.useQuery({ limit: 5 });

  const store = storeQuery.data;
  const products = productsQuery.data;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([storeQuery.refetch(), productsQuery.refetch()]).finally(() => setRefreshing(false));
  }, []);

  // No store yet — show setup prompt
  if (!storeQuery.isLoading && !store) {
    return (
      <ScreenContainer className="px-6 pt-6">
        <View className="flex-1 items-center justify-center">
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏪</Text>
          <Text className="text-2xl font-bold text-foreground text-center mb-2">Set Up Your Store</Text>
          <Text className="text-base text-muted text-center mb-8">
            Create your store to start selling on DROPi marketplace or connect your external shop.
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-4 rounded-2xl"
            activeOpacity={0.8}
            onPress={() => router.push("/merchant/store-setup")}
          >
            <Text className="text-background font-semibold text-base">Create Store</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (storeQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-muted mt-4">Loading store...</Text>
      </ScreenContainer>
    );
  }

  // Store exists — show dashboard
  const trustColor = (store?.trustScore || 0) >= 80 ? "#10B981" : (store?.trustScore || 0) >= 50 ? "#F59E0B" : "#EF4444";
  const statusColor = store?.status === "active" ? "#10B981" : store?.status === "pending" ? "#F59E0B" : "#EF4444";

  const pendingCount = products?.products.filter((p: any) => p.status === "pending_review").length || 0;
  const activeCount = products?.products.filter((p: any) => p.status === "approved").length || 0;
  const draftCount = products?.products.filter((p: any) => p.status === "draft").length || 0;

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Store Header */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">{store?.name}</Text>
            <View className="flex-row items-center mt-1">
              <BadgeChip label={store?.status === "active" ? "Active" : store?.status === "pending" ? "Pending Approval" : "Suspended"} color={statusColor} />
              <BadgeChip label={store?.type === "internal" ? "Internal Store" : "External Store"} color="#6366F1" />
            </View>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: "#F3F4F6", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
            onPress={() => router.push("/merchant/store-setup")}
          >
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Score — tappable */}
        <Pressable
          onPress={() => router.push("/merchant/trust")}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-muted">Trust Score</Text>
                <Text style={{ color: trustColor, fontSize: 32, fontWeight: "800" }}>{store?.trustScore || 0}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Total Reviews</Text>
                <Text className="text-lg font-bold text-foreground">{store?.totalReviews || 0}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Total Orders</Text>
                <Text className="text-lg font-bold text-foreground">{store?.totalOrders || 0}</Text>
              </View>
            </View>
            <Text className="text-primary text-xs text-center mt-2">Tap to view details →</Text>
          </View>
        </Pressable>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-4">
          <StatCard title="Active Products" value={String(activeCount)} color="#10B981" />
          <StatCard title="Pending Review" value={String(pendingCount)} color="#F59E0B" />
          <StatCard title="Drafts" value={String(draftCount)} color="#6B7280" />
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
        <View className="gap-2 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 flex-row items-center"
            activeOpacity={0.8}
            onPress={() => router.push("/merchant/product-new")}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>➕</Text>
            <View className="flex-1">
              <Text className="text-background font-semibold">Add New Product</Text>
              <Text className="text-background/70 text-xs">List a new item in the marketplace</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-4 flex-row items-center"
            activeOpacity={0.7}
            onPress={() => router.push("/merchant/products")}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>📦</Text>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Manage Products</Text>
              <Text className="text-muted text-xs">{products?.total || 0} products in catalog</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-4 flex-row items-center"
            activeOpacity={0.7}
            onPress={() => router.push("/merchant/reviews")}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>⭐</Text>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Customer Reviews</Text>
              <Text className="text-muted text-xs">See what customers say</Text>
            </View>
          </TouchableOpacity>

          {store?.type === "external" && (
            <TouchableOpacity
              className="bg-surface border border-border rounded-xl p-4 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/api-integration")}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>🔗</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">API Integration</Text>
                <Text className="text-muted text-xs">Manage your Logistic API key & webhooks</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Products */}
        {products && products.products.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">Recent Products</Text>
              <TouchableOpacity onPress={() => router.push("/merchant/products")}>
                <Text className="text-primary text-sm font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            {products.products.slice(0, 3).map((product: any) => (
              <TouchableOpacity
                key={product.id}
                className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center"
                activeOpacity={0.7}
                onPress={() => router.push(`/merchant/product/${product.id}`)}
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">{product.category} • RON {product.price}</Text>
                </View>
                <BadgeChip
                  label={product.status === "approved" ? "Live" : product.status === "pending_review" ? "In Review" : product.status}
                  color={product.status === "approved" ? "#10B981" : product.status === "pending_review" ? "#F59E0B" : "#6B7280"}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Store Pending Notice */}
        {store?.status === "pending" && (
          <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mt-4">
            <Text className="text-sm font-semibold" style={{ color: "#F59E0B" }}>Store Pending Approval</Text>
            <Text className="text-xs text-muted mt-1">
              Your store is being reviewed by the DROPi team. You can start adding products as drafts while you wait.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
