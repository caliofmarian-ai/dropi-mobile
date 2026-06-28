/**
 * API Integration Screen
 * 
 * For external store merchants: shows API key, webhook configuration,
 * and documentation for the DROPi Logistic API.
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function ApiIntegrationScreen() {
  const router = useRouter();
  const storeQuery = trpc.store.getMyStore.useQuery();
  const store = storeQuery.data;
  const [showKey, setShowKey] = useState(false);

  if (storeQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!store || store.type !== "external") {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
        <Text className="text-lg font-semibold text-foreground text-center">API Integration</Text>
        <Text className="text-sm text-muted text-center mt-2">
          API integration is only available for external stores.
        </Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-medium">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const apiKey = store.apiKey || "Not generated yet";
  const maskedKey = showKey ? apiKey : apiKey.replace(/./g, "•").slice(0, 32) + "...";

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(text);
    }
    Alert.alert("Copied", "API key copied to clipboard");
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">API Integration</Text>
        </View>

        {/* API Key Card */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Your API Key</Text>
          <View className="bg-background border border-border rounded-xl px-4 py-3 mb-3">
            <Text className="text-xs font-mono text-muted" numberOfLines={1}>{maskedKey}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-primary/10 rounded-xl py-2.5 items-center"
              activeOpacity={0.7}
              onPress={() => setShowKey(!showKey)}
            >
              <Text className="text-primary text-sm font-medium">{showKey ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary/10 rounded-xl py-2.5 items-center"
              activeOpacity={0.7}
              onPress={() => copyToClipboard(apiKey)}
            >
              <Text className="text-primary text-sm font-medium">Copy</Text>
            </TouchableOpacity>
          </View>
          {store.status !== "active" && (
            <View className="mt-3 bg-warning/10 rounded-lg px-3 py-2">
              <Text className="text-xs" style={{ color: "#F59E0B" }}>
                API key will be activated after store approval.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Start Guide */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Quick Start</Text>
          <Text className="text-xs text-muted leading-relaxed mb-3">
            Add DROPi delivery to your checkout in 3 steps:
          </Text>
          <View className="gap-3">
            <StepItem number={1} title="Add the widget script" description="Include our JS widget in your checkout page" />
            <StepItem number={2} title="Configure pickup address" description="Set your store's pickup location for drivers" />
            <StepItem number={3} title="Handle webhook callbacks" description="Receive delivery status updates in real-time" />
          </View>
        </View>

        {/* API Endpoints */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Available Endpoints</Text>
          <View className="gap-2">
            <EndpointItem method="POST" path="/api/v1/delivery/request" description="Create a new delivery request" />
            <EndpointItem method="GET" path="/api/v1/delivery/:id/status" description="Check delivery status" />
            <EndpointItem method="POST" path="/api/v1/delivery/:id/cancel" description="Cancel a pending delivery" />
            <EndpointItem method="GET" path="/api/v1/delivery/estimate" description="Get delivery time & cost estimate" />
            <EndpointItem method="POST" path="/api/v1/webhooks/configure" description="Set webhook URL for status updates" />
          </View>
        </View>

        {/* Webhook Events */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Webhook Events</Text>
          <View className="gap-2">
            <WebhookItem event="delivery.accepted" description="A driver accepted the delivery" />
            <WebhookItem event="delivery.picked_up" description="Package picked up from your store" />
            <WebhookItem event="delivery.in_transit" description="Package is being delivered" />
            <WebhookItem event="delivery.completed" description="Package delivered to customer" />
            <WebhookItem event="delivery.failed" description="Delivery attempt failed" />
          </View>
        </View>

        {/* Rate Limits */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-primary mb-1">Rate Limits</Text>
          <Text className="text-xs text-muted leading-relaxed">
            • 100 requests/minute per API key{"\n"}
            • 10,000 requests/day per store{"\n"}
            • Webhook retries: 3 attempts with exponential backoff{"\n"}
            • Contact support for higher limits
          </Text>
        </View>

        {/* Support */}
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-1">Need Help?</Text>
          <Text className="text-xs text-muted">
            Contact our integration team for technical support with your API setup.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <View className="flex-row items-start">
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#0a7ea4", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 1 }}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">{title}</Text>
        <Text className="text-xs text-muted">{description}</Text>
      </View>
    </View>
  );
}

function EndpointItem({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor = method === "POST" ? "#10B981" : method === "GET" ? "#3B82F6" : "#F59E0B";
  return (
    <View className="flex-row items-center py-2 border-b border-border">
      <View style={{ backgroundColor: methodColor + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
        <Text style={{ color: methodColor, fontSize: 9, fontWeight: "700" }}>{method}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs font-mono text-foreground">{path}</Text>
        <Text className="text-xs text-muted">{description}</Text>
      </View>
    </View>
  );
}

function WebhookItem({ event, description }: { event: string; description: string }) {
  return (
    <View className="flex-row items-center py-1.5">
      <Text className="text-xs font-mono text-primary mr-2">{event}</Text>
      <Text className="text-xs text-muted flex-1">{description}</Text>
    </View>
  );
}
