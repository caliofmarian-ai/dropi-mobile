/**
 * API Documentation Screen — Sprint E
 *
 * Inline API documentation viewer with endpoint reference, payload examples,
 * authentication guide, and error codes.
 * Per Blueprint section 9.3: "Documentație API inline (endpoint-uri, exemple, coduri eroare)"
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { safeGoBack } from "@/lib/safe-back";

type Section = "auth" | "endpoints" | "webhooks" | "errors";

export default function ApiDocsScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("auth");

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">API Documentation</Text>
            <Text className="text-xs text-muted">DROPi Logistic API v1</Text>
          </View>
        </View>

        {/* Section Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {([
              { id: "auth", label: "Authentication" },
              { id: "endpoints", label: "Endpoints" },
              { id: "webhooks", label: "Webhooks" },
              { id: "errors", label: "Error Codes" },
            ] as const).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                className={`px-4 py-2 rounded-full ${activeSection === tab.id ? "bg-primary" : "bg-surface border border-border"}`}
                activeOpacity={0.7}
                onPress={() => setActiveSection(tab.id)}
              >
                <Text className={`text-sm font-medium ${activeSection === tab.id ? "text-background" : "text-foreground"}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Content */}
        {activeSection === "auth" && <AuthSection />}
        {activeSection === "endpoints" && <EndpointsSection />}
        {activeSection === "webhooks" && <WebhooksSection />}
        {activeSection === "errors" && <ErrorsSection />}
      </ScrollView>
    </ScreenContainer>
  );
}

