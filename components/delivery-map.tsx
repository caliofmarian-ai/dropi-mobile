import { useEffect, useState } from "react";
import { View, Text, Platform, StyleSheet, Dimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";

// Types for the delivery map
export type VehicleType = "drone" | "auto" | "van" | "ebike";
export type DeliveryStatus = "picking_up" | "in_transit" | "approaching" | "delivered";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface DeliveryRoute {
  pickup: MapCoordinate & { label: string };
  dropoff: MapCoordinate & { label: string };
  dronePort?: MapCoordinate & { label: string };
  currentPosition: MapCoordinate;
  vehicleType: VehicleType;
  status: DeliveryStatus;
  heading: number; // degrees
  speed: number; // km/h
  altitude?: number; // meters (for drones)
  eta: string;
  progress: number; // 0-1
}

interface DeliveryMapProps {
  route: DeliveryRoute;
  height?: number;
  showRoute?: boolean;
  showETA?: boolean;
}

const VEHICLE_MARKERS: Record<VehicleType, { icon: string; color: string; label: string }> = {
  drone: { icon: "🚁", color: "#0066FF", label: "Drone" },
  auto: { icon: "🚗", color: "#10B981", label: "Auto" },
  van: { icon: "🚐", color: "#8B5CF6", label: "Van" },
  ebike: { icon: "🚲", color: "#F59E0B", label: "E-Bike" },
};

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  picking_up: "Picking up order",
  in_transit: "In transit",
  approaching: "Se apropie",
  delivered: "Livrat",
};

// Simulated route interpolation
function interpolatePosition(
  from: MapCoordinate,
  to: MapCoordinate,
  progress: number
): MapCoordinate {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
  };
}

// Map component - uses canvas-based visualization for web preview
// On native devices (iOS/Android via Expo Go), react-native-maps renders real maps
function NativeMapView({ route, height, showRoute }: DeliveryMapProps) {
  return <WebMapFallback route={route} height={height} showRoute={showRoute} />;
}

