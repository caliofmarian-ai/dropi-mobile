/**
 * API Integration Screen — Sprint E (Live B2B Logistic API)
 *
 * For external store merchants: live API key management, webhook config,
 * delivery history, and documentation links for the DROPi Logistic API.
 * Uses tRPC queries/mutations against the new B2B router.
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

export default function ApiIntegrationScreen() {
  const router = useRouter();
  const storeQuery = trpc.store.getMyStore.useQuery();
  const store = storeQuery.data;
  const apiKeysQuery = trpc.apiKey.list.useQuery(undefined, { enabled: !!store && store.type === "external" });
  const webhooksQuery = trpc.webhook.list.useQuery(undefined, { enabled: !!store && store.type === "external" });
  const deliveriesQuery = trpc.b2bDelivery.list.useQuery(undefined, { enabled: !!store && store.type === "external" });

  const generateKeyMutation = trpc.apiKey.generate.useMutation();
  const revokeKeyMutation = trpc.apiKey.revoke.useMutation();

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([storeQuery.refetch(), apiKeysQuery.refetch(), webhooksQuery.refetch(), deliveriesQuery.refetch()]);
    setRefreshing(false);
  };

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
        <TouchableOpacity className="mt-4" onPress={() => safeGoBack(router)}>
          <Text className="text-primary font-medium">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      Alert.alert("Error", "Please enter a name for the API key");
      return;
    }
    try {
      const result = await generateKeyMutation.mutateAsync({ name: newKeyName.trim() });
      setNewlyCreatedKey(result.apiKey);
      setShowNewKeyForm(false);
      setNewKeyName("");
      apiKeysQuery.refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate API key");
    }
  };

  const handleRevokeKey = (keyId: number, keyName: string) => {
    Alert.alert(
      "Revoke API Key",
      `Are you sure you want to revoke "${keyName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeKeyMutation.mutateAsync({ keyId });
              apiKeysQuery.refetch();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to revoke key");
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(text);
    }
    Alert.alert("Copied", "Copied to clipboard");
  };

  const activeKeys = (apiKeysQuery.data || []).filter((k) => k.isActive);
  const revokedKeys = (apiKeysQuery.data || []).filter((k) => !k.isActive);
  const webhooks = webhooksQuery.data || [];
  const recentDeliveries = deliveriesQuery.data?.deliveries?.slice(0, 5) || [];

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">API Integration</Text>
            <Text className="text-xs text-muted">DROPi Logistic API — B2B</Text>
          </View>
        </View>

        {/* Integration Status */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-foreground">Integration Status</Text>
            <View style={{ backgroundColor: store.status === "active" ? "#22C55E20" : "#F59E0B20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: store.status === "active" ? "#22C55E" : "#F59E0B", fontSize: 11, fontWeight: "600" }}>
                {store.status === "active" ? "Active" : "Pending"}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-muted">Active Keys</Text>
              <Text className="text-lg font-bold text-foreground">{activeKeys.length}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Webhooks</Text>
              <Text className="text-lg font-bold text-foreground">{webhooks.filter((w) => w.isActive).length}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Deliveries</Text>
              <Text className="text-lg font-bold text-foreground">{deliveriesQuery.data?.total || 0}</Text>
            </View>
          </View>
        </View>

        {/* Newly Created Key Alert */}
        {newlyCreatedKey && (
          <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1">New API Key Created</Text>
            <Text className="text-xs text-muted mb-2">Copy this key now — it will not be shown again.</Text>
            <View className="bg-background border border-border rounded-xl px-3 py-2 mb-2">
              <Text className="text-xs font-mono text-foreground" selectable>{newlyCreatedKey}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-2.5 items-center"
                activeOpacity={0.7}
                onPress={() => copyToClipboard(newlyCreatedKey)}
              >
                <Text className="text-background text-sm font-medium">Copy Key</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface border border-border rounded-xl py-2.5 items-center"
                activeOpacity={0.7}
                onPress={() => setNewlyCreatedKey(null)}
              >
                <Text className="text-foreground text-sm font-medium">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* API Keys Section */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">API Keys</Text>
            <TouchableOpacity
              className="bg-primary/10 rounded-lg px-3 py-1.5"
              activeOpacity={0.7}
              onPress={() => setShowNewKeyForm(true)}
            >
              <Text className="text-primary text-xs font-medium">+ New Key</Text>
            </TouchableOpacity>
          </View>

          {/* New Key Form */}
          {showNewKeyForm && (
            <View className="bg-background border border-border rounded-xl p-3 mb-3">
              <Text className="text-xs text-muted mb-2">Key Name (e.g., "Production", "Staging")</Text>
              <TextInput
                className="border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-surface mb-2"
                placeholder="Enter key name..."
                placeholderTextColor="#687076"
                value={newKeyName}
                onChangeText={setNewKeyName}
                returnKeyType="done"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-lg py-2 items-center"
                  activeOpacity={0.7}
                  onPress={handleGenerateKey}
                  disabled={generateKeyMutation.isPending}
                >
                  <Text className="text-background text-xs font-medium">
                    {generateKeyMutation.isPending ? "Generating..." : "Generate"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-lg py-2 items-center"
                  activeOpacity={0.7}
                  onPress={() => { setShowNewKeyForm(false); setNewKeyName(""); }}
                >
                  <Text className="text-muted text-xs font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Active Keys List */}
          {apiKeysQuery.isLoading ? (
            <ActivityIndicator size="small" />
          ) : activeKeys.length === 0 ? (
            <Text className="text-xs text-muted text-center py-4">No active API keys. Generate one to start using the Logistic API.</Text>
          ) : (
            <View className="gap-2">
              {activeKeys.map((key) => (
                <View key={key.id} className="bg-background border border-border rounded-xl p-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-foreground">{key.name}</Text>
                    <TouchableOpacity onPress={() => handleRevokeKey(key.id, key.name)}>
                      <Text className="text-xs text-error font-medium">Revoke</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs font-mono text-muted">{key.keyPrefix}••••••••••••</Text>
                  <View className="flex-row mt-1 gap-3">
                    <Text className="text-xs text-muted">Rate: {key.rateLimit} req/min</Text>
                    {key.lastUsedAt && (
                      <Text className="text-xs text-muted">Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</Text>
                    )}
                  </View>
                  {key.expiresAt && (
                    <Text className="text-xs text-warning mt-1">Expires: {new Date(key.expiresAt).toLocaleDateString()}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Revoked Keys (collapsed) */}
          {revokedKeys.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted mb-1">Revoked Keys ({revokedKeys.length})</Text>
              {revokedKeys.slice(0, 3).map((key) => (
                <View key={key.id} className="flex-row items-center py-1">
                  <Text className="text-xs text-muted line-through">{key.keyPrefix}•••• — {key.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Webhooks Section */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">Webhook Endpoints</Text>
            <TouchableOpacity
              className="bg-primary/10 rounded-lg px-3 py-1.5"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/webhook-config" as any)}
            >
              <Text className="text-primary text-xs font-medium">Manage</Text>
            </TouchableOpacity>
          </View>

          {webhooks.length === 0 ? (
            <Text className="text-xs text-muted text-center py-3">No webhook endpoints configured.</Text>
          ) : (
            <View className="gap-2">
              {webhooks.filter((w) => w.isActive).slice(0, 3).map((wh) => (
                <View key={wh.id} className="bg-background border border-border rounded-xl p-3">
                  <Text className="text-xs font-mono text-foreground" numberOfLines={1}>{wh.url}</Text>
                  <View className="flex-row mt-1 gap-2 flex-wrap">
                    {(wh.events as string[]).map((ev) => (
                      <View key={ev} style={{ backgroundColor: "#0a7ea415", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: "#0a7ea4", fontWeight: "500" }}>{ev}</Text>
                      </View>
                    ))}
                  </View>
                  {wh.failureCount > 0 && (
                    <Text className="text-xs text-error mt-1">Failures: {wh.failureCount}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Deliveries */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">Recent Deliveries</Text>
            <Text className="text-xs text-muted">{deliveriesQuery.data?.total || 0} total</Text>
          </View>

          {recentDeliveries.length === 0 ? (
            <Text className="text-xs text-muted text-center py-3">No deliveries yet. Use the API to create your first delivery request.</Text>
          ) : (
            <View className="gap-2">
              {recentDeliveries.map((del) => (
                <View key={del.id} className="bg-background border border-border rounded-xl p-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-mono text-foreground">{del.trackingCode}</Text>
                    <StatusBadge status={del.status} />
                  </View>
                  <Text className="text-xs text-muted" numberOfLines={1}>{del.externalOrderId}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {del.quotedPrice ? `${del.quotedPrice} ${del.currency}` : ""} • {new Date(del.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Quick Links</Text>
          <View className="gap-2">
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/api-docs" as any)}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>📖</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">API Documentation</Text>
                <Text className="text-xs text-muted">Endpoints, payloads, authentication guide</Text>
              </View>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/webhook-config" as any)}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>🔔</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">Webhook Configuredion</Text>
                <Text className="text-xs text-muted">Manage endpoints, test webhooks, view logs</Text>
              </View>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rate Limits Info */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-primary mb-1">Rate Limits</Text>
          <Text className="text-xs text-muted leading-relaxed">
            • Default: 100 requests/minute per API key{"\n"}
            • Webhook retries: 3 attempts with exponential backoff{"\n"}
            • Max 5 active API keys per store{"\n"}
            • Max 10 webhook endpoints per store
          </Text>
        </View>

        {/* Disclaimer */}
        <View className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <Text className="text-xs text-muted leading-relaxed">
            Delivery estimates provided through the API are informative and non-contractual. Actual delivery times and prices may vary based on real-time conditions.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#F59E0B20", text: "#F59E0B" },
    assigned: { bg: "#3B82F620", text: "#3B82F6" },
    pickup_enroute: { bg: "#3B82F620", text: "#3B82F6" },
    picked_up: { bg: "#8B5CF620", text: "#8B5CF6" },
    in_transit: { bg: "#0a7ea420", text: "#0a7ea4" },
    delivered: { bg: "#22C55E20", text: "#22C55E" },
    cancelled: { bg: "#EF444420", text: "#EF4444" },
    failed: { bg: "#EF444420", text: "#EF4444" },
  };
  const c = colors[status] || colors.pending;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
      <Text style={{ color: c.text, fontSize: 10, fontWeight: "600" }}>{status.replace("_", " ")}</Text>
    </View>
  );
}
