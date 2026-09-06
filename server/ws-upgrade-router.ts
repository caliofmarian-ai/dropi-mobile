import type { Server as HttpServer, IncomingMessage } from "http";
import type { Duplex } from "stream";
import { URL } from "url";
import type { WebSocketServer } from "ws";

export type WebSocketUpgradeRoute = Readonly<{
  path: string;
  wss: WebSocketServer;
}>;

function rejectUpgrade(socket: Duplex, statusLine: string): void {
  if (socket.writable) {
    socket.write(`HTTP/1.1 ${statusLine}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  }
  socket.destroy();
}

function requestPath(request: IncomingMessage): string | null {
  try {
    return new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`,
    ).pathname;
  } catch {
    return null;
  }
}

/**
 * Route every HTTP WebSocket upgrade through exactly one server-level listener.
 *
 * Individual WebSocketServer instances MUST be created with `noServer: true`.
 * This prevents one namespace from rejecting or closing a socket intended for a
 * different namespace when multiple WebSocket features share the same HTTP
 * server (for example `/ws/tracking` and `/ws/notifications`).
 */
export function registerWebSocketUpgradeRouter(
  server: HttpServer,
  routes: readonly WebSocketUpgradeRoute[],
): void {
  const byPath = new Map<string, WebSocketServer>();

  for (const route of routes) {
    if (!route.path.startsWith("/")) {
      throw new Error(`WebSocket route must start with '/': ${route.path}`);
    }
    if (byPath.has(route.path)) {
      throw new Error(`Duplicate WebSocket upgrade route: ${route.path}`);
    }
    byPath.set(route.path, route.wss);
  }

  server.on("upgrade", (request, socket, head) => {
    const path = requestPath(request);
    if (!path) {
      rejectUpgrade(socket, "400 Bad Request");
      return;
    }

    const wss = byPath.get(path);
    if (!wss) {
      rejectUpgrade(socket, "404 Not Found");
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}
