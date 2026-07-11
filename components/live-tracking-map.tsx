/**
 * LiveTrackingMap Component — Sprint E++
 *
 * Connects to the WebSocket live tracking server and displays
 * real-time pilot position updates on a visual map representation.
 * Supports both subscriber (customer/merchant) and pilot modes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { getRequiredApiBaseUrl } from "@/constants/oauth";

interface PositionData {
  deliveryId: number;
  pilotId: number;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  altitude?: number;
  vehicleType: string;
  timestamp: string;
}

interface LiveTrackingMapProps {
  deliveryId: number;
  role: "subscriber" | "pilot";
  pilotId?: number;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  onPositionUpdate?: (position: PositionData) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const VEHICLE_ICONS: Record<string, string> = {
  drone: "🚁",
  auto: "🚗",
  van: "🚐",
  ebike: "🛵",
  default: "📍",
};

export function LiveTrackingMap({
  deliveryId,
  role,
  pilotId,
  pickupLat = 44.4268,
  pickupLng = 26.1025,
  deliveryLat = 44.4368,
  deliveryLng = 26.1125,
  onPositionUpdate,
  onConnectionChange,
}: LiveTrackingMapProps) {
  const [connected, setConnected] = useState(false);
  const [position, setPosition] = useState<PositionData | null>(null);
  const [status, setStatus] = useState<string>("Connecting...");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated position for smooth movement
  const posX = useSharedValue(50);
  const posY = useSharedValue(50);

  const animatedPilotStyle = useAnimatedStyle(() => ({
    left: `${posX.value}%` as any,
    top: `${posY.value}%` as any,
  }));

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const baseUrl = Platform.OS === "web"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
      : getRequiredApiBaseUrl("live tracking map websocket").replace(/^http/, "ws");

    const params = new URLSearchParams({
      role,
      deliveryId: String(deliveryId),
      ...(pilotId ? { pilotId: String(pilotId) } : {}),
    });

    const ws = new WebSocket(`${baseUrl}/ws/tracking?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus("Connected");
      onConnectionChange?.(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "position" && msg.data) {
          setPosition(msg.data);
          onPositionUpdate?.(msg.data);

          // Calculate relative position on map (simplified linear interpolation)
          const progress = calculateProgress(
            msg.data.lat, msg.data.lng,
            pickupLat, pickupLng,
            deliveryLat, deliveryLng
          );
          posX.value = withTiming(15 + progress * 70, { duration: 800 });
          posY.value = withTiming(70 - progress * 50, { duration: 800 });
        } else if (msg.type === "waiting") {
          setStatus("Waiting for pilot...");
        } else if (msg.type === "pilot_disconnected") {
          setStatus("Pilot disconnected");
        } else if (msg.type === "connected") {
          setStatus("Tracking active");
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      onConnectionChange?.(false);
      setStatus("Disconnected");
      // Auto-reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setStatus("Connection error");
    };
  }, [deliveryId, role, pilotId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // For pilot mode: send position updates
  const sendPosition = useCallback((lat: number, lng: number, heading: number, speed: number, vehicleType: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "position",
        lat, lng, heading, speed, vehicleType,
      }));
    }
  }, []);

  const vehicleIcon = VEHICLE_ICONS[position?.vehicleType || "default"] || VEHICLE_ICONS.default;

  return (
    <View className="bg-surface border border-border rounded-xl overflow-hidden" style={{ height: 220 }}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {/* Grid lines for visual reference */}
        <View style={[styles.gridLine, { top: "25%", left: 0, right: 0, height: 1 }]} />
        <View style={[styles.gridLine, { top: "50%", left: 0, right: 0, height: 1 }]} />
        <View style={[styles.gridLine, { top: "75%", left: 0, right: 0, height: 1 }]} />
        <View style={[styles.gridLine, { left: "25%", top: 0, bottom: 0, width: 1 }]} />
        <View style={[styles.gridLine, { left: "50%", top: 0, bottom: 0, width: 1 }]} />
        <View style={[styles.gridLine, { left: "75%", top: 0, bottom: 0, width: 1 }]} />

        {/* Route line (simplified) */}
        <View style={styles.routeLine} />

        {/* Pickup marker */}
        <View style={[styles.marker, { left: "10%", bottom: "20%" }]}>
          <Text style={{ fontSize: 16 }}>📦</Text>
          <Text style={styles.markerLabel}>Pickup</Text>
        </View>

        {/* Delivery marker */}
        <View style={[styles.marker, { right: "10%", top: "15%" }]}>
          <Text style={{ fontSize: 16 }}>🏠</Text>
          <Text style={styles.markerLabel}>Delivery</Text>
        </View>

        {/* Pilot position (animated) */}
        {position && (
          <Animated.View style={[styles.pilotMarker, animatedPilotStyle]}>
            <Text style={{ fontSize: 22 }}>{vehicleIcon}</Text>
          </Animated.View>
        )}
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View className="flex-row items-center">
          <View style={[styles.statusDot, { backgroundColor: connected ? "#22C55E" : "#EF4444" }]} />
          <Text className="text-xs text-muted ml-1">{status}</Text>
        </View>
        {position && (
          <View className="flex-row items-center gap-3">
            <Text className="text-xs text-muted">
              {position.speed.toFixed(0)} km/h
            </Text>
            {position.altitude !== undefined && (
              <Text className="text-xs text-muted">
                {position.altitude.toFixed(0)}m alt
              </Text>
            )}
            <Text className="text-xs text-muted">
              {new Date(position.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Calculate delivery progress (0-1) based on current position between pickup and delivery */
function calculateProgress(
  currentLat: number, currentLng: number,
  pickupLat: number, pickupLng: number,
  deliveryLat: number, deliveryLng: number
): number {
  const totalDist = Math.sqrt(
    Math.pow(deliveryLat - pickupLat, 2) + Math.pow(deliveryLng - pickupLng, 2)
  );
  if (totalDist === 0) return 0;

  const currentDist = Math.sqrt(
    Math.pow(currentLat - pickupLat, 2) + Math.pow(currentLng - pickupLng, 2)
  );

  return Math.min(1, Math.max(0, currentDist / totalDist));
}

// Export sendPosition for pilot usage
export { PositionData };

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "#E5E7EB",
  },
  routeLine: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "45%",
    height: 3,
    backgroundColor: "#0a7ea4",
    borderRadius: 2,
    opacity: 0.5,
    transform: [{ rotate: "-25deg" }],
  },
  marker: {
    position: "absolute",
    alignItems: "center",
  },
  markerLabel: {
    fontSize: 9,
    color: "#687076",
    marginTop: 2,
    fontWeight: "600",
  },
  pilotMarker: {
    position: "absolute",
    marginLeft: -14,
    marginTop: -14,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
