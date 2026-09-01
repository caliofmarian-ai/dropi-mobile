/**
 * Live Tracking WebSocket Server
 *
 * Security contract:
 * - URL carries only the tracking namespace (`target`) and resource ID (`deliveryId`).
 * - The first client message MUST authenticate with the existing DROPi session token.
 * - Pilot identity is derived server-side from the authenticated session; `pilotId` is never trusted from the client.
 * - Subscriber access is checked against order/B2B ownership before a socket joins a tracking stream.
 * - `order:<id>` and `b2b:<id>` are distinct stream keys so equal numeric IDs cannot collide.
 */
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import { createInAppNotification } from "./create-notification";
import {
  authorizeTrackingSession,
  TrackingAccessError,
  type TrackingAuthorization,
  type TrackingMode,
  type TrackingTarget,
} from "./live-tracking-access";

interface PositionUpdate {
  target: TrackingTarget;
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
  lastPosition: PositionUpdate | null;
  subscribers: Set<WebSocket>;
  dropoff?: { lat: number; lng: number };
  geofenceTriggered?: boolean;
  etaSeconds?: number;
}

interface PilotConnection {
  pilotId: number;
  target: TrackingTarget;
  deliveryId: number;
  streamKey: string;
  notificationRecipientId: number | null;
}

type AuthenticateMessage = {
  type: "authenticate";
  token?: string;
  mode?: TrackingMode;
};

const activeDeliveries = new Map<string, TrackedDelivery>();
const pilotConnections = new Map<WebSocket, PilotConnection>();
const GEOFENCE_RADIUS_M = 500;
const AUTH_TIMEOUT_MS = 10_000;
const ALLOWED_VEHICLE_TYPES = new Set(["drone", "auto", "van", "ebike", "terrestrial"]);

function streamKey(target: TrackingTarget, deliveryId: number): string {
  return `${target}:${deliveryId}`;
}

function parseTarget(value: string | null): TrackingTarget | null {
  return value === "order" || value === "b2b" ? value : null;
}

function sendJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function closeWithPolicyError(ws: WebSocket, code: string, message: string): void {
  sendJson(ws, { type: "error", code, message });
  ws.close(1008, message.slice(0, 120));
}

function parseMessage(raw: WebSocket.RawData): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw.toString());
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parsePositionMessage(
  msg: Record<string, unknown>,
  authorization: TrackingAuthorization,
): PositionUpdate | null {
  const lat = finiteNumber(msg.lat);
  const lng = finiteNumber(msg.lng);
  const speed = finiteNumber(msg.speed) ?? 0;
  const heading = finiteNumber(msg.heading) ?? 0;
  const altitudeValue = msg.altitude == null ? null : finiteNumber(msg.altitude);

  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  if (speed < 0 || speed > 200 || heading < 0 || heading > 360) {
    return null;
  }
  if (msg.altitude != null && altitudeValue == null) {
    return null;
  }

  const rawVehicleType = typeof msg.vehicleType === "string" ? msg.vehicleType : "auto";
  const vehicleType = ALLOWED_VEHICLE_TYPES.has(rawVehicleType) ? rawVehicleType : "auto";

  return {
    target: authorization.target,
    deliveryId: authorization.resourceId,
    pilotId: authorization.pilotId!,
    lat,
    lng,
    heading,
    speed,
    altitude: altitudeValue ?? undefined,
    vehicleType,
    timestamp: new Date().toISOString(),
  };
}

