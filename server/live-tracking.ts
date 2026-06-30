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
import { createInAppNotification } from "./create-notification";

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
  dropoff?: { lat: number; lng: number };
  geofenceTriggered?: boolean;
  etaSeconds?: number;
}

// In-memory tracking state
const activeDeliveries = new Map<number, TrackedDelivery>();
const pilotConnections = new Map<WebSocket, { pilotId: number; deliveryId: number }>();

// Geofence radius in meters
const GEOFENCE_RADIUS_M = 500;

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate ETA in seconds based on distance and current speed.
 * If speed is 0, uses a default average speed for the vehicle type.
 */
function calculateETA(distanceM: number, speedMs: number, vehicleType: string): number {
  // Default speeds (m/s) if pilot is stationary
  const defaultSpeeds: Record<string, number> = {
    drone: 15,   // ~54 km/h
    auto: 8.3,   // ~30 km/h (urban)
    van: 6.9,    // ~25 km/h (urban)
    ebike: 5.6,  // ~20 km/h
  };
  const effectiveSpeed = speedMs > 1 ? speedMs : (defaultSpeeds[vehicleType] || 8.3);
  return Math.round(distanceM / effectiveSpeed);
}

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

      // Parse optional dropoff coordinates for ETA + geofence
      const dropoffLat = parseFloat(url.searchParams.get("dropoffLat") || "0");
      const dropoffLng = parseFloat(url.searchParams.get("dropoffLng") || "0");

      if (!activeDeliveries.has(deliveryId)) {
        activeDeliveries.set(deliveryId, { lastPosition: null as any, subscribers: new Set() });
      }

      const deliveryEntry = activeDeliveries.get(deliveryId)!;
      if (dropoffLat && dropoffLng) {
        deliveryEntry.dropoff = { lat: dropoffLat, lng: dropoffLng };
        deliveryEntry.geofenceTriggered = false;
      }

      ws.send(JSON.stringify({ type: "connected", message: "Pilot tracking active", deliveryId }));

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          // Handle delivery completion
          if (msg.type === "delivery_complete") {
            const delivery = activeDeliveries.get(deliveryId);
            if (delivery) {
              const completionPayload = JSON.stringify({
                type: "delivery_completed",
                deliveryId,
                pilotId,
                completedAt: new Date().toISOString(),
                message: "Delivery has been completed successfully!",
              });
              // Notify all subscribers via WebSocket
              delivery.subscribers.forEach((sub) => {
                if (sub.readyState === WebSocket.OPEN) {
                  sub.send(completionPayload);
                }
              });
              // Clean up delivery tracking state
              activeDeliveries.delete(deliveryId);
              console.log(`[ws] Delivery #${deliveryId} completed by pilot #${pilotId}`);
            }

            // Send in-app notification to customer (using customerId from msg or deliveryId lookup)
            const customerId = msg.customerId;
            if (customerId) {
              createInAppNotification({
                userId: customerId,
                title: "Delivery Completed! 🎉",
                body: `Your delivery #${deliveryId} has been successfully completed. Thank you for using DROPi!`,
                category: "orders",
                metadata: { deliveryId, pilotId, completedAt: new Date().toISOString() },
              }).catch(() => {});
            }

            // Confirm to pilot
            ws.send(JSON.stringify({ type: "completion_confirmed", deliveryId }));
            // Close pilot connection gracefully
            pilotConnections.delete(ws);
            ws.close(1000, "Delivery completed");
            return;
          }

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

              // Calculate ETA if dropoff is known
              let etaSeconds: number | null = null;
              let distanceM: number | null = null;
              if (delivery.dropoff) {
                distanceM = haversineDistance(position.lat, position.lng, delivery.dropoff.lat, delivery.dropoff.lng);
                etaSeconds = calculateETA(distanceM, position.speed, position.vehicleType);
                delivery.etaSeconds = etaSeconds;

                // Geofence check: trigger once when entering 500m radius
                if (!delivery.geofenceTriggered && distanceM <= GEOFENCE_RADIUS_M) {
                  delivery.geofenceTriggered = true;
                  const geofencePayload = JSON.stringify({
                    type: "geofence_entered",
                    deliveryId,
                    pilotId,
                    distanceM: Math.round(distanceM),
                    etaSeconds,
                    message: `Pilot is within ${GEOFENCE_RADIUS_M}m of delivery point. Estimated arrival: ${Math.ceil(etaSeconds / 60)} min.`,
                  });
                  delivery.subscribers.forEach((sub) => {
                    if (sub.readyState === WebSocket.OPEN) {
                      sub.send(geofencePayload);
                    }
                  });
                }
              }

              // Broadcast position + ETA to all subscribers
              const payload = JSON.stringify({
                type: "position",
                data: position,
                eta: etaSeconds != null ? { seconds: etaSeconds, distanceM: Math.round(distanceM!) } : undefined,
              });
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
