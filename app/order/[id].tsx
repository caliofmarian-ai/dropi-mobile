import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { CLIENT_ORDERS } from "@/lib/mock-data";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/shared/types";
import type { OrderStatus } from "@/shared/types";
import { DeliveryMap, createDemoRoute } from "@/components/delivery-map";
import type { VehicleType, DeliveryStatus } from "@/components/delivery-map";

const TIMELINE_STEPS: OrderStatus[] = ["initiated", "validated", "preparing", "ready", "accepted", "in_execution", "completed"];

function getStepIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

const VEHICLE_ICONS: Record<string, string> = {
  drone: "🚁",
  auto: "🚗",
  van: "🚐",
  ebike: "🚲",
};

const RECEPTION_LABELS: Record<string, string> = {
  personal: "🤝 Predare personală",
  door: "🚪 La ușă",
  gate: "🏠 La poartă",
  yard: "🌳 În curte",
  droneport: "🏗️ DronePort Pickup",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const order = CLIENT_ORDERS.find((o) => o.id === Number(id));

  if (!order) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Comandă negăsită</Text>
      </ScreenContainer>
    );
  }

  const currentStep = getStepIndex(order.status);
  const modeInfo = DELIVERY_MODE_INFO[order.deliveryMode];
  const fallbackInfo = order.fallbackMode ? DELIVERY_MODE_INFO[order.fallbackMode] : null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
            <Text className="text-primary text-base">← Înapoi</Text>
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
              <Text className="text-primary font-semibold text-sm">
                Live — ETA {order.estimatedTime} min
              </Text>
              <Text className="text-primary/70 text-xs mt-0.5">
                {order.vehicleType === "drone" ? "Dronă în zbor spre locația ta" :
                 order.vehicleType === "auto" ? "Vehicul auto în drum spre tine" :
                 order.vehicleType === "van" ? "Van în drum spre tine" :
                 "Curier pe bicicletă electrică în drum"}
              </Text>
            </View>
          )}

          <Text className="text-sm text-muted">Livrare la: {order.deliveryAddress}</Text>
          <Text className="text-sm text-muted mt-1">Ridicare de la: {order.pickupAddress}</Text>
        </View>

        {/* Delivery Mode Card */}
        <View className="mx-4 mb-4">
          <View
            style={{
              backgroundColor: modeInfo.color + "10",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: modeInfo.color + "40",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
              Mod de Livrare
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 28 }}>{modeInfo.icon}</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: modeInfo.color }}>
                  {modeInfo.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{modeInfo.description}</Text>
              </View>
            </View>

            {/* Vehicle info */}
            {order.vehicleId && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 16 }}>{VEHICLE_ICONS[order.vehicleType || "drone"]}</Text>
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600", marginLeft: 8 }}>
                  Vehicul: {order.vehicleId}
                </Text>
                {order.pilotName && (
                  <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 12 }}>
                    Pilot: {order.pilotName}
                  </Text>
                )}
              </View>
            )}

            {/* Fallback mode */}
            {fallbackInfo && (
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
                  FALLBACK (dacă metoda primară eșuează):
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Text style={{ fontSize: 14 }}>{fallbackInfo.icon}</Text>
                  <Text style={{ fontSize: 12, color: fallbackInfo.color, fontWeight: "600", marginLeft: 6 }}>
                    {fallbackInfo.label}
                  </Text>
                </View>
              </View>
            )}

            {/* Reception type */}
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>PUNCT DE RECEPȚIE:</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 4 }}>
                {RECEPTION_LABELS[order.receptionType] || order.receptionType}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Timeline */}
        <View className="mx-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">Progres Comandă</Text>
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
                      backgroundColor: isCompleted ? colors.primary : colors.border,
                      borderWidth: isCurrent ? 3 : 0,
                      borderColor: colors.primary,
                    }}
                  />
                  {index < TIMELINE_STEPS.length - 1 && (
                    <View
                      style={{
                        width: 2,
                        height: 24,
                        backgroundColor: index < currentStep ? colors.primary : colors.border,
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
          <Text className="text-base font-semibold text-foreground mb-2">Produse</Text>
          {order.items.map((item, idx) => (
            <View key={idx} className="flex-row justify-between py-1.5">
              <Text className="text-sm text-foreground">{item.quantity}x {item.name}</Text>
              {item.weight && <Text className="text-xs text-muted">{item.weight} kg</Text>}
            </View>
          ))}
          <View className="border-t border-border mt-2 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Greutate totală</Text>
              <Text className="text-sm text-foreground">{order.packageWeight} kg</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-sm font-medium text-foreground">Total</Text>
              <Text className="text-sm font-bold text-primary">₱{order.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Interactive Live Tracking Map */}
        {(order.status === "in_execution" || order.status === "accepted") && (
          <View className="mx-4 mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">📍 Urmărire Live</Text>
            <DeliveryMap
              route={createDemoRoute(
                (order.vehicleType || order.deliveryMode || "auto") as VehicleType,
                order.status === "in_execution" ? "in_transit" : "picking_up",
                order.status === "in_execution" ? 0.55 : 0.15
              )}
              height={260}
              showRoute={true}
              showETA={true}
            />
          </View>
        )}

        {/* Canonical Info */}
        <View className="mx-4 mb-4">
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 10, color: colors.muted, lineHeight: 16 }}>
              ℹ️ Metoda de livrare afișată este cea selectată de platformă. Badge-urile din marketplace sunt informative.
              Platforma poate schimba metoda în orice moment (meteo, capacitate, urgență). Fallback-ul se activează automat.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