function parseDropoff(url: URL): { lat: number; lng: number } | null {
  const lat = finiteNumber(url.searchParams.get("dropoffLat"));
  const lng = finiteNumber(url.searchParams.get("dropoffLng"));
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateETA(distanceM: number, speedMs: number, vehicleType: string): number {
  const defaultSpeeds: Record<string, number> = {
    drone: 15,
    auto: 8.3,
    van: 6.9,
    ebike: 5.6,
    terrestrial: 8.3,
  };
  const effectiveSpeed = speedMs > 1 ? speedMs : (defaultSpeeds[vehicleType] || 8.3);
  return Math.round(distanceM / effectiveSpeed);
}

function getOrCreateDelivery(key: string): TrackedDelivery {
  let delivery = activeDeliveries.get(key);
  if (!delivery) {
    delivery = { lastPosition: null, subscribers: new Set() };
    activeDeliveries.set(key, delivery);
  }
  return delivery;
}

function hasPilotForStream(key: string): boolean {
  for (const info of pilotConnections.values()) {
    if (info.streamKey === key) return true;
  }
  return false;
}

function attachSubscriber(ws: WebSocket, authorization: TrackingAuthorization): string {
  const key = streamKey(authorization.target, authorization.resourceId);
  const delivery = getOrCreateDelivery(key);
  delivery.subscribers.add(ws);

  if (delivery.lastPosition) {
    sendJson(ws, { type: "position", data: delivery.lastPosition });
  } else {
    sendJson(ws, { type: "waiting", message: "Waiting for pilot position..." });
  }
  return key;
}

function attachPilot(ws: WebSocket, url: URL, authorization: TrackingAuthorization): PilotConnection {
  const key = streamKey(authorization.target, authorization.resourceId);
  const delivery = getOrCreateDelivery(key);
  const dropoff = parseDropoff(url);
  if (dropoff) {
    delivery.dropoff = dropoff;
    delivery.geofenceTriggered = false;
  }

  const connection: PilotConnection = {
    pilotId: authorization.pilotId!,
    target: authorization.target,
    deliveryId: authorization.resourceId,
    streamKey: key,
    notificationRecipientId: authorization.notificationRecipientId,
  };
  pilotConnections.set(ws, connection);
  return connection;
}

function broadcastToSubscribers(delivery: TrackedDelivery, payload: unknown): void {
  for (const subscriber of delivery.subscribers) {
    sendJson(subscriber, payload);
  }
}

async function handlePilotMessage(
  ws: WebSocket,
  msg: Record<string, unknown>,
  authorization: TrackingAuthorization,
): Promise<void> {
  const key = streamKey(authorization.target, authorization.resourceId);
  const delivery = activeDeliveries.get(key);
  if (!delivery) {
    closeWithPolicyError(ws, "TRACKING_STATE_MISSING", "Tracking state is no longer active.");
    return;
  }

  if (msg.type === "delivery_complete") {
    const completedAt = new Date().toISOString();
    const payload = {
      type: "delivery_completed",
      target: authorization.target,
      deliveryId: authorization.resourceId,
      pilotId: authorization.pilotId,
      completedAt,
      message: "Delivery has been completed successfully.",
    };
    broadcastToSubscribers(delivery, payload);
    activeDeliveries.delete(key);

    if (authorization.notificationRecipientId) {
      createInAppNotification({
        userId: authorization.notificationRecipientId,
        title: "Delivery Completed! 🎉",
        body: `Delivery #${authorization.resourceId} has been completed successfully.`,
        category: "orders",
        metadata: {
          target: authorization.target,
          deliveryId: authorization.resourceId,
          pilotId: authorization.pilotId,
          completedAt,
        },
      }).catch(() => {});
    }

    sendJson(ws, { type: "completion_confirmed", deliveryId: authorization.resourceId });
    pilotConnections.delete(ws);
    ws.close(1000, "Delivery completed");
    return;
  }

  if (msg.type !== "position") {
    sendJson(ws, { type: "error", code: "UNSUPPORTED_MESSAGE", message: "Unsupported pilot message type." });
    return;
  }

  const position = parsePositionMessage(msg, authorization);
  if (!position) {
    sendJson(ws, { type: "error", code: "INVALID_POSITION", message: "Position payload is invalid." });
    return;
  }

  delivery.lastPosition = position;

  let etaSeconds: number | null = null;
  let distanceM: number | null = null;
  if (delivery.dropoff) {
    distanceM = haversineDistance(position.lat, position.lng, delivery.dropoff.lat, delivery.dropoff.lng);
    etaSeconds = calculateETA(distanceM, position.speed, position.vehicleType);
    delivery.etaSeconds = etaSeconds;

    if (!delivery.geofenceTriggered && distanceM <= GEOFENCE_RADIUS_M) {
      delivery.geofenceTriggered = true;
      broadcastToSubscribers(delivery, {
        type: "geofence_entered",
        target: authorization.target,
        deliveryId: authorization.resourceId,
        pilotId: authorization.pilotId,
        distanceM: Math.round(distanceM),
        etaSeconds,
        message: `Pilot is within ${GEOFENCE_RADIUS_M}m of delivery point. Estimated arrival: ${Math.ceil(etaSeconds / 60)} min.`,
      });
    }
  }

  broadcastToSubscribers(delivery, {
    type: "position",
    data: position,
    eta: etaSeconds != null && distanceM != null
      ? { seconds: etaSeconds, distanceM: Math.round(distanceM) }
      : undefined,
  });
}

export function initLiveTracking(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/ws/tracking" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const target = parseTarget(url.searchParams.get("target"));
    const deliveryId = Number.parseInt(url.searchParams.get("deliveryId") || "0", 10);

    if (!target) {
      closeWithPolicyError(ws, "TARGET_REQUIRED", "target query param must be 'order' or 'b2b'.");
      return;
    }
    if (!Number.isSafeInteger(deliveryId) || deliveryId <= 0) {
      closeWithPolicyError(ws, "DELIVERY_ID_REQUIRED", "A positive deliveryId query param is required.");
      return;
    }

    let authorization: TrackingAuthorization | null = null;
    let subscriberStreamKey: string | null = null;
    let authenticating = false;

    const authTimeout = setTimeout(() => {
      if (!authorization) {
        closeWithPolicyError(ws, "AUTH_TIMEOUT", "Live-tracking authentication timed out.");
      }
    }, AUTH_TIMEOUT_MS);

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30_000);

    ws.on("message", async (raw) => {
      const msg = parseMessage(raw);
      if (!msg) {
        sendJson(ws, { type: "error", code: "INVALID_JSON", message: "Invalid message format." });
        return;
      }

      if (!authorization) {
        if (authenticating) return;
        const authMessage = msg as AuthenticateMessage;
        if (authMessage.type !== "authenticate" || (authMessage.mode !== "pilot" && authMessage.mode !== "subscriber")) {
          closeWithPolicyError(ws, "AUTH_REQUIRED", "The first WebSocket message must authenticate the tracking session.");
          return;
        }

        authenticating = true;
        try {
          authorization = await authorizeTrackingSession({
            token: typeof authMessage.token === "string" ? authMessage.token : null,
            target,
            resourceId: deliveryId,
            mode: authMessage.mode,
          });
          clearTimeout(authTimeout);

          if (authorization.mode === "subscriber") {
            subscriberStreamKey = attachSubscriber(ws, authorization);
          } else {
            attachPilot(ws, url, authorization);
          }

          sendJson(ws, {
            type: "authenticated",
            mode: authorization.mode,
            target: authorization.target,
            deliveryId: authorization.resourceId,
            pilotId: authorization.pilotId,
          });
        } catch (error) {
          const accessError = error instanceof TrackingAccessError
            ? error
            : new TrackingAccessError("AUTH_INVALID", "Live-tracking authorization failed.");
          closeWithPolicyError(ws, accessError.code, accessError.message);
        } finally {
          authenticating = false;
        }
        return;
      }

      if (authorization.mode !== "pilot") {
        sendJson(ws, { type: "error", code: "SUBSCRIBER_READ_ONLY", message: "Subscriber tracking sockets are read-only." });
        return;
      }

      await handlePilotMessage(ws, msg, authorization);
    });

    ws.on("close", () => {
      clearTimeout(authTimeout);
      clearInterval(pingInterval);

      if (subscriberStreamKey) {
        const delivery = activeDeliveries.get(subscriberStreamKey);
        if (delivery) {
          delivery.subscribers.delete(ws);
          if (delivery.subscribers.size === 0 && !hasPilotForStream(subscriberStreamKey)) {
            activeDeliveries.delete(subscriberStreamKey);
          }
        }
      }

      const pilot = pilotConnections.get(ws);
      if (pilot) {
        pilotConnections.delete(ws);
        const delivery = activeDeliveries.get(pilot.streamKey);
        if (delivery) {
          broadcastToSubscribers(delivery, {
            type: "pilot_disconnected",
            target: pilot.target,
            deliveryId: pilot.deliveryId,
          });
          if (delivery.subscribers.size === 0) {
            activeDeliveries.delete(pilot.streamKey);
          }
        }
      }
    });
  });

  console.log("[ws] Authenticated live tracking initialized at /ws/tracking");
}

export function getTrackingStats() {
  return {
    activeDeliveries: activeDeliveries.size,
    totalSubscribers: Array.from(activeDeliveries.values()).reduce((sum, d) => sum + d.subscribers.size, 0),
    activePilots: pilotConnections.size,
  };
}
