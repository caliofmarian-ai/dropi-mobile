/**
 * Merchant Reviews Screen
 * 
 * Shows all customer reviews for the merchant's store.
 * Uses review.myStoreReviews query which returns productReviews records.
 */
import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

function StarRating({ rating }: { rating: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: 14, color: star <= rating ? "#F59E0B" : "#E5E7EB" }}>★</Text>
      ))}
    </View>
  );
}

export default function MerchantReviewsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const reviewsQuery = trpc.review.myStoreReviews.useQuery({ limit: 50 });
  const reviews = reviewsQuery.data?.reviews || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    reviewsQuery.refetch().finally(() => setRefreshing(false));
  }, []);

  // Calculate averages from overallRating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.overallRating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Reviews</Text>
          <Text className="text-xs text-muted">{reviews.length} total reviews</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-4 flex-row items-center">
        <View className="items-center mr-6">
          <Text className="text-3xl font-bold text-foreground">{avgRating}</Text>
          <StarRating rating={Math.round(parseFloat(avgRating))} />
          <Text className="text-xs text-muted mt-1">{reviews.length} reviews</Text>
        </View>
        <View className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r: any) => r.overallRating === star).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <View key={star} className="flex-row items-center mb-1">
                <Text className="text-xs text-muted w-3">{star}</Text>
                <Text className="text-xs text-muted mx-1">★</Text>
                <View className="flex-1 h-2 bg-border rounded-full overflow-hidden mx-2">
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: "#F59E0B", borderRadius: 4 }} />
                </View>
                <Text className="text-xs text-muted w-6 text-right">{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reviews List */}
      {reviewsQuery.isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item: any) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }: { item: any }) => (
            <View className="bg-surface border border-border rounded-xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <StarRating rating={item.overallRating} />
                  {item.qualityRating !== item.overallRating && (
                    <Text className="text-xs text-muted mt-0.5">Quality: {item.qualityRating}/5</Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
                  {item.isVerifiedPurchase && (
                    <Text className="text-xs text-success">✓ Verified</Text>
                  )}
                </View>
              </View>
              {item.comment && (
                <Text className="text-sm text-foreground leading-relaxed">{item.comment}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text style={{ fontSize: 40, marginBottom: 12 }}>⭐</Text>
              <Text className="text-base text-muted">No reviews yet</Text>
              <Text className="text-xs text-muted mt-1">Reviews will appear here as customers rate your products</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
