/**
 * Webhook Configuration Screen — Sprint E
 *
 * Manage webhook endpoints: add, test, view logs, and delete.
 * Webhook signature verification uses HMAC-SHA256.
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, TextInput, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const AVAILABLE_EVENTS = [
  { id: "delivery.status_changed", label: "Status Changed", description: "Any delivery status update" },
  { id: "delivery.completed", label: "Completed", description: "Delivery successfully completed" },
  { id: "delivery.cancelled", label: "Cancelled", description: "Delivery was cancelled" },
  { id: "delivery.failed", label: "Failed", description: "Delivery attempt failed" },
  { id: "delivery.picked_up", label: "Picked Up", description: "Package collected from store" },
] as const;

type EventId = typeof AVAILABLE_EVENTS[number]["id"];

export default function WebhookConfigScreen() {
  const router = useRouter();
  const webhooksQuery = trpc.webhook.list.useQuery();
  const logsQuery = trpc.webhook.logs.useQuery({ limit: 20 });
  const registerMutation = trpc.webhook.register.useMutation();
  const testMutation = trpc.webhook.test.useMutation();
  const deleteMutation = trpc.webhook.delete.useMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<EventId[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([webhooksQuery.refetch(), logsQuery.refetch()]);
    setRefreshing(false);
  };

  const toggleEvent = (eventId: EventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleRegister = async () => {
    if (!newUrl.trim()) {
      Alert.alert("Error", "Please enter a webhook URL");
      return;
    }
    if (selectedEvents.length === 0) {
      Alert.alert("Error", "Select at least one event");
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({
        url: newUrl.trim(),
        events: selectedEvents as any,
      });
      setNewSecret(result.secret);
      setShowAddForm(false);
      setNewUrl("");
      setSelectedEvents([]);
      webhooksQuery.refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to register webhook");
    }
  };

  const handleTest = async (webhookId: number) => {
    setTestingId(webhookId);
    try {
      const result = await testMutation.mutateAsync({ webhookId });
      Alert.alert(
        result.success ? "Success" : "Failed",
        result.message
      );
      webhooksQuery.refetch();
      logsQuery.refetch();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (webhookId: number, url: string) => {
    Alert.alert(
      "Remove Webhook",
      `Remove endpoint: ${url.substring(0, 50)}...?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ webhookId });
              webhooksQuery.refetch();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove");
            }
          },
        },
      ]
    );
  };

  const webhooks = webhooksQuery.data || [];
  const logs = logsQuery.data?.logs || [];

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Webhook Configuration</Text>
            <Text className="text-xs text-muted">Receive real-time delivery status updates</Text>
          </View>
        </View>

        {/* New Secret Alert */}
        {newSecret && (
          <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1">Webhook Secret Created</Text>
            <Text className="text-xs text-muted mb-2">
              Use this secret to verify webhook signatures (HMAC-SHA256). It will not be shown again.
            </Text>
            <View className="bg-background border border-border rounded-xl px-3 py-2 mb-2">
              <Text className="text-xs font-mono text-foreground" selectable>{newSecret}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-2.5 items-center"
                activeOpacity={0.7}
                onPress={async () => {
                  if (Platform.OS === "web") await navigator.clipboard.writeText(newSecret);
                  Alert.alert("Copied", "Secret copied to clipboard");
                }}
              >
                <Text className="text-background text-sm font-medium">Copy Secret</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface border border-border rounded-xl py-2.5 items-center"
                activeOpacity={0.7}
                onPress={() => setNewSecret(null)}
              >
                <Text className="text-foreground text-sm font-medium">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add Webhook Form */}
        {showAddForm ? (
          <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">New Webhook Endpoint</Text>

            <Text className="text-xs text-muted mb-1">Endpoint URL</Text>
            <TextInput
              className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground bg-background mb-3"
              placeholder="https://your-server.com/webhooks/dropi"
              placeholderTextColor="#687076"
              value={newUrl}
              onChangeText={setNewUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text className="text-xs text-muted mb-2">Events to Subscribe</Text>
            <View className="gap-2 mb-4">
              {AVAILABLE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.id);
                return (
                  <TouchableOpacity
                    key={event.id}
                    className={`border rounded-xl p-3 flex-row items-center ${isSelected ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                    activeOpacity={0.7}
                    onPress={() => toggleEvent(event.id)}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: isSelected ? "#0a7ea4" : "#E5E7EB", backgroundColor: isSelected ? "#0a7ea4" : "transparent", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                      {isSelected && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{event.label}</Text>
                      <Text className="text-xs text-muted">{event.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                activeOpacity={0.7}
                onPress={handleRegister}
                disabled={registerMutation.isPending}
              >
                <Text className="text-background text-sm font-semibold">
                  {registerMutation.isPending ? "Registering..." : "Register Endpoint"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface border border-border rounded-xl py-3 px-4 items-center"
                activeOpacity={0.7}
                onPress={() => { setShowAddForm(false); setNewUrl(""); setSelectedEvents([]); }}
              >
                <Text className="text-muted text-sm font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary rounded-2xl py-3 items-center mb-4"
            activeOpacity={0.7}
            onPress={() => setShowAddForm(true)}
          >
            <Text className="text-background text-sm font-semibold">+ Add Webhook Endpoint</Text>
          </TouchableOpacity>
        )}

        {/* Active Webhooks */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Active Endpoints ({webhooks.filter((w) => w.isActive).length})
          </Text>

          {webhooksQuery.isLoading ? (
            <ActivityIndicator size="small" />
          ) : webhooks.filter((w) => w.isActive).length === 0 ? (
            <Text className="text-xs text-muted text-center py-4">No active webhook endpoints.</Text>
          ) : (
            <View className="gap-3">
              {webhooks.filter((w) => w.isActive).map((wh) => (
                <View key={wh.id} className="bg-background border border-border rounded-xl p-3">
                  <Text className="text-xs font-mono text-foreground mb-2" numberOfLines={1}>{wh.url}</Text>

                  {/* Events */}
                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {(wh.events as string[]).map((ev) => (
                      <View key={ev} style={{ backgroundColor: "#0a7ea415", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: "#0a7ea4", fontWeight: "500" }}>{ev}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Stats */}
                  <View className="flex-row gap-3 mb-2">
                    {wh.lastSuccessAt && (
                      <Text className="text-xs text-success">Last success: {new Date(wh.lastSuccessAt).toLocaleDateString()}</Text>
                    )}
                    {wh.failureCount > 0 && (
                      <Text className="text-xs text-error">Failures: {wh.failureCount}</Text>
                    )}
                  </View>
                  {wh.lastFailureReason && (
                    <Text className="text-xs text-error mb-2" numberOfLines={1}>Error: {wh.lastFailureReason}</Text>
                  )}

                  {/* Actions */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 bg-primary/10 rounded-lg py-2 items-center"
                      activeOpacity={0.7}
                      onPress={() => handleTest(wh.id)}
                      disabled={testingId === wh.id}
                    >
                      <Text className="text-primary text-xs font-medium">
                        {testingId === wh.id ? "Testing..." : "Send Test"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-error/10 rounded-lg py-2 px-4 items-center"
                      activeOpacity={0.7}
                      onPress={() => handleDelete(wh.id, wh.url)}
                    >
                      <Text className="text-error text-xs font-medium">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Webhook Logs */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Recent Delivery Logs</Text>

          {logsQuery.isLoading ? (
            <ActivityIndicator size="small" />
          ) : logs.length === 0 ? (
            <Text className="text-xs text-muted text-center py-3">No webhook deliveries yet.</Text>
          ) : (
            <View className="gap-2">
              {logs.map((log) => (
                <View key={log.id} className="flex-row items-center py-2 border-b border-border">
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: log.success ? "#22C55E" : "#EF4444", marginRight: 8 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-medium text-foreground">{log.event}</Text>
                    <Text className="text-xs text-muted">
                      {log.responseStatus ? `HTTP ${log.responseStatus}` : "No response"} • Attempt {log.attemptNumber}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">{new Date(log.sentAt).toLocaleTimeString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Signature Verification Guide */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Text className="text-sm font-semibold text-primary mb-2">Signature Verification</Text>
          <Text className="text-xs text-muted leading-relaxed mb-2">
            Each webhook includes an X-DROPi-Signature header containing an HMAC-SHA256 signature of the request body using your webhook secret.
          </Text>
          <View className="bg-background border border-border rounded-lg p-3">
            <Text className="text-xs font-mono text-foreground leading-relaxed">
              {`const crypto = require('crypto');\nconst sig = crypto\n  .createHmac('sha256', webhookSecret)\n  .update(requestBody)\n  .digest('hex');\n// Compare sig with X-DROPi-Signature header`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
