import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { safeGoBack } from "@/lib/safe-back";
import { useDropiAuth } from "@/lib/auth-context";
import { getApiBaseUrl, getRequiredApiBaseUrl } from "@/constants/oauth";

interface PhantomTarget {
  id: number;
  name: string | null;
  email: string | null;
  dropiRole: string;
  channel: string;
  zone: string | null;
  isActive: boolean;
  isAIAgent: boolean;
  agentMode: string | null;
  humanPairId: number | null;
}

function getApiTrpcUrl(): string {
  if (Platform.OS === "web") {
    const base = getApiBaseUrl();
    return base ? `${base}/api/trpc` : "/api/trpc";
  }
  return `${getRequiredApiBaseUrl("phantom console")}/api/trpc`;
}

async function loadTargets(token: string): Promise<{ targets: PhantomTarget[]; total: number }> {
  const input = encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 100 } }));
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.targets?input=${input}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error?.json?.message || data.error?.message || "Unable to load users");
  }
  return data.result?.data?.json ?? data.result?.data ?? { targets: [], total: 0 };
}

export default function PhantomConsoleScreen() {
  const router = useRouter();
  const { user, token, isDemo, isPhantom, enterPhantomSession } = useDropiAuth();
  const [targets, setTargets] = useState<PhantomTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [enteringId, setEnteringId] = useState<number | null>(null);

  const authorized = Boolean(
    user &&
      token &&
      !isDemo &&
      !isPhantom &&
      user.dropiRole === "system_administrator" &&
      user.channel === "ADMIN",
  );

  const refresh = useCallback(async () => {
    if (!token || !authorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await loadTargets(token);
      setTargets(result.targets || []);
    } catch (err: any) {
      setError(err.message || "Unable to load phantom targets");
    } finally {
      setLoading(false);
    }
  }, [authorized, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTargets = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const sorted = [...targets].sort((a, b) => {
      const roleCompare = a.dropiRole.localeCompare(b.dropiRole);
      if (roleCompare !== 0) return roleCompare;
      return Number(a.isAIAgent) - Number(b.isAIAgent);
    });
    if (!needle) return sorted;
    return sorted.filter((target) =>
      [target.name, target.email, target.dropiRole, target.channel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [search, targets]);

  const confirmEnter = useCallback((target: PhantomTarget) => {
    if (!target.isActive || target.id === user?.id) return;
    Alert.alert(
      "Enter Phantom Mode?",
      `You are about to operate as ${target.name || target.email || `user #${target.id}`} (${target.dropiRole}/${target.channel}). This action is recorded as a critical ADMIN audit event.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enter",
          style: "destructive",
          onPress: async () => {
            setEnteringId(target.id);
            const result = await enterPhantomSession(target.id);
            setEnteringId(null);
            if (!result.success) {
              Alert.alert("Phantom mode blocked", result.error || "Unable to enter phantom mode");
              return;
            }
            router.replace("/(tabs)" as any);
          },
        },
      ],
    );
  }, [enterPhantomSession, router, user?.id]);

  if (!authorized) {
    return (
      <ScreenContainer className="p-4">
        <TouchableOpacity onPress={() => safeGoBack(router)} className="mb-5">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-lg font-semibold text-foreground">Phantom Console unavailable</Text>
          <Text className="text-sm text-muted mt-2 leading-5">
            A real System Administrator / ADMIN session is required. Demo and existing phantom sessions cannot open a new phantom session.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ paddingVertical: 6, marginRight: 12 }}>
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Phantom Login Console</Text>
            <Text className="text-xs text-muted">System Administrator only · critical actions are audited</Text>
          </View>
        </View>

        <View className="bg-error/10 border border-error rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-error">Governed impersonation boundary</Text>
          <Text className="text-xs text-muted mt-2 leading-5">
            Phantom mode creates a temporary server session for the selected identity. It does not change that user&apos;s password, role, or account ownership. Use Exit Phantom Mode to return to the administrator session.
          </Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, role, or channel"
          placeholderTextColor="#9BA1A6"
          autoCapitalize="none"
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
        />

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm text-muted">
            {filteredTargets.length} visible / {targets.length} loaded
          </Text>
          <TouchableOpacity onPress={refresh} disabled={loading}>
            <Text className="text-primary text-sm font-medium">Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-muted mt-3">Loading governed identities...</Text>
          </View>
        ) : error ? (
          <View className="bg-error/10 border border-error rounded-xl p-4">
            <Text className="text-error text-sm">{error}</Text>
          </View>
        ) : (
          filteredTargets.map((target) => {
            const disabled = !target.isActive || target.id === user?.id || enteringId !== null;
            return (
              <View key={target.id} className="bg-surface border border-border rounded-xl p-4 mb-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">
                        {target.name || `User #${target.id}`}
                      </Text>
                      <Text className="text-xs text-primary font-semibold">
                        {target.isAIAgent ? "AI MIRROR" : "HUMAN"}
                      </Text>
                      {!target.isActive ? <Text className="text-xs text-error font-semibold">INACTIVE</Text> : null}
                    </View>
                    <Text className="text-xs text-muted mt-1">{target.email || "No email"}</Text>
                    <Text className="text-xs text-muted mt-1">
                      {target.dropiRole} · {target.channel}{target.zone ? ` · ${target.zone}` : ""}
                    </Text>
                    {target.isAIAgent ? (
                      <Text className="text-xs text-muted mt-1">
                        Human pair ID: {target.humanPairId ?? "not materialized"} · mode: {target.agentMode || "unset"}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    disabled={disabled}
                    onPress={() => confirmEnter(target)}
                    className="bg-primary rounded-lg px-3 py-2"
                    style={{ opacity: disabled ? 0.35 : 1 }}
                  >
                    {enteringId === target.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white text-xs font-semibold">
                        {target.id === user?.id ? "Current" : "Enter"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
