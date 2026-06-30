/**
 * Live Delivery Tracking Screen — Sprint 7
 *
 * Shows a real-time map with the pilot's position during an active delivery.
 * Connects to /ws/tracking as a subscriber and displays:
 * - Pilot marker on map (updates in real-time)
 * - Speed, heading, altitude info
 * - Delivery status indicators
 * - Connection status
 */
import { useState, useEffect, useRef } from "react";
import { Text, View, Pressable, Platform, StyleSheet, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useLiveTracking, PilotPosition } from "@/hooks/use-live-tracking";

// Conditionally import MapView for native only
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  } catch { /* not available */ }
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const mapRef = useRef<any>(null);
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
        // Keep last 100 points for trail
        const updated = [...prev, newPoint];
        return updated.length > 100 ? updated.slice(-100) : updated;
      });

      // Animate map to new position
      if (mapRef.current && Platform.OS !== "web") {
        mapRef.current.animateToRegion({
          latitude: position.lat,
          longitude: position.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    }
  }, [position]);

  // Default center (Bucharest) if no position yet
  const defaultRegion = {
    latitude: position?.lat ?? 44.4268,
    longitude: position?.lng ?? 26.1025,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

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

      {/* Map Area */}
      <View style={{ flex: 1 }}>
        {Platform.OS !== "web" && MapView ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={defaultRegion}
            showsUserLocation={false}
            showsCompass={true}
            showsScale={true}
          >
            {/* Pilot Marker */}
            {position && (
              <Marker
                coordinate={{ latitude: position.lat, longitude: position.lng }}
                title={`Pilot #${position.pilotId}`}
                description={`${formatSpeed(position.speed)} • ${headingToCompass(position.heading)}`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.droneMarker, { backgroundColor: colors.primary }]}>
                  <Text style={styles.droneIcon}>🛸</Text>
                </View>
              </Marker>
            )}

            {/* Flight trail */}
            {trail.length > 1 && Polyline && (
              <Polyline
                coordinates={trail}
                strokeColor={colors.primary}
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        ) : (
          /* Web fallback — text-based position display */
          <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", padding: 20 }}>
            {position ? (
              <View className="items-center gap-4">
                <Text style={{ fontSize: 48 }}>🛸</Text>
                <Text className="text-lg font-bold text-foreground">Pilot Position</Text>
                <View className="bg-background rounded-xl p-4 w-full" style={{ maxWidth: 300 }}>
                  <Text className="text-sm text-muted mb-1">Latitude: <Text className="text-foreground font-semibold">{position.lat.toFixed(6)}</Text></Text>
                  <Text className="text-sm text-muted mb-1">Longitude: <Text className="text-foreground font-semibold">{position.lng.toFixed(6)}</Text></Text>
                  <Text className="text-sm text-muted mb-1">Speed: <Text className="text-foreground font-semibold">{formatSpeed(position.speed)}</Text></Text>
                  <Text className="text-sm text-muted mb-1">Heading: <Text className="text-foreground font-semibold">{position.heading}° ({headingToCompass(position.heading)})</Text></Text>
                  {position.altitude != null && (
                    <Text className="text-sm text-muted">Altitude: <Text className="text-foreground font-semibold">{position.altitude.toFixed(1)}m</Text></Text>
                  )}
                </View>
                <Text className="text-xs text-muted">Map view available on native device</Text>
              </View>
            ) : (
              <View className="items-center gap-3">
                <Text style={{ fontSize: 48 }}>📡</Text>
                <Text className="text-base font-semibold text-foreground">
                  {error ? "Connection Error" : "Waiting for pilot position..."}
                </Text>
                <Text className="text-sm text-muted text-center">
                  {error || "The pilot has not started transmitting yet. Position will appear automatically."}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom Info Panel */}
      {position && (
        <View className="px-4 py-3 bg-surface border-t border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-muted">Speed</Text>
              <Text className="text-base font-bold text-foreground">{formatSpeed(position.speed)}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-muted">Heading</Text>
              <Text className="text-base font-bold text-foreground">{headingToCompass(position.heading)} ({position.heading}°)</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">Altitude</Text>
              <Text className="text-base font-bold text-foreground">{position.altitude != null ? `${position.altitude.toFixed(0)}m` : "—"}</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-xs text-muted">Vehicle</Text>
              <Text className="text-sm font-semibold text-foreground">{position.vehicleType || "Drone"}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">Last Update</Text>
              <Text className="text-xs text-foreground">
                {new Date(position.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  droneMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  droneIcon: {
    fontSize: 20,
  },
});
