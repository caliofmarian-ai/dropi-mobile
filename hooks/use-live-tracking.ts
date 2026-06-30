/**
 * Live Tracking Hook — Sprint 7
 *
 * Connects to the /ws/tracking WebSocket as a subscriber to receive
 * real-time pilot position updates for a specific delivery.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import Constants from "expo-constants";

export interface PilotPosition {
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

interface UseLiveTrackingOptions {
  deliveryId: number;
  enabled?: boolean;
}

export function useLiveTracking({ deliveryId, enabled = true }: UseLiveTrackingOptions) {
  const [position, setPosition] = useState<PilotPosition | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !deliveryId) return;

    // Build WS URL from API base
    const apiUrl = Constants.expoConfig?.extra?.apiBaseUrl || "http://127.0.0.1:3000";
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/tracking?role=subscriber&deliveryId=${deliveryId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "position") {
            setPosition(data);
          } else if (data.type === "delivery_complete") {
            setPosition(null);
            ws.close();
          } else if (data.type === "error") {
            setError(data.message);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Exponential backoff reconnect
        if (enabled) {
          const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
          attemptRef.current++;
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setError("Connection error");
        ws.close();
      };
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    }
  }, [deliveryId, enabled]);

  const disconnect = useCallback(() => {
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
      connect();
    }
    return () => disconnect();
  }, [deliveryId, enabled, connect, disconnect]);

  // Pause/resume on app state change
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && enabled && !wsRef.current) {
        connect();
      } else if (state === "background") {
        disconnect();
      }
    });
    return () => sub.remove();
  }, [connect, disconnect, enabled]);

  return { position, connected, error, disconnect };
}
