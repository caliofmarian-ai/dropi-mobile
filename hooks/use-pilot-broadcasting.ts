/**
 * Pilot Broadcasting Hook — Sprint 7+
 *
 * Connects to /ws/tracking as a pilot and broadcasts GPS position updates
 * using expo-location's watchPositionAsync. Supports start/stop control.
 */
import { useState, useRef, useCallback } from "react";
import { Platform, AppState } from "react-native";
import Constants from "expo-constants";

// Conditionally import expo-location (not available on web in dev)
let Location: any = null;
if (Platform.OS !== "web") {
  try {
    Location = require("expo-location");
  } catch { /* not available */ }
}

export interface BroadcastState {
  isBroadcasting: boolean;
  lastPosition: { lat: number; lng: number; speed: number; heading: number; altitude?: number } | null;
  error: string | null;
  connected: boolean;
  updateCount: number;
}

interface UsePilotBroadcastingOptions {
  deliveryId: number;
  pilotId: number;
  vehicleType?: string;
  dropoffLat?: number;
  dropoffLng?: number;
}

export function usePilotBroadcasting({ deliveryId, pilotId, vehicleType = "drone", dropoffLat, dropoffLng }: UsePilotBroadcastingOptions) {
  const [state, setState] = useState<BroadcastState>({
    isBroadcasting: false,
    lastPosition: null,
    error: null,
    connected: false,
    updateCount: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const locationSubRef = useRef<any>(null);
  const updateCountRef = useRef(0);

  const startBroadcasting = useCallback(async () => {
    if (Platform.OS === "web") {
      setState((s) => ({ ...s, error: "GPS broadcasting requires a native device (iOS/Android)" }));
      return;
    }

    if (!Location) {
      setState((s) => ({ ...s, error: "expo-location not available" }));
      return;
    }

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((s) => ({ ...s, error: "Location permission denied. Enable in Settings." }));
        return;
      }

      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState((s) => ({ ...s, error: "Location services are disabled. Please enable GPS." }));
        return;
      }

      // Connect to WebSocket as pilot (include dropoff for ETA/geofence)
      const apiUrl = Constants.expoConfig?.extra?.apiBaseUrl || "http://127.0.0.1:3000";
      let wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/tracking?role=pilot&deliveryId=${deliveryId}&pilotId=${pilotId}`;
      if (dropoffLat && dropoffLng) {
        wsUrl += `&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((s) => ({ ...s, connected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "error") {
            setState((s) => ({ ...s, error: data.message }));
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        setState((s) => ({ ...s, error: "WebSocket connection error", connected: false }));
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        wsRef.current = null;
      };

      // Start watching position
      const subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // every 3 seconds
          distanceInterval: 5, // or every 5 meters
        },
        (location: any) => {
          const { latitude, longitude, speed, heading, altitude } = location.coords;

          const positionMsg = {
            type: "position",
            lat: latitude,
            lng: longitude,
            speed: speed || 0,
            heading: heading || 0,
            altitude: altitude || undefined,
            vehicleType,
          };

          // Send via WebSocket if connected
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(positionMsg));
          }

          updateCountRef.current++;
          setState((s) => ({
            ...s,
            lastPosition: {
              lat: latitude,
              lng: longitude,
              speed: speed || 0,
              heading: heading || 0,
              altitude: altitude || undefined,
            },
            updateCount: updateCountRef.current,
          }));
        }
      );

      locationSubRef.current = subscriber;
      setState((s) => ({ ...s, isBroadcasting: true, error: null }));
    } catch (e: any) {
      setState((s) => ({ ...s, error: e.message || "Failed to start broadcasting" }));
    }
  }, [deliveryId, pilotId, vehicleType]);

  const stopBroadcasting = useCallback(() => {
    // Stop location subscription
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState((s) => ({
      ...s,
      isBroadcasting: false,
      connected: false,
    }));
  }, []);

  return {
    ...state,
    startBroadcasting,
    stopBroadcasting,
  };
}
