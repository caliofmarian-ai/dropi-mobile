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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { getRequiredApiBaseUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

function storageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRequiredApiBaseUrl("moderation media")}${path.startsWith("/") ? path : `/${path}`}`;
}

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
  const [p2pRejectNote, setP2pRejectNote] = useState<Record<number, string>>({});
  const [p2pActionLoading, setP2pActionLoading] = useState<number | null>(null);

  // Existing merchant moderation visibility is preserved. P2P moderation below
  // is intentionally narrower because the server's adminProcedure is System Administrator only.
  const adminRoles = ["system_administrator", "security_officer", "audit_manager", "configuration_manager", "analytics_manager"];
  const isAdmin = adminRoles.includes(user?.dropiRole || "");
  const isSystemAdministrator = user?.dropiRole === "system_administrator" && user?.channel === "ADMIN";

  const p2pPending = trpc.p2p.pendingCommunityOffers.useQuery(undefined, {
    enabled: isSystemAdministrator,
  });
  const moderateP2p = trpc.p2p.moderateCommunityOffer.useMutation();

  const apiCall = useCallback(async (path: string, method = "GET", body?: any) => {
    const baseUrl = getRequiredApiBaseUrl("admin moderation");
    const res = await fetch(`${baseUrl}${path}`, {
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
      if (filter === "pending_review") {
        const res = await apiCall("/api/trpc/product.pendingReview?input=" + encodeURIComponent(JSON.stringify({ json: { limit: 50, offset: 0 } })));
        const data = res?.result?.data?.json;
        setProducts(data?.products || []);
        setStats((s) => ({ ...s, pending: data?.total || 0 }));
      } else {
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
    await Promise.all([fetchProducts(), isSystemAdministrator ? p2pPending.refetch() : Promise.resolve()]);
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

  async function moderateCommunityOffer(listingId: number, action: "approve" | "reject") {
    const note = p2pRejectNote[listingId]?.trim();
    if (action === "reject" && !note) {
      return Alert.alert("Rejection reason required", "Explain why the community offer does not meet Marketplace rules.");
    }
    setP2pActionLoading(listingId);
    try {
      await moderateP2p.mutateAsync({
        listingId,
        action,
        note: action === "approve" ? "Governance evidence reviewed by System Administrator" : note,
      });
      setP2pRejectNote((current) => {
        const next = { ...current };
        delete next[listingId];
        return next;
      });
      await p2pPending.refetch();
    } catch (error) {
      Alert.alert("Community offer not moderated", error instanceof Error ? error.message : "Request failed.");
    } finally {
      setP2pActionLoading(null);
    }
  }

  if (!isAdmin) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-error">Access Denied</Text>
          <Text className="text-muted mt-2 text-center">
            Only administrators and marketplace moderators can access this panel.
          </Text>
          <Pressable onPress={() => safeGoBack(router)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 24 }]}>
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
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => safeGoBack(router)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <Text className="text-primary text-base">← Back</Text>
            </Pressable>
            <Text className="text-xl font-bold text-foreground">Product Moderation</Text>
            <View style={{ width: 50 }} />
          </View>
        </View>

        {isSystemAdministrator && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-foreground">P2P Community offers</Text>
                <Text className="text-xs text-muted mt-1">System Administrator reviews item media, classification and policy evidence before public approval.</Text>
              </View>
              {p2pPending.isFetching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {(p2pPending.data || []).length === 0 ? (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-muted text-sm">No P2P community offers pending review.</Text>
              </View>
            ) : (
              (p2pPending.data || []).map((listing) => {
                const images = Array.isArray(listing.imagePaths) ? listing.imagePaths : [];
                const declarations = listing.posterDeclarations;
                const completeEvidence = Boolean(
                  listing.category && listing.itemCondition && listing.policyVersion && images.length > 0 && declarations,
                );
                return (
                  <View key={listing.id} className="bg-surface rounded-2xl border border-border overflow-hidden mb-4">
                    {images[0] ? (
                      <Image source={{ uri: storageUrl(images[0]) }} style={{ width: "100%", height: 210, backgroundColor: colors.background }} resizeMode="cover" />
                    ) : (
                      <View style={{ height: 90, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
                        <Text style={{ color: colors.error, fontWeight: "700" }}>No governed item photo</Text>
                      </View>
                    )}
                    <View className="p-4">
                      <Text className="text-base font-bold text-foreground">{listing.title}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {listing.category || "Legacy / unclassified"} • {listing.itemCondition || "condition missing"} • {listing.offerType.replace("_", " ")} • {listing.zone}
                      </Text>
                      {listing.fixedPrice != null && <Text className="text-primary font-bold mt-2">{listing.currency} {Number(listing.fixedPrice).toFixed(2)}</Text>}
                      {listing.description ? <Text className="text-sm text-muted mt-2">{listing.description}</Text> : null}

                      <View className="bg-background rounded-xl p-3 mt-3">
                        <Text className="text-xs font-bold text-foreground">Governance evidence</Text>
                        <Text className="text-xs text-muted mt-2">Photos: {images.length}</Text>
                        <Text className="text-xs text-muted mt-1">Policy: {listing.policyVersion || "missing"}</Text>
                        <Text className="text-xs text-muted mt-1">Accepted: {listing.policyAcceptedAt ? new Date(listing.policyAcceptedAt).toLocaleString() : "missing"}</Text>
                        {declarations ? (
                          <>
                            <Text className="text-xs text-muted mt-1">Rules accepted: {declarations.rulesAccepted ? "yes" : "no"}</Text>
                            <Text className="text-xs text-muted mt-1">Truthful listing: {declarations.truthfulListing ? "yes" : "no"}</Text>
                            <Text className="text-xs text-muted mt-1">Authorized to offer: {declarations.authorizedToOffer ? "yes" : "no"}</Text>
                            <Text className="text-xs text-muted mt-1">Not prohibited/restricted declared: {declarations.notProhibitedOrRestricted ? "yes" : "no"}</Text>
                            <Text className="text-xs text-muted mt-1">Moderation accepted: {declarations.moderationAccepted ? "yes" : "no"}</Text>
                          </>
                        ) : <Text className="text-xs text-error mt-1">Poster declarations missing</Text>}
                      </View>

                      {listing.foodSafety && (
                        <View className="bg-background rounded-xl p-3 mt-3">
                          <Text className="text-xs font-bold text-foreground">Food / consumable declarations</Text>
                          <Text className="text-xs text-muted mt-2">Ingredients / contents: {listing.foodSafety.ingredients}</Text>
                          <Text className="text-xs text-muted mt-1">Allergens: {listing.foodSafety.allergens}</Text>
                          <Text className="text-xs text-muted mt-1">Storage: {listing.foodSafety.storageInstructions}</Text>
                          {listing.foodSafety.useBy ? <Text className="text-xs text-muted mt-1">Use by: {new Date(listing.foodSafety.useBy).toLocaleDateString()}</Text> : null}
                        </View>
                      )}

                      {!completeEvidence && (
                        <Text className="text-xs text-error font-semibold mt-3">Legacy/incomplete listing. Backend approval is blocked until current governance evidence exists.</Text>
                      )}

                      <TextInput
                        value={p2pRejectNote[listing.id] || ""}
                        onChangeText={(value) => setP2pRejectNote((current) => ({ ...current, [listing.id]: value }))}
                        placeholder="Rejection reason (required only for reject)"
                        placeholderTextColor={colors.muted}
                        multiline
                        style={{ minHeight: 62, marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground, backgroundColor: colors.background, textAlignVertical: "top" }}
                      />
                      <View className="flex-row gap-3 mt-3">
                        <Pressable disabled={p2pActionLoading === listing.id} onPress={() => void moderateCommunityOffer(listing.id, "reject")} style={({ pressed }) => [{ opacity: pressed || p2pActionLoading === listing.id ? 0.6 : 1, flex: 1 }]}>
                          <View className="bg-error/10 border border-error/30 py-3 rounded-xl items-center">
                            <Text className="text-error font-semibold">Reject</Text>
                          </View>
                        </Pressable>
                        <Pressable disabled={p2pActionLoading === listing.id || !completeEvidence} onPress={() => void moderateCommunityOffer(listing.id, "approve")} style={({ pressed }) => [{ opacity: pressed || p2pActionLoading === listing.id || !completeEvidence ? 0.5 : 1, flex: 1 }]}>
                          <View className="bg-success py-3 rounded-xl items-center">
                            {p2pActionLoading === listing.id ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Approve</Text>}
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

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

        <View className="px-6 flex-row gap-2 mb-4">
          {(["pending_review", "approved", "rejected"] as const).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <View className={`px-4 py-2 rounded-full ${filter === f ? "bg-primary" : "bg-surface"}`}>
                <Text className={`text-sm font-medium ${filter === f ? "text-background" : "text-muted"}`}>
                  {f === "pending_review" ? "Pending" : f === "approved" ? "Approved" : "Rejected"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="px-6 mb-2">
          <Text className="text-lg font-bold text-foreground">Merchant products</Text>
        </View>

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
                <View className="p-4 border-b border-border">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={2}>{product.name}</Text>
                      <Text className="text-sm text-muted mt-1">{product.category} • {product.zone}</Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary font-bold text-sm">{parseFloat(product.price).toFixed(2)} {product.currency}</Text>
                    </View>
                  </View>
                </View>

                <View className="p-4 gap-2">
                  {product.description && <Text className="text-sm text-muted" numberOfLines={3}>{product.description}</Text>}
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    <View className="bg-background px-2 py-1 rounded"><Text className="text-xs text-muted">Weight: {parseFloat(product.weight).toFixed(0)}g</Text></View>
                    {product.dimensions && <View className="bg-background px-2 py-1 rounded"><Text className="text-xs text-muted">{product.dimensions.l}×{product.dimensions.w}×{product.dimensions.h}cm</Text></View>}
                    {product.deliveryModes && <View className="bg-background px-2 py-1 rounded"><Text className="text-xs text-muted">🚚 {(product.deliveryModes as string[]).join(", ")}</Text></View>}
                    {product.isFragile && <View className="bg-warning/10 px-2 py-1 rounded"><Text className="text-xs text-warning">⚠️ Fragile</Text></View>}
                  </View>
                  {product.moderationNote && (
                    <View className="bg-warning/5 border border-warning/20 rounded-lg p-3 mt-2">
                      <Text className="text-xs font-medium text-warning mb-1">Auto-Moderation Notes:</Text>
                      <Text className="text-xs text-muted">{product.moderationNote}</Text>
                    </View>
                  )}
                  <Text className="text-xs text-muted mt-1">📷 {product.images?.length || 0} image(s) • Stock: {product.stock ?? "∞"}</Text>
                </View>

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
                          <Pressable onPress={() => { setShowRejectInput(null); }} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}>
                            <View className="bg-surface border border-border py-3 rounded-xl items-center"><Text className="text-muted font-medium">Cancel</Text></View>
                          </Pressable>
                          <Pressable onPress={() => handleReject(product.id)} disabled={actionLoading === product.id} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}>
                            <View className="bg-error py-3 rounded-xl items-center">
                              {actionLoading === product.id ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Confirm Reject</Text>}
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row gap-3">
                        <Pressable onPress={() => setShowRejectInput(product.id)} disabled={actionLoading === product.id} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}>
                          <View className="bg-error/10 border border-error/30 py-3 rounded-xl items-center"><Text className="text-error font-semibold">Reject</Text></View>
                        </Pressable>
                        <Pressable onPress={() => handleApprove(product.id)} disabled={actionLoading === product.id} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}>
                          <View className="bg-success py-3 rounded-xl items-center">
                            {actionLoading === product.id ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Approve</Text>}
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
