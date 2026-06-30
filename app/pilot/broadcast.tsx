/**
 * Pilot Broadcasting Screen — Sprint 7+
 *
 * Allows pilots to start/stop GPS position broadcasting during an active delivery.
 * Shows real-time position data, connection status, and update counter.
 * Includes "Complete Delivery" button that stops broadcasting and notifies customer.
 */
import { useState } from "react";
import { Text, View, Pressable, Platform, Alert } from "react-native";
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
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  const {
    isBroadcasting,
    lastPosition,
    error,
    connected,
    updateCount,
    deliveryCompleted,
    startBroadcasting,
    stopBroadcasting,
    completeDelivery,
  } = usePilotBroadcasting({ deliveryId, pilotId, vehicleType });

  const handleCompleteDelivery = () => {
    if (Platform.OS === "web") {
      // On web, use simple confirmation
      setShowConfirmComplete(true);
    } else {
      Alert.alert(
        "Complete Delivery",
        "Are you sure you want to mark this delivery as completed? This will stop position broadcasting and notify the customer.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Complete",
            style: "default",
            onPress: () => completeDelivery(),
          },
        ]
      );
    }
  };

  const confirmComplete = () => {
    setShowConfirmComplete(false);
    completeDelivery();
  };

  // Delivery completed success screen
  if (deliveryCompleted) {
    return (
      <ScreenContainer className="p-4" edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
          <Text style={{ fontSize: 72 }}>✅</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.success }}>
            Delivery Completed!
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 280 }}>
            Delivery #{deliveryId} has been marked as completed. The customer has been notified.
          </Text>
          <View style={{ marginTop: 24 }}>
            <Pressable
              onPress={() => safeGoBack(router)}
              style={({ pressed }) => [{
                backgroundColor: colors.primary,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 12,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Back to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

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
      <View className="items-center mb-6">
        <Pressable
          onPress={isBroadcasting ? stopBroadcasting : startBroadcasting}
          style={({ pressed }) => [{
            width: 140,
            height: 140,
            borderRadius: 70,
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
          <Text style={{ fontSize: 36 }}>{isBroadcasting ? "⏹" : "📡"}</Text>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, marginTop: 6 }}>
            {isBroadcasting ? "STOP" : "START"}
          </Text>
          <Text style={{ color: "#ffffffCC", fontSize: 10, marginTop: 2 }}>
            Broadcasting
          </Text>
        </Pressable>
      </View>

      {/* Complete Delivery Button — shown only when broadcasting */}
      {isBroadcasting && (
        <View className="items-center mb-6">
          <Pressable
            onPress={handleCompleteDelivery}
            style={({ pressed }) => [{
              backgroundColor: colors.success,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
              opacity: pressed ? 0.85 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              shadowColor: colors.success,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }]}
          >
            <Text style={{ fontSize: 18 }}>🏁</Text>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Complete Delivery</Text>
          </Pressable>
          <Text style={{ fontSize: 10, color: colors.muted, marginTop: 6, textAlign: "center" }}>
            Stops broadcasting and notifies the customer
          </Text>
        </View>
      )}

      {/* Web Confirmation Modal */}
      {showConfirmComplete && (
        <View style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            maxWidth: 320,
            width: "100%",
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Complete Delivery?
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
              This will stop position broadcasting and notify the customer that their delivery has arrived.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setShowConfirmComplete(false)}
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmComplete}
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: colors.success,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Complete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
