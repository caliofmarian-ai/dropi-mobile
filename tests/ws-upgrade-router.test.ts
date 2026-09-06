import { createServer, type Server as HttpServer } from "http";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { registerWebSocketUpgradeRouter } from "../server/ws-upgrade-router";

const servers: HttpServer[] = [];
const sockets: WebSocket[] = [];
const webSocketServers: WebSocketServer[] = [];

afterEach(async () => {
  for (const socket of sockets.splice(0)) {
    try {
      socket.close();
    } catch {
      // already closed
    }
  }
  for (const wss of webSocketServers.splice(0)) {
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  }
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

async function listen(server: HttpServer): Promise<number> {
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
  return address.port;
}

function expectMessage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    sockets.push(ws);
    ws.once("message", (data) => resolve(data.toString()));
    ws.once("error", reject);
  });
}

function expectRejected(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    sockets.push(ws);
    ws.once("unexpected-response", (_request, response) => resolve(response.statusCode || 0));
    ws.once("open", () => reject(new Error("Unexpected WebSocket upgrade success")));
    ws.once("error", () => {
      // ws may emit error after unexpected-response; status is asserted there.
    });
  });
}

describe("single WebSocket upgrade router", () => {
  it("routes tracking and notifications independently on one HTTP server", async () => {
    const httpServer = createServer();
    const trackingWss = new WebSocketServer({ noServer: true });
    const notificationWss = new WebSocketServer({ noServer: true });
    webSocketServers.push(trackingWss, notificationWss);

    trackingWss.on("connection", (ws) => ws.send("tracking"));
    notificationWss.on("connection", (ws) => ws.send("notifications"));

    registerWebSocketUpgradeRouter(httpServer, [
      { path: "/ws/tracking", wss: trackingWss },
      { path: "/ws/notifications", wss: notificationWss },
    ]);

    const port = await listen(httpServer);

    await expect(expectMessage(`ws://127.0.0.1:${port}/ws/tracking?deliveryId=2`)).resolves.toBe("tracking");
    await expect(expectMessage(`ws://127.0.0.1:${port}/ws/notifications?userId=1`)).resolves.toBe("notifications");
  });

  it("rejects unknown WebSocket namespaces deterministically", async () => {
    const httpServer = createServer();
    const trackingWss = new WebSocketServer({ noServer: true });
    webSocketServers.push(trackingWss);

    registerWebSocketUpgradeRouter(httpServer, [
      { path: "/ws/tracking", wss: trackingWss },
    ]);

    const port = await listen(httpServer);
    await expect(expectRejected(`ws://127.0.0.1:${port}/ws/unknown`)).resolves.toBe(404);
  });

  it("refuses duplicate path registration before the server starts", () => {
    const httpServer = createServer();
    servers.push(httpServer);
    const first = new WebSocketServer({ noServer: true });
    const second = new WebSocketServer({ noServer: true });
    webSocketServers.push(first, second);

    expect(() => registerWebSocketUpgradeRouter(httpServer, [
      { path: "/ws/tracking", wss: first },
      { path: "/ws/tracking", wss: second },
    ])).toThrow("Duplicate WebSocket upgrade route");
  });
});
