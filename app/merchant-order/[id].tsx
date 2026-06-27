import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MERCHANT_ORDERS } from "@/lib/mock-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";

export default function MerchantOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = MERCHANT_ORDERS.find((o) => o.id === Number(id));
  const [currentStatus, setCurrentStatus] = useState(order?.status || "validated");

  if (!order) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Order not found</Text>
      </ScreenContainer>
    );
  }

  const handleStartPreparing = () => {
    setCurrentStatus("preparing");
    Alert.alert("Status Updated", "Order is now being prepared.");
  };

  const handleMarkReady = () => {
    setCurrentStatus("ready");
    Alert.alert("Colet Ready", "Order marked as ready for pickup. Pilot will be assigned.");
  };

  const handleReportIssue = () => {
    Alert.alert("Report Issue", "Issue reported to operations team.");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground flex-1">{order.orderUid}</Text>
        </View>

        {/* Status */}
        <View className="mx-4 bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-foreground">Order Status</Text>
            <View style={{ backgroundColor: ORDER_STATUS_COLORS[currentStatus] + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: ORDER_STATUS_COLORS[currentStatus], fontSize: 12, fontWeight: "600" }}>
                {ORDER_STATUS_LABELS[currentStatus]}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-muted">Delivery to: {order.deliveryAddress}</Text>
        </View>

        {/* Items */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Items to Prepare</Text>
          {order.items.map((item, idx) => (
            <View key={idx} className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-sm text-foreground">{item.quantity}x {item.name}</Text>
              {item.weight && <Text className="text-xs text-muted">{item.weight} kg</Text>}
            </View>
          ))}
          <View className="flex-row justify-between mt-3">
            <Text className="text-sm text-muted">Package Weight</Text>
            <Text className="text-sm font-medium text-foreground">{order.packageWeight} kg</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="mx-4 gap-3">
          {currentStatus === "validated" && (
            <TouchableOpacity
              className="bg-warning rounded-xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleStartPreparing}
            >
              <Text className="text-white font-bold text-base">Start Preparing</Text>
            </TouchableOpacity>
          )}

          {currentStatus === "preparing" && (
            <TouchableOpacity
              className="bg-success rounded-xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleMarkReady}
            >
              <Text className="text-white font-bold text-base">Mark as Ready (Colet)</Text>
            </TouchableOpacity>
          )}

          {currentStatus === "ready" && (
            <View className="bg-success/10 border border-success/30 rounded-xl p-4 items-center">
              <Text className="text-success font-semibold">Waiting for Pilot Pickup</Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-surface border border-error rounded-xl py-3 items-center"
            activeOpacity={0.8}
            onPress={handleReportIssue}
          >
            <Text className="text-error font-medium text-sm">Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
