import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MERCHANT_ORDERS } from "@/lib/mock-data";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";

const VEHICLE_ICONS: Record<string, string> = {
  drone: "🚁",
  auto: "🚗",
  van: "🚐",
  ebike: "🚲",
};

export default function MerchantOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const order = MERCHANT_ORDERS.find((o) => o.id === Number(id));
  const [currentStatus, setCurrentStatus] = useState(order?.status || "validated");

  if (!order) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Order not found</Text>
      </ScreenContainer>
    );
  }

  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode];

  const handleStartPreparing = () => {
    setCurrentStatus("preparing");
    Alert.alert("Status Updated", "Order is now in preparation.");
  };

  const handleMarkReady = () => {
    setCurrentStatus("ready");
    Alert.alert("Package Ready", "Order marked as ready for pickup. A pilot/driver will be assigned.");
  };

  const handleReportIssue = () => {
    Alert.alert("Report Issue", "Issue has been reported to the operations team.");
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

        {/* Delivery Mode Info */}
        <View className="mx-4 mb-4" style={{ backgroundColor: modeInfo.color + "10", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: modeInfo.color + "30" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 22 }}>{modeInfo.icon}</Text>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: modeInfo.color }}>Delivery Mode: {modeInfo.label}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{modeInfo.description}</Text>
            </View>
          </View>
          {order.vehicleType && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 16 }}>{VEHICLE_ICONS[order.vehicleType]}</Text>
              <Text style={{ fontSize: 11, color: colors.foreground, marginLeft: 6 }}>Vehicul asignat: {order.vehicleType.toUpperCase()}</Text>
            </View>
          )}
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
            <Text className="text-sm text-muted">Greutate Colet</Text>
            <Text className="text-sm font-medium text-foreground">{order.packageWeight} kg</Text>
          </View>
        </View>

        {/* Packaging Instructions based on delivery mode */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Instructions Packaging</Text>
          {order.deliveryMode === "drone" ? (
            <View className="gap-1.5">
              <Text className="text-xs text-muted">• Package must be secured for flight (vibrations)</Text>
              <Text className="text-xs text-muted">• Greutate max: {order.packageWeight} kg</Text>
              <Text className="text-xs text-muted">• Dimensiuni compatibile cu compartimentul dronei</Text>
              <Text className="text-xs text-muted">• QR label mandatory on package</Text>
            </View>
          ) : order.deliveryMode === "multimodal" ? (
            <View className="gap-1.5">
              <Text className="text-xs text-muted">• Coletul va trece prin DronePort (transfer)</Text>
              <Text className="text-xs text-muted">• Packaging resistant to multiple handling</Text>
              <Text className="text-xs text-muted">• QR label + transfer code mandatory</Text>
            </View>
          ) : (
            <View className="gap-1.5">
              <Text className="text-xs text-muted">• Packaging standard pentru transport terestru</Text>
              <Text className="text-xs text-muted">• Label with visible delivery address</Text>
              <Text className="text-xs text-muted">• Adequate protection for product type</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="mx-4 gap-3">
          {currentStatus === "validated" && (
            <TouchableOpacity
              className="bg-warning rounded-xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleStartPreparing}
            >
              <Text className="text-white font-bold text-base">Start Preparation</Text>
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
              <Text className="text-success font-semibold">
                {order.deliveryMode === "drone" ? "Waiting for Drone Pilot" : "Waiting for Driver/Courier"}
              </Text>
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
