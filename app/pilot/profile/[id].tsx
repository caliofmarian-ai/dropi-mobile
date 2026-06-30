import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable, ActivityIndicator, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

// Rating reason labels
const REASON_LABELS: Record<string, string> = {
  delivery_completed: "Delivery Completed",
  delivery_failed: "Delivery Failed",
  delivery_late: "Late Delivery",
  customer_review: "Customer Review",
  incident_reported: "Incident Reported",
  periodic_recalculation: "Periodic Recalculation",
  admin_adjustment: "Admin Adjustment",
  initial_calculation: "Initial Calculation",
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  delivered: "#22C55E",
  failed: "#EF4444",
  in_transit: "#3B82F6",
  pending: "#F59E0B",
  assigned: "#8B5CF6",
  picked_up: "#06B6D4",
  cancelled: "#6B7280",
};

export default function PilotProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const userId = parseInt(id || "0", 10);

  const { data, isLoading, error } = trpc.pilotSelection.getPilotDetail.useQuery(
    { userId },
    { enabled: userId > 0 }
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading pilot profile...</Text>
      </ScreenContainer>
    );
  }

  if (error || !data) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-4xl mb-4">👤</Text>
        <Text className="text-xl font-bold text-foreground mb-2">Pilot Not Found</Text>
        <Text className="text-muted text-center mb-6">
          This pilot profile could not be loaded.
        </Text>
        <Pressable
          onPress={() => safeGoBack(router)}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-background font-semibold">Go Back</Text>
          </View>
        </Pressable>
      </ScreenContainer>
    );
  }

  const { user, profile, ratingHistory, deliveryStats, recentDeliveries } = data;
  const rating = parseFloat(String(profile.rating || "0"));
  const completionRate = parseFloat(String(profile.completionRate || "0"));
  const onTimeRate = parseFloat(String(profile.onTimeRate || "0"));
  const customerRating = parseFloat(String(profile.customerRating || "0"));
  const incidentRate = parseFloat(String(profile.incidentRate || "0"));

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="p-4 flex-row items-center">
          <Pressable
            onPress={() => safeGoBack(router)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-primary text-lg">← Back</Text>
          </Pressable>
        </View>

        {/* Profile Header Card */}
        <View className="mx-4 bg-surface rounded-2xl p-6 border border-border mb-4">
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-3">
              <Text className="text-3xl">👨‍✈️</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{user.name}</Text>
            <Text className="text-muted text-sm">{user.zone} • {user.channel}</Text>
            {profile.cosEligible && (
              <View className="mt-2 bg-success/20 px-3 py-1 rounded-full">
                <Text className="text-success text-xs font-semibold">COS Eligible</Text>
              </View>
            )}
          </View>

          {/* Rating Display */}
          <View className="items-center mb-4">
            <Text className="text-5xl font-bold text-primary">{rating.toFixed(2)}</Text>
            <Text className="text-muted text-sm">Overall Rating</Text>
            <View className="flex-row mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} className="text-lg">
                  {star <= Math.round(rating) ? "⭐" : "☆"}
                </Text>
              ))}
            </View>
          </View>

          {/* Quick Stats Row */}
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-lg font-bold text-foreground">{profile.totalDeliveries}</Text>
              <Text className="text-xs text-muted">Deliveries</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-lg font-bold text-success">{completionRate.toFixed(1)}%</Text>
              <Text className="text-xs text-muted">Completion</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-lg font-bold text-primary">{onTimeRate.toFixed(1)}%</Text>
              <Text className="text-xs text-muted">On-Time</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-lg font-bold text-foreground">{profile.isAvailable ? "🟢" : "🔴"}</Text>
              <Text className="text-xs text-muted">{profile.isAvailable ? "Online" : "Offline"}</Text>
            </View>
          </View>
        </View>

        {/* Rating Breakdown */}
        <View className="mx-4 bg-surface rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">Rating Breakdown</Text>
          
          <RatingBar label="Completion Rate" value={completionRate} max={100} color="#22C55E" suffix="%" />
          <RatingBar label="On-Time Rate" value={onTimeRate} max={100} color="#3B82F6" suffix="%" />
          <RatingBar label="Customer Rating" value={customerRating} max={5} color="#F59E0B" suffix="/5" />
          <RatingBar label="Incident Rate" value={incidentRate} max={20} color="#EF4444" suffix="%" inverted />
        </View>

        {/* Delivery Stats */}
        <View className="mx-4 bg-surface rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">B2B Delivery Stats</Text>
          <View className="flex-row flex-wrap">
            <StatBox label="Total" value={String(deliveryStats.total || 0)} color="#3B82F6" />
            <StatBox label="Completed" value={String(deliveryStats.completed || 0)} color="#22C55E" />
            <StatBox label="Failed" value={String(deliveryStats.failed || 0)} color="#EF4444" />
            <StatBox label="In Transit" value={String(deliveryStats.inTransit || 0)} color="#8B5CF6" />
          </View>
        </View>

        {/* Vehicle & Capabilities */}
        <View className="mx-4 bg-surface rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">Capabilities</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {(Array.isArray(profile.vehicleTypes) ? profile.vehicleTypes : []).map((v: string) => (
              <View key={v} className="bg-primary/10 px-3 py-1.5 rounded-full">
                <Text className="text-primary text-sm font-medium">
                  {v === "drone" ? "🚁" : v === "car" ? "🚗" : v === "van" ? "🚐" : v === "ebike" ? "🚲" : "🏍️"} {v}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-muted text-sm">Max Weight: {profile.maxWeightGrams ? `${(profile.maxWeightGrams / 1000).toFixed(1)} kg` : "N/A"}</Text>
          <Text className="text-muted text-sm mt-1">
            Zones: {(Array.isArray(profile.operatingZones) ? profile.operatingZones : []).join(", ") || "All"}
          </Text>
        </View>

        {/* Rating History Timeline */}
        <View className="mx-4 bg-surface rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">Rating History</Text>
          {ratingHistory.length === 0 ? (
            <Text className="text-muted text-center py-4">No rating history yet</Text>
          ) : (
            ratingHistory.map((entry: any, idx: number) => (
              <View key={entry.id || idx} className="flex-row items-start mb-3 pb-3 border-b border-border">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs">
                    {entry.reason === "delivery_completed" ? "✅" :
                     entry.reason === "delivery_failed" ? "❌" :
                     entry.reason === "customer_review" ? "⭐" :
                     entry.reason === "incident_reported" ? "⚠️" :
                     entry.reason === "admin_adjustment" ? "🔧" : "📊"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {REASON_LABELS[entry.reason] || entry.reason}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-xs text-muted">
                      {parseFloat(String(entry.previousRating || 0)).toFixed(2)}
                    </Text>
                    <Text className="text-xs text-muted mx-1">→</Text>
                    <Text className={`text-xs font-semibold ${
                      parseFloat(String(entry.newRating || 0)) > parseFloat(String(entry.previousRating || 0))
                        ? "text-success" : "text-error"
                    }`}>
                      {parseFloat(String(entry.newRating || 0)).toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted mt-0.5">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Deliveries */}
        <View className="mx-4 bg-surface rounded-2xl p-5 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">Recent Deliveries</Text>
          {recentDeliveries.length === 0 ? (
            <Text className="text-muted text-center py-4">No deliveries recorded</Text>
          ) : (
            recentDeliveries.map((delivery: any, idx: number) => (
              <View key={delivery.id || idx} className="flex-row items-center mb-3 pb-3 border-b border-border">
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: STATUS_COLORS[delivery.status] || "#6B7280" }}
                />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {delivery.trackingCode || `Delivery #${delivery.id}`}
                  </Text>
                  <Text className="text-xs text-muted">
                    {delivery.deliveryMode} • {delivery.status}
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Member Since */}
        <View className="mx-4 items-center py-4">
          <Text className="text-muted text-sm">
            Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// --- Helper Components ---

function RatingBar({ label, value, max, color, suffix, inverted }: {
  label: string; value: number; max: number; color: string; suffix: string; inverted?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const displayPercentage = inverted ? (100 - percentage) : percentage;
  
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-foreground">{label}</Text>
        <Text className="text-sm font-semibold text-foreground">
          {value.toFixed(1)}{suffix}
        </Text>
      </View>
      <View className="h-2.5 bg-border rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${displayPercentage}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="w-1/2 p-2">
      <View className="bg-background rounded-xl p-3 items-center border border-border">
        <Text className="text-2xl font-bold" style={{ color }}>{value}</Text>
        <Text className="text-xs text-muted mt-1">{label}</Text>
      </View>
    </View>
  );
}