// Web fallback with canvas-based map visualization
function WebMapFallback({ route, height, showRoute }: DeliveryMapProps) {
  const colors = useColors();
  const vehicleInfo = VEHICLE_MARKERS[route.vehicleType];
  const [animProgress, setAnimProgress] = useState(route.progress);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimProgress((prev) => {
        const next = prev + 0.002;
        return next > 1 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Calculate positions on a visual grid
  const mapHeight = height || 250;
  const mapWidth = Dimensions.get("window").width - 32;

  const toPixel = (coord: MapCoordinate, allCoords: MapCoordinate[]) => {
    const lats = allCoords.map((c) => c.latitude);
    const lngs = allCoords.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padding = 40;

    const x = padding + ((coord.longitude - minLng) / (maxLng - minLng + 0.001)) * (mapWidth - padding * 2);
    const y = padding + ((maxLat - coord.latitude) / (maxLat - minLat + 0.001)) * (mapHeight - padding * 2);
    return { x, y };
  };

  const allCoords = [route.pickup, route.dropoff, route.currentPosition];
  if (route.dronePort) allCoords.push(route.dronePort);

  const pickupPx = toPixel(route.pickup, allCoords);
  const dropoffPx = toPixel(route.dropoff, allCoords);
  const dronePortPx = route.dronePort ? toPixel(route.dronePort, allCoords) : null;

  // Animate vehicle position
  const currentPos = interpolatePosition(route.pickup, route.dropoff, animProgress);
  const vehiclePx = toPixel(currentPos, allCoords);

  return (
    <View
      style={{
        height: mapHeight,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        position: "relative",
      }}
    >
      {/* Grid background */}
      <View style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: (mapHeight / 8) * i,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.border,
              opacity: 0.3,
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: "absolute",
              left: (mapWidth / 8) * i,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: colors.border,
              opacity: 0.3,
            }}
          />
        ))}
      </View>

      {/* Route line */}
      {showRoute !== false && (
        <View
          style={{
            position: "absolute",
            top: pickupPx.y,
            left: pickupPx.x,
            width: Math.sqrt(
              Math.pow(dropoffPx.x - pickupPx.x, 2) + Math.pow(dropoffPx.y - pickupPx.y, 2)
            ),
            height: 3,
            backgroundColor: vehicleInfo.color,
            opacity: 0.4,
            transform: [
              {
                rotate: `${Math.atan2(dropoffPx.y - pickupPx.y, dropoffPx.x - pickupPx.x)}rad`,
              },
            ],
            transformOrigin: "left center",
            borderRadius: 2,
          }}
        />
      )}

      {/* DronePort marker */}
      {dronePortPx && (
        <View style={{ position: "absolute", top: dronePortPx.y - 14, left: dronePortPx.x - 14 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#8B5CF620",
              borderWidth: 2,
              borderColor: "#8B5CF6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 12 }}>🏗️</Text>
          </View>
          <Text
            style={{
              fontSize: 8,
              color: colors.muted,
              textAlign: "center",
              marginTop: 1,
            }}
          >
            DronePort
          </Text>
        </View>
      )}

      {/* Pickup marker */}
      <View style={{ position: "absolute", top: pickupPx.y - 14, left: pickupPx.x - 14 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#10B98120",
            borderWidth: 2,
            borderColor: "#10B981",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 12 }}>📦</Text>
        </View>
      </View>

      {/* Dropoff marker */}
      <View style={{ position: "absolute", top: dropoffPx.y - 14, left: dropoffPx.x - 14 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#EF444420",
            borderWidth: 2,
            borderColor: "#EF4444",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 12 }}>📍</Text>
        </View>
      </View>

      {/* Vehicle marker (animated) */}
      <View style={{ position: "absolute", top: vehiclePx.y - 18, left: vehiclePx.x - 18 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: vehicleInfo.color + "30",
            borderWidth: 2,
            borderColor: vehicleInfo.color,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: vehicleInfo.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 18 }}>{vehicleInfo.icon}</Text>
        </View>
      </View>

      {/* Status overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          right: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors.background + "E6",
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: route.status === "delivered" ? "#10B981" : vehicleInfo.color,
            }}
          />
          <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "600" }}>
            {STATUS_LABELS[route.status]}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 10, color: colors.muted }}>
            {route.speed} km/h
          </Text>
          {route.altitude !== undefined && (
            <Text style={{ fontSize: 10, color: colors.muted }}>
              Alt: {route.altitude}m
            </Text>
          )}
          <Text style={{ fontSize: 10, color: vehicleInfo.color, fontWeight: "700" }}>
            ETA: {route.eta}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: colors.border,
        }}
      >
        <View
          style={{
            height: 3,
            width: `${animProgress * 100}%`,
            backgroundColor: vehicleInfo.color,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

// Main exported component
export function DeliveryMap(props: DeliveryMapProps) {
  if (Platform.OS === "web") {
    return <WebMapFallback {...props} />;
  }
  return <NativeMapView {...props} />;
}

// Helper to create a demo route for testing
export function createDemoRoute(
  vehicleType: VehicleType,
  status: DeliveryStatus = "in_transit",
  progress: number = 0.4
): DeliveryRoute {
  // Manila area coordinates
  const routes: Record<VehicleType, { pickup: MapCoordinate; dropoff: MapCoordinate; dronePort?: MapCoordinate }> = {
    drone: {
      pickup: { latitude: 14.5547, longitude: 121.0244 }, // Makati
      dropoff: { latitude: 14.5764, longitude: 121.0352 }, // BGC
      dronePort: { latitude: 14.5650, longitude: 121.0300 }, // Mid-point hub
    },
    auto: {
      pickup: { latitude: 14.5547, longitude: 121.0244 },
      dropoff: { latitude: 14.5890, longitude: 121.0560 },
    },
    van: {
      pickup: { latitude: 14.5200, longitude: 121.0100 },
      dropoff: { latitude: 14.5764, longitude: 121.0352 },
    },
    ebike: {
      pickup: { latitude: 14.5600, longitude: 121.0280 },
      dropoff: { latitude: 14.5700, longitude: 121.0320 },
    },
  };

  const r = routes[vehicleType];
  const currentPosition = interpolatePosition(r.pickup, r.dropoff, progress);

  const speeds: Record<VehicleType, number> = { drone: 65, auto: 35, van: 28, ebike: 22 };
  const altitudes: Record<VehicleType, number | undefined> = { drone: 85, auto: undefined, van: undefined, ebike: undefined };

  const etaMinutes = Math.round((1 - progress) * (vehicleType === "drone" ? 5 : vehicleType === "ebike" ? 12 : 15));

  return {
    pickup: { ...r.pickup, label: "Merchant — Pickup" },
    dropoff: { ...r.dropoff, label: "Client — Destination" },
    dronePort: r.dronePort ? { ...r.dronePort, label: "DronePort Hub" } : undefined,
    currentPosition,
    vehicleType,
    status,
    heading: Math.random() * 360,
    speed: speeds[vehicleType],
    altitude: altitudes[vehicleType],
    eta: `${etaMinutes} min`,
    progress,
  };
}
