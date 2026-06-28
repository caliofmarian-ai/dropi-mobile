/**
 * Merchant Product Detail Screen
 * 
 * Shows full product info with status, delivery badges, reviews summary,
 * and actions (edit, submit for review, delete).
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

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

const DELIVERY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  terrestrial: { icon: "🚗", color: "#3B82F6", label: "Ground Delivery" },
  drone: { icon: "🚁", color: "#8B5CF6", label: "Drone Delivery" },
  multimodal: { icon: "🔄", color: "#10B981", label: "Multimodal" },
};

export default function MerchantProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deleting, setDeleting] = useState(false);

  const productQuery = trpc.product.getById.useQuery({ id: parseInt(id || "0") });
  const removeMutation = trpc.product.remove.useMutation();

  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
        <Text className="text-lg font-semibold text-foreground">Product Not Found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-medium">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This will deactivate the product.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await removeMutation.mutateAsync({ productId: product.id });
              Alert.alert("Deleted", "Product has been deactivated.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const statusColor = STATUS_COLORS[product.status] || "#6B7280";

  // Dimensions from product (stored as { l, w, h })
  const dims = product.dimensions as { l: number; w: number; h: number } | null;

  // Delivery badges from the joined relation
  const badges = product.deliveryBadges || [];

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground" numberOfLines={2}>{product.name}</Text>
          </View>
        </View>

        {/* Status Card */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted">Status</Text>
              <View className="flex-row items-center mt-1">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, marginRight: 8 }} />
                <Text style={{ color: statusColor, fontSize: 16, fontWeight: "700" }}>
                  {STATUS_LABELS[product.status] || product.status}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">Price</Text>
              <Text className="text-xl font-bold text-foreground">{product.currency} {product.price}</Text>
            </View>
          </View>
          {product.moderationNote && (
            <View className="mt-3 bg-error/10 rounded-lg px-3 py-2">
              <Text className="text-xs font-semibold" style={{ color: "#EF4444" }}>Moderation Note:</Text>
              <Text className="text-xs text-muted mt-0.5">{product.moderationNote}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Details</Text>
          {product.description && (
            <Text className="text-sm text-muted mb-3 leading-relaxed">{product.description}</Text>
          )}
          <View className="gap-2">
            <InfoRow label="Category" value={product.category} />
            {product.subcategory && <InfoRow label="Subcategory" value={product.subcategory} />}
            <InfoRow label="Weight" value={`${product.weight} g`} />
            {dims && (
              <InfoRow label="Dimensions" value={`${dims.l} × ${dims.w} × ${dims.h} cm`} />
            )}
            {product.stock !== null && product.stock !== undefined && (
              <InfoRow label="Stock" value={`${product.stock} units`} />
            )}
            <InfoRow label="Zone" value={product.zone} />
            <InfoRow label="Fragile" value={product.isFragile ? "Yes" : "No"} />
            <InfoRow label="Special Packaging" value={product.requiresSpecialPackaging ? "Required" : "Not needed"} />
          </View>
        </View>

        {/* Delivery Badges */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Delivery Compatibility</Text>
          <View className="gap-2">
            {badges.map((badge) => {
              const info = DELIVERY_ICONS[badge.mode];
              if (!info) return null;
              return (
                <View key={badge.id} className="flex-row items-center">
                  <View style={{ backgroundColor: info.color + "15", width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>{info.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">{info.label}</Text>
                    {badge.conditions && <Text className="text-xs text-muted">{badge.conditions}</Text>}
                  </View>
                  <Text style={{ fontSize: 14, color: badge.isEligible ? "#10B981" : "#EF4444" }}>
                    {badge.isEligible ? "✓" : "✗"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reviews Summary */}
        {product.reviews && product.reviews.length > 0 && (
          <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Recent Reviews ({product.reviews.length})</Text>
            {product.reviews.slice(0, 3).map((review) => (
              <View key={review.id} className="py-2 border-b border-border">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text key={star} style={{ fontSize: 12, color: star <= review.overallRating ? "#F59E0B" : "#E5E7EB" }}>★</Text>
                    ))}
                  </View>
                  <Text className="text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
                {review.comment && <Text className="text-xs text-muted mt-1">{review.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Timestamps */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Timeline</Text>
          <InfoRow label="Created" value={new Date(product.createdAt).toLocaleDateString()} />
          <InfoRow label="Last Updated" value={new Date(product.updatedAt).toLocaleDateString()} />
          {product.moderatedAt && <InfoRow label="Moderated" value={new Date(product.moderatedAt).toLocaleDateString()} />}
        </View>

        {/* Actions */}
        <View className="gap-3">
          {(product.status === "draft" || product.status === "rejected") && (
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center"
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert("Coming Soon", "Edit functionality will be available in the next update.");
              }}
            >
              <Text className="text-background font-semibold text-base">
                {product.status === "rejected" ? "Edit & Resubmit" : "Submit for Review"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-error/10 border border-error/30 rounded-2xl py-4 items-center"
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text className="font-semibold text-base" style={{ color: "#EF4444" }}>Delete Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm text-foreground font-medium">{value}</Text>
    </View>
  );
}
