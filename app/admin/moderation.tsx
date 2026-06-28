import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";

const API_BASE = "http://127.0.0.1:3000";

export default function AdminModerationPanel() {
  const colors = useColors();
  const router = useRouter();
  const { user, token } = useDropiAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"pending_review" | "approved" | "rejected" | "all">("pending_review");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<number | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Check admin access (system_administrator, security_officer, audit_manager can moderate)
  const adminRoles = ["system_administrator", "security_officer", "audit_manager", "configuration_manager", "analytics_manager"];
  const isAdmin = adminRoles.includes(user?.dropiRole || "");

  const apiCall = useCallback(async (path: string, method = "GET", body?: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  }, [token]);

  const fetchProducts = useCallback(async () => {
    try {
      // Use the pendingReview endpoint for pending, or a general admin list
      if (filter === "pending_review") {
        const res = await apiCall("/api/trpc/product.pendingReview?input=" + encodeURIComponent(JSON.stringify({ json: { limit: 50, offset: 0 } })));
        const data = res?.result?.data?.json;
        setProducts(data?.products || []);
        setStats((s) => ({ ...s, pending: data?.total || 0 }));
      } else {
        // For other filters, use listActive with admin override or just show pending
        const res = await apiCall("/api/trpc/product.pendingReview?input=" + encodeURIComponent(JSON.stringify({ json: { limit: 100, offset: 0 } })));
        const data = res?.result?.data?.json;
        setProducts(data?.products || []);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    }
  }, [filter, apiCall]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  }, [fetchProducts]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleApprove = async (productId: number) => {
    setActionLoading(productId);
    try {
      await apiCall("/api/trpc/product.moderate", "POST", {
        json: { productId, action: "approve", note: "Approved by admin" },
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
    } catch (e) {
      Alert.alert("Error", "Failed to approve product");
    }
    setActionLoading(null);
  };

  const handleReject = async (productId: number) => {
    const note = rejectNote[productId]?.trim();
    if (!note) {
      Alert.alert("Required", "Please provide a rejection reason");
      return;
    }
    setActionLoading(productId);
    try {
      await apiCall("/api/trpc/product.moderate", "POST", {
        json: { productId, action: "reject", note },
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
      setShowRejectInput(null);
      setRejectNote((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    } catch (e) {
      Alert.alert("Error", "Failed to reject product");
    }
    setActionLoading(null);
  };

  if (!isAdmin) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-error">Access Denied</Text>
          <Text className="text-muted mt-2 text-center">
            Only administrators and marketplace moderators can access this panel.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 24 }]}
          >
            <View className="bg-primary px-6 py-3 rounded-xl">
              <Text className="text-background font-semibold">Go Back</Text>
            </View>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <Text className="text-primary text-base">← Back</Text>
            </Pressable>
            <Text className="text-xl font-bold text-foreground">Product Moderation</Text>
            <View style={{ width: 50 }} />
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 flex-row gap-3 mb-4">
          <View className="flex-1 bg-warning/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-warning">{stats.pending}</Text>
            <Text className="text-xs text-muted">Pending</Text>
          </View>
          <View className="flex-1 bg-success/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-success">{stats.approved}</Text>
            <Text className="text-xs text-muted">Approved</Text>
          </View>
          <View className="flex-1 bg-error/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-bold text-error">{stats.rejected}</Text>
            <Text className="text-xs text-muted">Rejected</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="px-6 flex-row gap-2 mb-4">
          {(["pending_review", "approved", "rejected"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View
                className={`px-4 py-2 rounded-full ${filter === f ? "bg-primary" : "bg-surface"}`}
              >
                <Text className={`text-sm font-medium ${filter === f ? "text-background" : "text-muted"}`}>
                  {f === "pending_review" ? "Pending" : f === "approved" ? "Approved" : "Rejected"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Product Queue */}
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-2">Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="py-12 items-center px-6">
            <Text className="text-4xl mb-3">✓</Text>
            <Text className="text-lg font-semibold text-foreground">Queue Empty</Text>
            <Text className="text-muted text-center mt-1">
              No products {filter === "pending_review" ? "pending review" : `with status "${filter}"`}.
            </Text>
          </View>
        ) : (
          <View className="px-6 gap-4">
            {products.map((product) => (
              <View key={product.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                {/* Product Header */}
                <View className="p-4 border-b border-border">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {product.category} • {product.zone}
                      </Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary font-bold text-sm">
                        {parseFloat(product.price).toFixed(2)} {product.currency}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Product Details */}
                <View className="p-4 gap-2">
                  {product.description && (
                    <Text className="text-sm text-muted" numberOfLines={3}>
                      {product.description}
                    </Text>
                  )}

                  <View className="flex-row flex-wrap gap-2 mt-1">
                    <View className="bg-background px-2 py-1 rounded">
                      <Text className="text-xs text-muted">
                        Weight: {parseFloat(product.weight).toFixed(0)}g
                      </Text>
                    </View>
                    {product.dimensions && (
                      <View className="bg-background px-2 py-1 rounded">
                        <Text className="text-xs text-muted">
                          {product.dimensions.l}×{product.dimensions.w}×{product.dimensions.h}cm
                        </Text>
                      </View>
                    )}
                    {product.deliveryModes && (
                      <View className="bg-background px-2 py-1 rounded">
                        <Text className="text-xs text-muted">
                          🚚 {(product.deliveryModes as string[]).join(", ")}
                        </Text>
                      </View>
                    )}
                    {product.isFragile && (
                      <View className="bg-warning/10 px-2 py-1 rounded">
                        <Text className="text-xs text-warning">⚠️ Fragile</Text>
                      </View>
                    )}
                  </View>

                  {/* Auto-moderation notes */}
                  {product.moderationNote && (
                    <View className="bg-warning/5 border border-warning/20 rounded-lg p-3 mt-2">
                      <Text className="text-xs font-medium text-warning mb-1">Auto-Moderation Notes:</Text>
                      <Text className="text-xs text-muted">{product.moderationNote}</Text>
                    </View>
                  )}

                  {/* Images count */}
                  <Text className="text-xs text-muted mt-1">
                    📷 {product.images?.length || 0} image(s) • Stock: {product.stock ?? "∞"}
                  </Text>
                </View>

                {/* Action Buttons (only for pending) */}
                {filter === "pending_review" && (
                  <View className="p-4 border-t border-border">
                    {showRejectInput === product.id ? (
                      <View className="gap-3">
                        <TextInput
                          value={rejectNote[product.id] || ""}
                          onChangeText={(t) => setRejectNote((prev) => ({ ...prev, [product.id]: t }))}
                          placeholder="Rejection reason (required)..."
                          placeholderTextColor={colors.muted}
                          multiline
                          numberOfLines={3}
                          className="bg-background border border-border rounded-xl p-3 text-foreground text-sm"
                          style={{ minHeight: 70, color: colors.foreground }}
                        />
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => { setShowRejectInput(null); }}
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                          >
                            <View className="bg-surface border border-border py-3 rounded-xl items-center">
                              <Text className="text-muted font-medium">Cancel</Text>
                            </View>
                          </Pressable>
                          <Pressable
                            onPress={() => handleReject(product.id)}
                            disabled={actionLoading === product.id}
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                          >
                            <View className="bg-error py-3 rounded-xl items-center">
                              {actionLoading === product.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text className="text-background font-semibold">Confirm Reject</Text>
                              )}
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => setShowRejectInput(product.id)}
                          disabled={actionLoading === product.id}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                        >
                          <View className="bg-error/10 border border-error/30 py-3 rounded-xl items-center">
                            <Text className="text-error font-semibold">Reject</Text>
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={() => handleApprove(product.id)}
                          disabled={actionLoading === product.id}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                        >
                          <View className="bg-success py-3 rounded-xl items-center">
                            {actionLoading === product.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text className="text-background font-semibold">Approve</Text>
                            )}
                          </View>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
