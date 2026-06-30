/**
 * Pilot Broadcasting Screen — Sprint 7+
 *
 * Allows pilots to start/stop GPS position broadcasting during an active delivery.
 * Shows real-time position data, connection status, and update counter.
 */
import { Text, View, Pressable, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { usePilotBroadcasting } from "@/hooks/use-pilot-broadcasting";
import { safeGoBack } from "@/lib/safe-back";

export default function PilotBroadcastScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ deliveryId: string; pilotId: string; vehicleType: string }>();
  const deliveryId = parseInt(params.deliveryId || "1");
  const pilotId = parseInt(params.pilotId || "1");
  const vehicleType = params.vehicleType || "drone";

  const {
    isBroadcasting,
    lastPosition,
    error,
    connected,
    updateCount,
    startBroadcasting,
    stopBroadcasting,
  } = usePilotBroadcasting({ deliveryId, pilotId, vehicleType });

  return (
    <ScreenContainer className="p-4" edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <Pressable
          onPress={() => safeGoBack(router)}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
        >
          <Text className="text-2xl text-primary">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Position Broadcasting</Text>
          <Text className="text-xs text-muted">Delivery #{deliveryId} • {vehicleType.toUpperCase()}</Text>
        </View>
        {/* Status dot */}
        <View className="flex-row items-center gap-2">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isBroadcasting ? colors.success : colors.muted }} />
          <Text style={{ fontSize: 11, color: isBroadcasting ? colors.success : colors.muted, fontWeight: "600" }}>
            {isBroadcasting ? "LIVE" : "OFF"}
          </Text>
        </View>
      </View>

      {/* Main Control Button */}
      <View className="items-center mb-8">
        <Pressable
          onPress={isBroadcasting ? stopBroadcasting : startBroadcasting}
          style={({ pressed }) => [{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: isBroadcasting ? colors.error : colors.success,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
            shadowColor: isBroadcasting ? colors.error : colors.success,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }]}
        >
          <Text style={{ fontSize: 40 }}>{isBroadcasting ? "⏹" : "📡"}</Text>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, marginTop: 8 }}>
            {isBroadcasting ? "STOP" : "START"}
          </Text>
          <Text style={{ color: "#ffffffCC", fontSize: 10, marginTop: 2 }}>
            {isBroadcasting ? "Broadcasting" : "Broadcasting"}
          </Text>
        </Pressable>
      </View>

      {/* Connection Status */}
      <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm text-muted">WebSocket</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: connected ? colors.success : colors.error }}>
            {connected ? "Connected" : "Disconnected"}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm text-muted">Updates Sent</Text>
          <Text className="text-sm font-semibold text-foreground">{updateCount}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted">Platform</Text>
          <Text className="text-sm font-semibold text-foreground">{Platform.OS}</Text>
        </View>
      </View>

      {/* Position Data */}
      {lastPosition && (
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">Current Position</Text>
          <View className="flex-row justify-between mb-2">
            <View>
              <Text style={{ fontSize: 10, color: colors.muted }}>LAT</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{lastPosition.lat.toFixed(6)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>LNG</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{lastPosition.lng.toFixed(6)}</Text>
            </View>
          </View>
          <View className="flex-row justify-between mt-2">
            <View>
              <Text style={{ fontSize: 10, color: colors.muted }}>SPEED</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{(lastPosition.speed * 3.6).toFixed(1)} km/h</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>HEADING</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{lastPosition.heading.toFixed(0)}°</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>ALT</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                {lastPosition.altitude != null ? `${lastPosition.altitude.toFixed(0)}m` : "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={{ backgroundColor: colors.error + "15", borderWidth: 1, borderColor: colors.error, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>{error}</Text>
        </View>
      )}

      {/* Info */}
      {!isBroadcasting && !error && (
        <View className="items-center mt-4">
          <Text className="text-xs text-muted text-center" style={{ maxWidth: 280 }}>
            {Platform.OS === "web"
              ? "GPS broadcasting requires a native device. Test on iOS/Android via Expo Go."
              : "Tap START to begin broadcasting your GPS position to delivery subscribers."}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
