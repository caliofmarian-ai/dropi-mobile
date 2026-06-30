/**
 * Real-Time Notification WebSocket Server — Sprint 6B+
 *
 * Provides instant notification delivery to connected clients.
 * Users connect via /ws/notifications?userId=<id>&token=<sessionToken>
 * When a new in-app notification is created, it's broadcast instantly to the user.
 *
 * Architecture:
 * - Clients connect with userId and auth token
 * - Server maintains a map of userId -> Set<WebSocket>
 * - When createInAppNotification is called, it also broadcasts via WS
 * - Heartbeat mechanism cleans up stale connections
 * - Supports multiple devices per user (all get the notification)
 */
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";

// Map of userId -> Set of active WebSocket connections
const userConnections = new Map<number, Set<WebSocket>>();

let wssInstance: WebSocketServer | null = null;

/**
 * Initialize WebSocket notification server on the existing HTTP server.
 * Path: /ws/notifications
 */
export function initNotificationWS(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/ws/notifications" });
  wssInstance = wss;

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get("userId") || "0");
    const token = url.searchParams.get("token");

    if (!userId || !token) {
      ws.send(JSON.stringify({ type: "error", message: "userId and token query params required" }));
      ws.close();
      return;
    }

    // Register connection for this user
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(ws);

    ws.send(JSON.stringify({
      type: "connected",
      message: "Notification channel active",
      userId,
    }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // Client can send "ack" to acknowledge receipt
        if (msg.type === "ack" && msg.notificationId) {
          // Could mark as delivered in DB if needed
          console.log(`[ws-notif] User ${userId} acknowledged notification ${msg.notificationId}`);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });

    ws.on("error", () => {
      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });

    // Heartbeat ping every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    ws.on("close", () => clearInterval(pingInterval));
  });

  console.log("[ws] Notification WebSocket initialized at /ws/notifications");
}

/**
 * Broadcast a notification to a specific user via WebSocket.
 * Called from createInAppNotification after DB insert.
 * Returns true if at least one connection received the message.
 */
export function broadcastNotificationToUser(userId: number, notification: {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}): boolean {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return false;

  const payload = JSON.stringify({
    type: "new_notification",
    data: notification,
  });

  let sent = 0;
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[ws-notif] Broadcast to user ${userId} on ${sent} device(s)`);
  }
  return sent > 0;
}

/**
 * Broadcast unread count update to a user (after mark as read, etc.)
 */
export function broadcastUnreadCountToUser(userId: number, unreadCount: number): void {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return;

  const payload = JSON.stringify({
    type: "unread_count",
    data: { count: unreadCount },
  });

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

/**
 * Get notification WebSocket stats (for admin/monitoring).
 */
export function getNotificationWSStats() {
  let totalConnections = 0;
  userConnections.forEach((conns) => {
    totalConnections += conns.size;
  });

  return {
    connectedUsers: userConnections.size,
    totalConnections,
    serverActive: wssInstance !== null,
  };
}
