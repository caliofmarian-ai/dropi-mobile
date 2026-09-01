/**
 * Live Tracking Hook
 *
 * Authenticates with the existing DROPi session before receiving a tracking stream.
 * `target` disambiguates marketplace orders from B2B deliveries.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRequiredApiBaseUrl } from "@/constants/oauth";

export type LiveTrackingTarget = "order" | "b2b";

export interface PilotPosition {
  target?: LiveTrackingTarget;
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

export interface ETAInfo {
  seconds: number;
  distanceM: number;
}

export interface GeofenceAlert {
  deliveryId: number;
  pilotId: number;
  distanceM: number;
  etaSeconds: number;
  message: string;
  triggeredAt: string;
}

interface UseLiveTrackingOptions {
  deliveryId: number;
  target?: LiveTrackingTarget;
  enabled?: boolean;
}

const TOKEN_KEY = "@dropi_token";

export function useLiveTracking({ deliveryId, target = "order", enabled = true }: UseLiveTrackingOptions) {
  const [position, setPosition] = useState<PilotPosition | null>(null);
  const [eta, setEta] = useState<ETAInfo | null>(null);
  const [geofenceAlert, setGeofenceAlert] = useState<GeofenceAlert | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const authFailedRef = useRef(false);
  const allowReconnectRef = useRef(true);

  const connect = useCallback(async () => {
    if (!enabled || !deliveryId || wsRef.current) return;

    allowReconnectRef.current = true;
    authFailedRef.current = false;

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        authFailedRef.current = true;
        setConnected(false);
        setError("Authentication required for live tracking.");
        return;
      }

      const apiUrl = getRequiredApiBaseUrl("subscriber tracking websocket");
      const params = new URLSearchParams({
        target,
        deliveryId: String(deliveryId),
      });
      const wsUrl = `${apiUrl.replace(/^http/, "ws")}/ws/tracking?${params.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "authenticate", mode: "subscriber", token }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.type === "authenticated") {
            setConnected(true);
            setError(null);
            attemptRef.current = 0;
          } else if (data.type === "position") {
            setPosition(data.data || data);
            if (data.eta) setEta(data.eta);
          } else if (data.type === "geofence_entered") {
            setGeofenceAlert({
              deliveryId: data.deliveryId,
              pilotId: data.pilotId,
              distanceM: data.distanceM,
              etaSeconds: data.etaSeconds,
              message: data.message,
              triggeredAt: new Date().toISOString(),
            });
          } else if (data.type === "pilot_disconnected") {
            setPosition(null);
            setEta(null);
          } else if (data.type === "delivery_completed" || data.type === "delivery_complete") {
            allowReconnectRef.current = false;
            setPosition(null);
            setEta(null);
            setDeliveryCompleted(true);
            ws.close();
          } else if (data.type === "error") {
            setError(data.message || "Live tracking error");
            if (!connected || ["AUTH_REQUIRED", "AUTH_INVALID", "ACCOUNT_INACTIVE", "FORBIDDEN", "TARGET_NOT_FOUND"].includes(data.code)) {
              authFailedRef.current = true;
              allowReconnectRef.current = false;
            }
          }
        } catch {
          setError("Invalid live tracking response.");
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (enabled && allowReconnectRef.current && !authFailedRef.current) {
          const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
          attemptRef.current++;
          reconnectTimer.current = setTimeout(() => void connect(), delay);
        }
      };

      ws.onerror = () => {
        setError("Connection error");
        ws.close();
      };
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    }
  }, [deliveryId, enabled, target, connected]);

  const disconnect = useCallback(() => {
    allowReconnectRef.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && deliveryId) {
      void connect();
    }
    return () => disconnect();
  }, [deliveryId, target, enabled, connect, disconnect]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && enabled && !wsRef.current) {
        void connect();
      } else if (state === "background") {
        disconnect();
      }
    });
    return () => sub.remove();
  }, [connect, disconnect, enabled]);

  return { position, eta, geofenceAlert, connected, error, deliveryCompleted, disconnect };
}