function AuthSection() {
  return (
    <View className="gap-4">
      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">API Key Authentication</Text>
        <Text className="text-xs text-muted leading-relaxed mb-3">
          All API requests must include your API key in the X-DROPi-API-Key header. Keys are generated from the API Integration screen and are unique per store.
        </Text>
        <CodeBlock code={`curl -X POST https://api.dropi.app/v1/delivery/request \\\n  -H "Content-Type: application/json" \\\n  -H "X-DROPi-API-Key: dropi_your_api_key_here" \\\n  -d '{"externalOrderId": "ORD-001", ...}'`} />
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Security Best Practices</Text>
        <View className="gap-2">
          <BulletPoint text="Never expose API keys in client-side code or public repositories" />
          <BulletPoint text="Use environment variables to store keys on your server" />
          <BulletPoint text="Rotate keys periodically (generate new, then revoke old)" />
          <BulletPoint text="Use separate keys for production and staging environments" />
          <BulletPoint text="Set appropriate rate limits per key based on expected traffic" />
        </View>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Rate Limiting</Text>
        <Text className="text-xs text-muted leading-relaxed mb-2">
          Each API key has a configurable rate limit (default: 100 requests/minute). Exceeding the limit returns HTTP 429.
        </Text>
        <View className="bg-background border border-border rounded-xl p-3">
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-muted">Default limit</Text>
            <Text className="text-xs font-medium text-foreground">100 req/min</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-muted">Max configurable</Text>
            <Text className="text-xs font-medium text-foreground">1000 req/min</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-muted">Max keys per store</Text>
            <Text className="text-xs font-medium text-foreground">5</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function EndpointsSection() {
  return (
    <View className="gap-4">
      {/* POST /delivery/request */}
      <EndpointCard
        method="POST"
        path="/api/v1/delivery/request"
        description="Create a new delivery request. DROPi will orchestrate the full delivery lifecycle."
        requestBody={`{
  "externalOrderId": "PARTNER-ORD-12345",
  "pickup": {
    "address": "Str. Exemplu 10, București",
    "contactName": "Depozit Central",
    "contactPhone": "+40700000000",
    "readyAt": "2026-06-28T14:00:00Z"
  },
  "delivery": {
    "address": "Str. Destinație 5, București",
    "contactName": "Ion Popescu",
    "contactPhone": "+40711111111",
    "notes": "Etaj 3, interfon 12"
  },
  "package": {
    "weight": 2500,
    "dimensions": { "l": 30, "w": 20, "h": 15 },
    "fragile": false,
    "description": "Produse alimentare"
  },
  "preferences": {
    "preferredMode": "terrestrial",
    "urgency": "standard"
  }
}`}
        responseBody={`{
  "deliveryId": 42,
  "trackingCode": "DRP-K8F2A1-3B7C9D0E",
  "status": "pending",
  "quotedPrice": 15.00,
  "currency": "RON",
  "estimatedMinutes": 60,
  "mode": "terrestrial",
  "disclaimer": "Estimare informativă, non-contractuală..."
}`}
      />

      {/* GET /delivery/:id/status */}
      <EndpointCard
        method="GET"
        path="/api/v1/delivery/:id/status"
        description="Query the current status of a delivery by ID or tracking code."
        requestBody={`// Query parameters:\n// ?deliveryId=42\n// OR\n// ?trackingCode=DRP-K8F2A1-3B7C9D0E`}
        responseBody={`{
  "id": 42,
  "externalOrderId": "PARTNER-ORD-12345",
  "trackingCode": "DRP-K8F2A1-3B7C9D0E",
  "status": "in_transit",
  "deliveryMode": "terrestrial",
  "estimatedArrival": "2026-06-28T15:00:00Z",
  "quotedPrice": "15.00",
  "currency": "RON",
  "createdAt": "2026-06-28T14:00:00Z",
  "updatedAt": "2026-06-28T14:30:00Z"
}`}
      />

      {/* POST /delivery/:id/cancel */}
      <EndpointCard
        method="POST"
        path="/api/v1/delivery/:id/cancel"
        description="Cancel a delivery that is still in pending, assigned, or pickup_enroute status."
        requestBody={`{
  "deliveryId": 42,
  "reason": "Customer cancelled the order"
}`}
        responseBody={`{
  "success": true,
  "message": "Delivery cancelled successfully"
}`}
      />

      {/* POST /delivery/estimate */}
      <EndpointCard
        method="POST"
        path="/api/v1/delivery/estimate"
        description="Get a non-contractual delivery estimate. Use before creating a delivery to show the customer an approximate cost and time."
        requestBody={`{
  "pickupAddress": "Str. Exemplu 10, București",
  "deliveryAddress": "Str. Destinație 5, București",
  "packageWeight": 2500,
  "preferredMode": "any",
  "urgency": "standard"
}`}
        responseBody={`{
  "estimatedMinutes": 60,
  "estimatedPrice": 15.00,
  "currency": "RON",
  "mode": "terrestrial",
  "disclaimer": "Estimare informativă, non-contractuală...",
  "note": "Această estimare este informativă și non-contractuală."
}`}
      />

      {/* Delivery Statuses */}
      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Delivery Status Flow</Text>
        <View className="gap-2">
          <StatusRow status="pending" description="Request received, awaiting pilot assignment" />
          <StatusRow status="assigned" description="Pilot assigned to the delivery" />
          <StatusRow status="pickup_enroute" description="Pilot heading to pickup location" />
          <StatusRow status="picked_up" description="Package collected from store" />
          <StatusRow status="in_transit" description="Package on the way to destination" />
          <StatusRow status="delivered" description="Successfully delivered to customer" />
          <StatusRow status="cancelled" description="Cancelled by partner, system, or pilot" />
          <StatusRow status="failed" description="Delivery attempt failed" />
        </View>
      </View>
    </View>
  );
}

function WebhooksSection() {
  return (
    <View className="gap-4">
      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Webhook Overview</Text>
        <Text className="text-xs text-muted leading-relaxed">
          DROPi sends webhook notifications to your registered endpoints when delivery status changes occur. Each webhook includes a signature header for verification.
        </Text>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Webhook Payload Format</Text>
        <CodeBlock code={`{
  "event": "delivery.status_changed",
  "deliveryId": "dropi-del-uuid",
  "externalOrderId": "PARTNER-ORD-12345",
  "newStatus": "in_transit",
  "timestamp": "2026-06-28T14:30:00Z",
  "details": {
    "estimatedArrival": "2026-06-28T15:00:00Z",
    "trackingUrl": "https://track.dropi.app/del-uuid"
  }
}`} />
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Available Events</Text>
        <View className="gap-2">
          <EventRow event="delivery.status_changed" description="Triggered on any status transition" />
          <EventRow event="delivery.completed" description="Delivery successfully completed" />
          <EventRow event="delivery.cancelled" description="Delivery was cancelled" />
          <EventRow event="delivery.failed" description="Delivery attempt failed" />
          <EventRow event="delivery.picked_up" description="Package collected from store" />
        </View>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Signature Verification</Text>
        <Text className="text-xs text-muted leading-relaxed mb-3">
          Each webhook request includes these headers:
        </Text>
        <View className="gap-1 mb-3">
          <View className="flex-row">
            <Text className="text-xs font-mono text-primary mr-2">X-DROPi-Signature</Text>
            <Text className="text-xs text-muted">HMAC-SHA256 of the request body</Text>
          </View>
          <View className="flex-row">
            <Text className="text-xs font-mono text-primary mr-2">X-DROPi-Event</Text>
            <Text className="text-xs text-muted">The event type (e.g., delivery.status_changed)</Text>
          </View>
        </View>
        <CodeBlock code={`// Node.js verification example
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Retry Policy</Text>
        <Text className="text-xs text-muted leading-relaxed">
          Failed webhook deliveries are retried up to 3 times with exponential backoff (1min, 5min, 30min). After 3 consecutive failures, the endpoint is marked as failing. Endpoints with more than 10 consecutive failures may be automatically deactivated.
        </Text>
      </View>
    </View>
  );
}

function ErrorsSection() {
  return (
    <View className="gap-4">
      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">HTTP Status Codes</Text>
        <View className="gap-2">
          <ErrorRow code="200" description="Request successful" type="success" />
          <ErrorRow code="201" description="Resource created successfully" type="success" />
          <ErrorRow code="400" description="Bad request — invalid parameters" type="error" />
          <ErrorRow code="401" description="Unauthorized — invalid or missing API key" type="error" />
          <ErrorRow code="403" description="Forbidden — store not active or insufficient permissions" type="error" />
          <ErrorRow code="404" description="Resource not found" type="error" />
          <ErrorRow code="409" description="Conflict — duplicate externalOrderId" type="error" />
          <ErrorRow code="422" description="Unprocessable — validation failed" type="error" />
          <ErrorRow code="429" description="Rate limit exceeded" type="error" />
          <ErrorRow code="500" description="Internal server error" type="error" />
        </View>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Error Response Format</Text>
        <CodeBlock code={`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Package weight must be between 1 and 50000 grams",
    "field": "package.weight"
  }
}`} />
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Common Error Codes</Text>
        <View className="gap-2">
          <View className="flex-row py-1.5 border-b border-border">
            <Text className="text-xs font-mono text-error w-40">INVALID_API_KEY</Text>
            <Text className="text-xs text-muted flex-1">API key is invalid or revoked</Text>
          </View>
          <View className="flex-row py-1.5 border-b border-border">
            <Text className="text-xs font-mono text-error w-40">STORE_INACTIVE</Text>
            <Text className="text-xs text-muted flex-1">Store is not in active status</Text>
          </View>
          <View className="flex-row py-1.5 border-b border-border">
            <Text className="text-xs font-mono text-error w-40">RATE_LIMIT_EXCEEDED</Text>
            <Text className="text-xs text-muted flex-1">Too many requests per minute</Text>
          </View>
          <View className="flex-row py-1.5 border-b border-border">
            <Text className="text-xs font-mono text-error w-40">DELIVERY_NOT_FOUND</Text>
            <Text className="text-xs text-muted flex-1">Delivery ID or tracking code not found</Text>
          </View>
          <View className="flex-row py-1.5 border-b border-border">
            <Text className="text-xs font-mono text-error w-40">CANCEL_NOT_ALLOWED</Text>
            <Text className="text-xs text-muted flex-1">Delivery status does not allow cancellation</Text>
          </View>
          <View className="flex-row py-1.5">
            <Text className="text-xs font-mono text-error w-40">MAX_KEYS_REACHED</Text>
            <Text className="text-xs text-muted flex-1">Maximum 5 active API keys per store</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ===== HELPER COMPONENTS =====

function CodeBlock({ code }: { code: string }) {
  return (
    <View className="bg-background border border-border rounded-xl p-3">
      <Text className="text-xs font-mono text-foreground leading-relaxed">{code}</Text>
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View className="flex-row items-start">
      <Text className="text-xs text-primary mr-2 mt-0.5">•</Text>
      <Text className="text-xs text-muted flex-1 leading-relaxed">{text}</Text>
    </View>
  );
}

function StatusRow({ status, description }: { status: string; description: string }) {
  const colors: Record<string, string> = {
    pending: "#F59E0B",
    assigned: "#3B82F6",
    pickup_enroute: "#3B82F6",
    picked_up: "#8B5CF6",
    in_transit: "#0a7ea4",
    delivered: "#22C55E",
    cancelled: "#EF4444",
    failed: "#EF4444",
  };
  return (
    <View className="flex-row items-center py-1.5 border-b border-border">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors[status] || "#687076", marginRight: 8 }} />
      <Text className="text-xs font-mono text-foreground w-28">{status}</Text>
      <Text className="text-xs text-muted flex-1">{description}</Text>
    </View>
  );
}

function EventRow({ event, description }: { event: string; description: string }) {
  return (
    <View className="flex-row items-center py-1.5 border-b border-border">
      <Text className="text-xs font-mono text-primary mr-2 w-44">{event}</Text>
      <Text className="text-xs text-muted flex-1">{description}</Text>
    </View>
  );
}

function ErrorRow({ code, description, type }: { code: string; description: string; type: "success" | "error" }) {
  return (
    <View className="flex-row items-center py-1.5 border-b border-border">
      <View style={{ backgroundColor: type === "success" ? "#22C55E20" : "#EF444420", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
        <Text style={{ color: type === "success" ? "#22C55E" : "#EF4444", fontSize: 11, fontWeight: "700" }}>{code}</Text>
      </View>
      <Text className="text-xs text-muted flex-1">{description}</Text>
    </View>
  );
}

function EndpointCard({ method, path, description, requestBody, responseBody }: {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  responseBody: string;
}) {
  const methodColor = method === "POST" ? "#10B981" : method === "GET" ? "#3B82F6" : "#F59E0B";
  return (
    <View className="bg-surface border border-border rounded-2xl p-4">
      <View className="flex-row items-center mb-2">
        <View style={{ backgroundColor: methodColor + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
          <Text style={{ color: methodColor, fontSize: 11, fontWeight: "700" }}>{method}</Text>
        </View>
        <Text className="text-xs font-mono text-foreground flex-1">{path}</Text>
      </View>
      <Text className="text-xs text-muted mb-3">{description}</Text>

      <Text className="text-xs font-semibold text-foreground mb-1">Request</Text>
      <CodeBlock code={requestBody} />

      <Text className="text-xs font-semibold text-foreground mb-1 mt-3">Response</Text>
      <CodeBlock code={responseBody} />
    </View>
  );
}
