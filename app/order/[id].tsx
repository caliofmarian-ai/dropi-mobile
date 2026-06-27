import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { CLIENT_ORDERS } from "@/lib/mock-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";
import type { OrderStatus } from "@/shared/types";

const TIMELINE_STEPS: OrderStatus[] = ["initiated", "validated", "preparing", "ready", "accepted", "in_execution", "completed"];

function getStepIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = CLIENT_ORDERS.find((o) => o.id === Number(id));

  if (!order) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Order not found</Text>
      </ScreenContainer>
    );
  }

  const currentStep = getStepIndex(order.status);

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

        {/* Status Card */}
        <View className="mx-4 bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-foreground">{order.merchantName}</Text>
            <View style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: ORDER_STATUS_COLORS[order.status], fontSize: 12, fontWeight: "600" }}>
                {ORDER_STATUS_LABELS[order.status]}
              </Text>
            </View>
          </View>

          {order.status === "in_execution" && (
            <View className="bg-primary/10 rounded-xl p-3 mb-3">
              <Text className="text-primary font-semibold text-sm">Live — ETA {order.estimatedTime} min</Text>
              <Text className="text-primary/70 text-xs mt-0.5">Drone en route to your location</Text>
            </View>
          )}

          <Text className="text-sm text-muted">Delivery to: {order.deliveryAddress}</Text>
          <Text className="text-sm text-muted mt-1">Pickup from: {order.pickupAddress}</Text>
        </View>

        {/* Progress Timeline */}
        <View className="mx-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">Progress</Text>
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={step} className="flex-row items-start mb-0">
                <View className="items-center mr-3">
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: isCompleted ? "#0066FF" : "#E5E7EB",
                      borderWidth: isCurrent ? 3 : 0,
                      borderColor: "#0066FF",
                    }}
                  />
                  {index < TIMELINE_STEPS.length - 1 && (
                    <View
                      style={{
                        width: 2,
                        height: 24,
                        backgroundColor: index < currentStep ? "#0066FF" : "#E5E7EB",
                      }}
                    />
                  )}
                </View>
                <Text
                  className={`text-sm pb-4 ${isCurrent ? "font-semibold text-foreground" : isCompleted ? "text-foreground" : "text-muted"}`}
                >
                  {ORDER_STATUS_LABELS[step]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Items */}
        <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx} className="flex-row justify-between py-1.5">
              <Text className="text-sm text-foreground">{item.quantity}x {item.name}</Text>
              {item.weight && <Text className="text-xs text-muted">{item.weight} kg</Text>}
            </View>
          ))}
          <View className="border-t border-border mt-2 pt-2 flex-row justify-between">
            <Text className="text-sm font-medium text-foreground">Total</Text>
            <Text className="text-sm font-bold text-foreground">₱{order.totalAmount}</Text>
          </View>
        </View>

        {/* Tracking Map Placeholder (when in_execution) */}
        {order.status === "in_execution" && (
          <View className="mx-4 bg-surface border border-primary/30 rounded-2xl h-48 items-center justify-center mb-4">
            <Text className="text-primary font-medium">Live Tracking Map</Text>
            <Text className="text-xs text-muted mt-1">Drone position updating in real-time</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
