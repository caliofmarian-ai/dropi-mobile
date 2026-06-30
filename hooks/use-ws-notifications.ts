/**
 * WebSocket Notification Hook — Sprint 6B+
 *
 * Connects to /ws/notifications for real-time notification delivery.
 * Automatically reconnects on disconnect with exponential backoff.
 * Updates the notification badge count in real-time.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { Platform, AppState } from "react-native";
import Constants from "expo-constants";

interface WSNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

interface UseWSNotificationsOptions {
  userId: number | null;
  token: string | null;
  isDemo: boolean;
  onNewNotification?: (notification: WSNotification) => void;
  onUnreadCountUpdate?: (count: number) => void;
}

/**
 * Hook that maintains a WebSocket connection for real-time notifications.
 * Automatically reconnects with exponential backoff.
 */
export function useWSNotifications({
  userId,
  token,
  isDemo,
  onNewNotification,
  onUnreadCountUpdate,
}: UseWSNotificationsOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  const getWSUrl = useCallback(() => {
    // Determine the server base URL
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    const serverHost = debuggerHost?.split(":")[0] || "127.0.0.1";
    const serverPort = 3000;
    return `ws://${serverHost}:${serverPort}/ws/notifications?userId=${userId}&token=${token}`;
  }, [userId, token]);

  const connect = useCallback(() => {
    if (!userId || !token || isDemo) return;
    if (Platform.OS === "web") return; // WebSocket works on web too, but skip for now
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = getWSUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log("[WS-NOTIF] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new_notification" && msg.data) {
            onNewNotification?.(msg.data);
          } else if (msg.type === "unread_count" && msg.data) {
            onUnreadCountUpdate?.(msg.data.count);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Reconnect with exponential backoff (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose will fire after this, triggering reconnect
        ws.close();
      };
    } catch (err) {
      console.error("[WS-NOTIF] Connection error:", err);
    }
  }, [userId, token, isDemo, getWSUrl, onNewNotification, onUnreadCountUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect when authenticated, disconnect on logout
  useEffect(() => {
    if (userId && token && !isDemo) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [userId, token, isDemo, connect, disconnect]);

  // Reconnect when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && userId && token && !isDemo) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    });
    return () => subscription.remove();
  }, [userId, token, isDemo, connect]);

  // Acknowledge a notification receipt
  const acknowledge = useCallback((notificationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ack", notificationId }));
    }
  }, []);

  return { isConnected, acknowledge, disconnect };
}
