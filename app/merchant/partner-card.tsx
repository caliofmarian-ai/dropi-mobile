/**
 * Partner Card Screen — Sprint E Upgrade
 *
 * Per Blueprint section 9.1: External B2B partners see a dedicated Partner Card
 * with their store branding, API usage stats, storefront redirect URL, and
 * integration status overview.
 *
 * This is the public-facing "business card" for B2B partners — shows their
 * integration health, usage metrics, and provides a shareable partner profile.
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, RefreshControl, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function PartnerCardScreen() {
  const router = useRouter();
  const storeQuery = trpc.store.getMyStore.useQuery();
  const apiKeysQuery = trpc.apiKey.list.useQuery(undefined, { enabled: !!storeQuery.data });
  const webhooksQuery = trpc.webhook.list.useQuery(undefined, { enabled: !!storeQuery.data });
  const deliveriesQuery = trpc.b2bDelivery.list.useQuery(undefined, { enabled: !!storeQuery.data });

  const [refreshing, setRefreshing] = useState(false);

  const store = storeQuery.data;

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
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🏢</Text>
        <Text className="text-lg font-semibold text-foreground text-center">Partner Card</Text>
        <Text className="text-sm text-muted text-center mt-2">
          Partner Card is available for external B2B stores only.
        </Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-medium">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const activeKeys = (apiKeysQuery.data || []).filter((k) => k.isActive).length;
  const activeWebhooks = (webhooksQuery.data || []).filter((w) => w.isActive).length;
  const totalDeliveries = deliveriesQuery.data?.total || 0;
  const completedDeliveries = (deliveriesQuery.data?.deliveries || []).filter((d) => d.status === "delivered").length;

  // Integration health score
  const healthChecks = [
    { label: "Store Active", passed: store.status === "active" },
    { label: "API Key Generated", passed: activeKeys > 0 },
    { label: "Webhook Configured", passed: activeWebhooks > 0 },
    { label: "First Delivery Made", passed: totalDeliveries > 0 },
  ];
  const healthScore = Math.round((healthChecks.filter((c) => c.passed).length / healthChecks.length) * 100);

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(text);
    }
    Alert.alert("Copied", "Copied to clipboard");
  };

  const partnerProfileUrl = `https://partners.dropi.app/${store.id}`;

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
            <Text className="text-2xl font-bold text-foreground">Partner Card</Text>
            <Text className="text-xs text-muted">Your B2B integration profile</Text>
          </View>
        </View>

        {/* Partner Card Visual */}
        <View className="bg-surface border border-border rounded-3xl p-6 mb-4" style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
          {/* Store Branding */}
          <View className="items-center mb-4">
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#0a7ea415", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>🏪</Text>
            </View>
            <Text className="text-xl font-bold text-foreground text-center">{store.name}</Text>
            <Text className="text-sm text-muted text-center mt-1">{store.category} • {store.zone}</Text>
            <View className="flex-row items-center mt-2">
              <View style={{ backgroundColor: store.status === "active" ? "#22C55E20" : "#F59E0B20", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                <Text style={{ color: store.status === "active" ? "#22C55E" : "#F59E0B", fontSize: 12, fontWeight: "600" }}>
                  {store.status === "active" ? "Active Partner" : "Pending Activation"}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="border-t border-border my-4" />

          {/* Partner ID */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-muted">Partner ID</Text>
            <TouchableOpacity onPress={() => copyToClipboard(`DROPI-P-${store.id}`)}>
              <Text className="text-xs font-mono text-primary">DROPI-P-{store.id}</Text>
            </TouchableOpacity>
          </View>

          {/* Storefront URL */}
          {store.externalUrl && (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs text-muted">Storefront</Text>
              <TouchableOpacity onPress={() => Linking.openURL(store.externalUrl!)}>
                <Text className="text-xs text-primary" numberOfLines={1} style={{ maxWidth: 180 }}>
                  {store.externalUrl}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Trust Score */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-muted">Trust Score</Text>
            <Text className="text-xs font-semibold text-foreground">{store.trustScore}/100</Text>
          </View>

          {/* Member Since */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted">Member Since</Text>
            <Text className="text-xs text-foreground">{new Date(store.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Integration Health */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-foreground">Integration Health</Text>
            <View style={{ backgroundColor: healthScore === 100 ? "#22C55E20" : healthScore >= 50 ? "#F59E0B20" : "#EF444420", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: healthScore === 100 ? "#22C55E" : healthScore >= 50 ? "#F59E0B" : "#EF4444", fontSize: 12, fontWeight: "700" }}>
                {healthScore}%
              </Text>
            </View>
          </View>

          <View className="gap-2">
            {healthChecks.map((check, i) => (
              <View key={i} className="flex-row items-center">
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: check.passed ? "#22C55E20" : "#EF444420", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <Text style={{ fontSize: 10, color: check.passed ? "#22C55E" : "#EF4444" }}>
                    {check.passed ? "✓" : "✗"}
                  </Text>
                </View>
                <Text className={`text-sm ${check.passed ? "text-foreground" : "text-muted"}`}>{check.label}</Text>
              </View>
            ))}
          </View>

          {healthScore < 100 && (
            <TouchableOpacity
              className="mt-3 bg-primary/10 rounded-xl py-2.5 items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/api-integration" as any)}
            >
              <Text className="text-primary text-sm font-medium">Complete Setup →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* API Usage Stats */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">API Usage</Text>
          <View className="flex-row justify-between">
            <StatCard label="Active Keys" value={String(activeKeys)} color="#3B82F6" />
            <StatCard label="Webhooks" value={String(activeWebhooks)} color="#8B5CF6" />
            <StatCard label="Deliveries" value={String(totalDeliveries)} color="#0a7ea4" />
            <StatCard label="Completed" value={String(completedDeliveries)} color="#22C55E" />
          </View>
        </View>

        {/* Storefront Redirect */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Storefront Redirect</Text>
          <Text className="text-xs text-muted leading-relaxed mb-3">
            Customers who find your products through DROPi will be redirected to your storefront to complete their purchase. DROPi handles the delivery logistics via the Logistic API.
          </Text>

          {store.externalUrl ? (
            <View className="bg-background border border-border rounded-xl p-3">
              <Text className="text-xs text-muted mb-1">Redirect URL</Text>
              <Text className="text-sm font-mono text-foreground" numberOfLines={2}>{store.externalUrl}</Text>
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  className="flex-1 bg-primary/10 rounded-lg py-2 items-center"
                  activeOpacity={0.7}
                  onPress={() => copyToClipboard(store.externalUrl!)}
                >
                  <Text className="text-primary text-xs font-medium">Copy URL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary/10 rounded-lg py-2 items-center"
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(store.externalUrl!)}
                >
                  <Text className="text-primary text-xs font-medium">Open</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="bg-warning/10 border border-warning/20 rounded-xl p-3">
              <Text className="text-xs text-muted">
                No storefront URL configured. Go to Store Setup to add your external URL.
              </Text>
              <TouchableOpacity
                className="mt-2 bg-warning/20 rounded-lg py-2 items-center"
                activeOpacity={0.7}
                onPress={() => router.push("/merchant/store-setup" as any)}
              >
                <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "600" }}>Configure Store →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Partner Profile Link */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Partner Profile</Text>
          <Text className="text-xs text-muted leading-relaxed mb-3">
            Share your DROPi partner profile with customers to show your delivery integration status and trust score.
          </Text>
          <View className="bg-background border border-border rounded-xl px-3 py-2.5 mb-2">
            <Text className="text-xs font-mono text-foreground" selectable>{partnerProfileUrl}</Text>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl py-2.5 items-center"
            activeOpacity={0.7}
            onPress={() => copyToClipboard(partnerProfileUrl)}
          >
            <Text className="text-background text-sm font-medium">Copy Profile Link</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Quick Actions</Text>
          <View className="gap-2">
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/api-integration" as any)}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔑</Text>
              <Text className="text-sm font-medium text-foreground flex-1">Manage API Keys</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/webhook-config" as any)}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>🔔</Text>
              <Text className="text-sm font-medium text-foreground flex-1">Webhook Configuration</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/api-docs" as any)}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>📖</Text>
              <Text className="text-sm font-medium text-foreground flex-1">API Documentation</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-background border border-border rounded-xl p-3 flex-row items-center"
              activeOpacity={0.7}
              onPress={() => router.push("/merchant/store-setup" as any)}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>⚙️</Text>
              <Text className="text-sm font-medium text-foreground flex-1">Store Settings</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* B2B Model Info */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <Text className="text-sm font-semibold text-primary mb-2">How B2B Integration Works</Text>
          <Text className="text-xs text-muted leading-relaxed">
            As a B2B partner, your products remain on your own storefront. DROPi provides the delivery logistics layer:{"\n\n"}
            1. Customer orders on your site{"\n"}
            2. Your system calls DROPi Logistic API{"\n"}
            3. DROPi assigns a pilot and handles delivery{"\n"}
            4. You receive webhook updates on delivery progress{"\n"}
            5. Customer receives the package via DROPi network{"\n\n"}
            You do NOT list products on DROPi marketplace. Your storefront URL is used as a redirect for customers who discover your brand through DROPi partner listings.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="items-center">
      <Text style={{ fontSize: 20, fontWeight: "700", color }}>{value}</Text>
      <Text className="text-xs text-muted mt-0.5">{label}</Text>
    </View>
  );
}
