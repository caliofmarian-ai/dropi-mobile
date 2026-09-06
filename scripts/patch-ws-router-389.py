from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old[:100]!r}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "server/live-tracking.ts",
    'import { Server as HttpServer } from "http";\n',
    "",
)
replace_once(
    "server/live-tracking.ts",
    'export function initLiveTracking(server: HttpServer): void {\n  const wss = new WebSocketServer({ server, path: "/ws/tracking" });',
    'export function initLiveTracking(): WebSocketServer {\n  const wss = new WebSocketServer({ noServer: true });',
)
replace_once(
    "server/live-tracking.ts",
    '  console.log("[ws] Authenticated live tracking initialized at /ws/tracking");\n}\n\nexport function getTrackingStats()',
    '  console.log("[ws] Authenticated live tracking handler initialized for /ws/tracking");\n  return wss;\n}\n\nexport function getTrackingStats()',
)

replace_once(
    "server/_core/index.ts",
    'import { initNotificationWS, getNotificationWSStats } from "../ws-notifications";\n',
    'import { initNotificationWS, getNotificationWSStats } from "../ws-notifications";\nimport { registerWebSocketUpgradeRouter } from "../ws-upgrade-router";\n',
)
replace_once(
    "server/_core/index.ts",
    '  // Initialize WebSocket live tracking on the HTTP server\n  initLiveTracking(server);\n\n  // Initialize WebSocket notification channel\n  initNotificationWS(server);',
    '  // Build independent noServer handlers, then route HTTP upgrades once by namespace.\n  // This prevents /ws/tracking and /ws/notifications from cross-closing sockets.\n  const trackingWss = initLiveTracking();\n  const notificationWss = initNotificationWS();\n  registerWebSocketUpgradeRouter(server, [\n    { path: "/ws/tracking", wss: trackingWss },\n    { path: "/ws/notifications", wss: notificationWss },\n  ]);',
)
