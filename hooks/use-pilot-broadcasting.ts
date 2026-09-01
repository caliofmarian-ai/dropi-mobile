/**
 * Pilot Broadcasting Hook
 *
 * The pilot authenticates with the existing DROPi session. Pilot identity is
 * derived server-side and is never supplied as a route/query parameter.
 */
import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRequiredApiBaseUrl } from "@/constants/oauth";

let Location: any = null;
if (Platform.OS !== "web") {
  try {
    Location = require("expo-location");
  } catch { /* not available */ }
}

export type PilotTrackingTarget = "order" | "b2b";

export interface BroadcastState {
  isBroadcasting: boolean;
  lastPosition: { lat: number; lng: number; speed: number; heading: number; altitude?: number } | null;
  error: string | null;
  connected: boolean;
  updateCount: number;
  deliveryCompleted: boolean;
}

interface UsePilotBroadcastingOptions {
  deliveryId: number;
  target?: PilotTrackingTarget;
  vehicleType?: string;
  dropoffLat?: number;
  dropoffLng?: number;
}

const TOKEN_KEY = "@dropi_token";

export function usePilotBroadcasting({
  deliveryId,
  target = "b2b",
  vehicleType = "drone",
  dropoffLat,
  dropoffLng,
}: UsePilotBroadcastingOptions) {
  const [state, setState] = useState<BroadcastState>({
    isBroadcasting: false,
    lastPosition: null,
    error: null,
    connected: false,
    updateCount: 0,
    deliveryCompleted: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const locationSubRef = useRef<any>(null);
  const updateCountRef = useRef(0);

  const stopLocationWatch = useCallback(() => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }, []);

  const startBroadcasting = useCallback(async () => {
    if (!Number.isSafeInteger(deliveryId) || deliveryId <= 0) {
      setState((s) => ({ ...s, error: "A valid assigned delivery is required for broadcasting." }));
      return;
    }
    if (Platform.OS === "web") {
      setState((s) => ({ ...s, error: "GPS broadcasting requires a native device (iOS/Android)" }));
      return;
    }
    if (!Location) {
      setState((s) => ({ ...s, error: "expo-location not available" }));
      return;
    }

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setState((s) => ({ ...s, error: "Authentication required for live tracking." }));
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((s) => ({ ...s, error: "Location permission denied. Enable in Settings." }));
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState((s) => ({ ...s, error: "Location services are disabled. Please enable GPS." }));
        return;
      }

      const apiUrl = getRequiredApiBaseUrl("pilot tracking websocket");
      const params = new URLSearchParams({
        target,
        deliveryId: String(deliveryId),
      });
      if (dropoffLat != null && dropoffLng != null) {
        params.set("dropoffLat", String(dropoffLat));
        params.set("dropoffLng", String(dropoffLng));
      }

      const wsUrl = `${apiUrl.replace(/^http/, "ws")}/ws/tracking?${params.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "authenticate", mode: "pilot", token }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.type === "authenticated") {
            setState((s) => ({ ...s, connected: true, error: null }));

            if (!locationSubRef.current) {
              const subscriber = await Location.watchPositionAsync(
                {
                  accuracy: Location.Accuracy.High,
                  timeInterval: 3000,
                  distanceInterval: 5,
                },
                (location: any) => {
                  const { latitude, longitude, speed, heading, altitude } = location.coords;
                  const positionMsg = {
                    type: "position",
                    lat: latitude,
                    lng: longitude,
                    speed: speed || 0,
                    heading: heading || 0,
                    altitude: altitude ?? undefined,
                    vehicleType,
                  };

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
                      altitude: altitude ?? undefined,
                    },
                    updateCount: updateCountRef.current,
                  }));
                },
              );
              locationSubRef.current = subscriber;
              setState((s) => ({ ...s, isBroadcasting: true, error: null }));
            }
          } else if (data.type === "error") {
            setState((s) => ({ ...s, error: data.message || "Live tracking authorization failed." }));
            if (["AUTH_REQUIRED", "AUTH_INVALID", "ACCOUNT_INACTIVE", "FORBIDDEN", "PILOT_NOT_VERIFIED", "TARGET_NOT_FOUND"].includes(data.code)) {
              stopLocationWatch();
              ws.close();
            }
          } else if (data.type === "completion_confirmed") {
            stopLocationWatch();
            setState((s) => ({ ...s, deliveryCompleted: true, isBroadcasting: false, connected: false }));
          }
        } catch {
          setState((s) => ({ ...s, error: "Invalid live tracking response." }));
        }
      };

      ws.onerror = () => {
        stopLocationWatch();
        setState((s) => ({ ...s, error: "WebSocket connection error", connected: false, isBroadcasting: false }));
      };

      ws.onclose = () => {
        stopLocationWatch();
        setState((s) => ({ ...s, connected: false, isBroadcasting: false }));
        wsRef.current = null;
      };
    } catch (e: any) {
      stopLocationWatch();
      setState((s) => ({ ...s, error: e.message || "Failed to start broadcasting", connected: false, isBroadcasting: false }));
    }
  }, [deliveryId, target, vehicleType, dropoffLat, dropoffLng, stopLocationWatch]);

  const stopBroadcasting = useCallback(() => {
    stopLocationWatch();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState((s) => ({ ...s, isBroadcasting: false, connected: false }));
  }, [stopLocationWatch]);

  const completeDelivery = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "delivery_complete" }));
    }
    stopLocationWatch();
  }, [stopLocationWatch]);

  return {
    ...state,
    startBroadcasting,
    stopBroadcasting,
    completeDelivery,
  };
}
