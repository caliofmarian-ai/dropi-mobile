/**
 * Live Tracking WebSocket Server — Sprint E++
 *
 * Provides real-time pilot position broadcasting for delivery tracking.
 * Uses native Node.js WebSocket via the 'ws' library (already available via express).
 *
 * Architecture:
 * - Pilots send position updates via WS message: { type: "position", deliveryId, lat, lng, heading, speed, altitude? }
 * - Subscribers (merchants, customers) connect and subscribe to a deliveryId
 * - Server broadcasts position updates to all subscribers of that delivery
 * - Heartbeat mechanism ensures stale connections are cleaned up
 */
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";

interface PositionUpdate {
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

interface TrackedDelivery {
  lastPosition: PositionUpdate;
  subscribers: Set<WebSocket>;
}

// In-memory tracking state
const activeDeliveries = new Map<number, TrackedDelivery>();
const pilotConnections = new Map<WebSocket, { pilotId: number; deliveryId: number }>();

/**
 * Initialize WebSocket server on the existing HTTP server.
 * Path: /ws/tracking
 */
export function initLiveTracking(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/ws/tracking" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const role = url.searchParams.get("role"); // "pilot" or "subscriber"
    const deliveryId = parseInt(url.searchParams.get("deliveryId") || "0");

    if (!deliveryId) {
      ws.send(JSON.stringify({ type: "error", message: "deliveryId query param required" }));
      ws.close();
      return;
    }

    if (role === "subscriber") {
      // Subscribe to position updates for a delivery
      if (!activeDeliveries.has(deliveryId)) {
        activeDeliveries.set(deliveryId, { lastPosition: null as any, subscribers: new Set() });
      }
      const delivery = activeDeliveries.get(deliveryId)!;
      delivery.subscribers.add(ws);

      // Send last known position immediately if available
      if (delivery.lastPosition) {
        ws.send(JSON.stringify({ type: "position", data: delivery.lastPosition }));
      } else {
        ws.send(JSON.stringify({ type: "waiting", message: "Waiting for pilot position..." }));
      }

      ws.on("close", () => {
        delivery.subscribers.delete(ws);
        // Clean up empty deliveries
        if (delivery.subscribers.size === 0 && !hasPilotForDelivery(deliveryId)) {
          activeDeliveries.delete(deliveryId);
        }
      });
    } else if (role === "pilot") {
      const pilotId = parseInt(url.searchParams.get("pilotId") || "0");
      if (!pilotId) {
        ws.send(JSON.stringify({ type: "error", message: "pilotId query param required for pilots" }));
        ws.close();
        return;
      }

      pilotConnections.set(ws, { pilotId, deliveryId });

      if (!activeDeliveries.has(deliveryId)) {
        activeDeliveries.set(deliveryId, { lastPosition: null as any, subscribers: new Set() });
      }

      ws.send(JSON.stringify({ type: "connected", message: "Pilot tracking active", deliveryId }));

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === "position") {
            const position: PositionUpdate = {
              deliveryId,
              pilotId,
              lat: msg.lat,
              lng: msg.lng,
              heading: msg.heading || 0,
              speed: msg.speed || 0,
              altitude: msg.altitude,
              vehicleType: msg.vehicleType || "auto",
              timestamp: new Date().toISOString(),
            };

            const delivery = activeDeliveries.get(deliveryId);
            if (delivery) {
              delivery.lastPosition = position;
              // Broadcast to all subscribers
              const payload = JSON.stringify({ type: "position", data: position });
              delivery.subscribers.forEach((sub) => {
                if (sub.readyState === WebSocket.OPEN) {
                  sub.send(payload);
                }
              });
            }
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        pilotConnections.delete(ws);
        const delivery = activeDeliveries.get(deliveryId);
        if (delivery) {
          // Notify subscribers that pilot disconnected
          const payload = JSON.stringify({ type: "pilot_disconnected", deliveryId });
          delivery.subscribers.forEach((sub) => {
            if (sub.readyState === WebSocket.OPEN) {
              sub.send(payload);
            }
          });
          // Clean up if no subscribers
          if (delivery.subscribers.size === 0) {
            activeDeliveries.delete(deliveryId);
          }
        }
      });
    } else {
      ws.send(JSON.stringify({ type: "error", message: "role query param must be 'pilot' or 'subscriber'" }));
      ws.close();
    }

    // Heartbeat / ping-pong
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    ws.on("close", () => clearInterval(pingInterval));
  });

  console.log("[ws] Live tracking WebSocket initialized at /ws/tracking");
}

function hasPilotForDelivery(deliveryId: number): boolean {
  for (const [, info] of pilotConnections) {
    if (info.deliveryId === deliveryId) return true;
  }
  return false;
}

/**
 * Get current tracking stats (for admin/monitoring).
 */
export function getTrackingStats() {
  return {
    activeDeliveries: activeDeliveries.size,
    totalSubscribers: Array.from(activeDeliveries.values()).reduce((sum, d) => sum + d.subscribers.size, 0),
    activePilots: pilotConnections.size,
  };
}
