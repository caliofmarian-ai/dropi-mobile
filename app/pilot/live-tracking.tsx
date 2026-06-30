/**
 * Live Delivery Tracking Screen — Sprint 7
 *
 * Shows a real-time map with the pilot's position during an active delivery.
 * Connects to /ws/tracking as a subscriber and displays:
 * - Pilot marker on map (updates in real-time) — native only
 * - Speed, heading, altitude info panel
 * - Delivery status indicators
 * - Connection status
 *
 * NOTE: react-native-maps is native-only. On web, we show a text-based position display.
 */
import { useState, useEffect } from "react";
import { Text, View, Pressable, Platform, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useLiveTracking } from "@/hooks/use-live-tracking";

/** Format speed from m/s to km/h */
function formatSpeed(speedMs: number): string {
  return `${(speedMs * 3.6).toFixed(1)} km/h`;
}

/** Format heading to compass direction */
function headingToCompass(heading: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(heading / 45) % 8;
  return dirs[idx];
}

export default function LiveTrackingScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ deliveryId: string }>();
  const deliveryId = parseInt(params.deliveryId || "0");
  const [trail, setTrail] = useState<{ latitude: number; longitude: number }[]>([]);

  const { position, connected, error } = useLiveTracking({
    deliveryId,
    enabled: deliveryId > 0,
  });

  // Update trail when position changes
  useEffect(() => {
    if (position) {
      setTrail((prev) => {
        const newPoint = { latitude: position.lat, longitude: position.lng };
        const updated = [...prev, newPoint];
        return updated.length > 100 ? updated.slice(-100) : updated;
      });
    }
  }, [position]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          >
            <Text className="text-2xl text-primary">←</Text>
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-foreground">Live Tracking</Text>
            <Text className="text-xs text-muted">Delivery #{deliveryId}</Text>
          </View>
        </View>
        {/* Connection indicator */}
        <View className="flex-row items-center gap-2">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connected ? colors.success : colors.error }} />
          <Text style={{ fontSize: 11, color: connected ? colors.success : colors.muted }}>
            {connected ? "LIVE" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Position Display (web-safe — no react-native-maps) */}
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", padding: 20 }}>
        {position ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <Text style={{ fontSize: 56 }}>🛸</Text>
            <Text className="text-lg font-bold text-foreground">Pilot in Flight</Text>

            {/* Position card */}
            <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 16, width: "100%", maxWidth: 320, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.muted }}>LAT</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{position.lat.toFixed(6)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>LNG</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{position.lng.toFixed(6)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.muted }}>SPEED</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>{formatSpeed(position.speed)}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>HEADING</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{position.heading}° {headingToCompass(position.heading)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>ALT</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{position.altitude != null ? `${position.altitude.toFixed(0)}m` : "—"}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.muted }}>VEHICLE</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>{position.vehicleType || "Drone"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>LAST UPDATE</Text>
                  <Text style={{ fontSize: 12, color: colors.foreground }}>{new Date(position.timestamp).toLocaleTimeString()}</Text>
                </View>
              </View>
            </View>

            {/* Trail info */}
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {trail.length} position updates received • Map view on native device
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 56 }}>📡</Text>
            <Text className="text-base font-semibold text-foreground">
              {error ? "Connection Error" : "Waiting for pilot position..."}
            </Text>
            <Text className="text-sm text-muted text-center" style={{ maxWidth: 280 }}>
              {error || "The pilot has not started transmitting yet. Position will appear automatically when the delivery is in execution."}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Info Panel */}
      {position && (
        <View className="px-4 py-3 bg-surface border-t border-border">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 10, color: colors.muted }}>Speed</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{formatSpeed(position.speed)}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>Heading</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{headingToCompass(position.heading)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>Altitude</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{position.altitude != null ? `${position.altitude.toFixed(0)}m` : "—"}</Text>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
