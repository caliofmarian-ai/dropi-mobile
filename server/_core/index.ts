import "dotenv/config";
import { webcrypto } from "node:crypto";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { createRestGateway } from "../rest-gateway";
import { initLiveTracking, getTrackingStats } from "../live-tracking";
import { initNotificationWS, getNotificationWSStats } from "../ws-notifications";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { startOrchestrator } from "./orchestrator";
import { ENV } from "./env";
import { SECURITY_BODY_LIMIT } from "../../shared/security-baseline-policy";
import {
  apiRateLimitMiddleware,
  httpsOnlyMiddleware,
  securityHeadersMiddleware,
  strictCorsMiddleware,
} from "../security-http";

// Polyfill globalThis.crypto for jose v6 WebCrypto API (needed on Node.js < 19).
// jose v6 uses the bare `crypto` identifier which resolves through globalThis.
// Node.js 19+ exposes it as an unflagged global; Node.js 18 requires this shim.
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  // DROPi is deployed behind one trusted ingress/TLS terminator (Railway in the
  // current deployment). This makes req.ip/req.secure use the nearest proxy only.
  app.set("trust proxy", 1);
  const server = createServer(app);

  app.use(securityHeadersMiddleware(ENV.isProduction));
  app.use(httpsOnlyMiddleware(ENV.isProduction));
  app.use(strictCorsMiddleware({
    isProduction: ENV.isProduction,
    allowedOriginsRaw: process.env.DROPI_ALLOWED_ORIGINS,
  }));
  app.use(apiRateLimitMiddleware);

  // Canonical verification documents can be 10 MB before base64 transport.
  // 16 MB keeps that supported while removing the previous 50 MB global attack surface.
  app.use(express.json({ limit: SECURITY_BODY_LIMIT }));
  app.use(express.urlencoded({ limit: SECURITY_BODY_LIMIT, extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // REST API Gateway for B2B partners (no tRPC client needed)
  app.use("/api/v1", createRestGateway());

  // Live tracking stats endpoint
  app.get("/api/tracking/stats", (_req, res) => {
    res.json(getTrackingStats());
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Initialize WebSocket live tracking on the HTTP server
  initLiveTracking(server);

  // Initialize WebSocket notification channel
  initNotificationWS(server);

  // Start AI Agent Orchestrator (polls task queue every 8s)
  startOrchestrator();

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
