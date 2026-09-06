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
import { TEST_ROLE_IDENTITIES } from "@/shared/test-role-accounts";

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

interface ProvisionResult {
  roles: number;
  humanAccounts: number;
  aiAccounts: number;
  pairedAccounts: number;
  identitiesIncludingBaseSuperAdmin: number;
}

interface TestAccountControlStatus {
  provisioning: {
    enabled: boolean;
    passwordConfigured: boolean;
    passwordPolicySatisfied: boolean;
    zoneConfigured: boolean;
    zone: string | null;
    ready: boolean;
  };
  mail: {
    configured: boolean;
    mode: string | null;
    from: string | null;
  };
  deliveryPartner: {
    email: string;
    baseInbox: string;
    exists: boolean;
    active: boolean;
    passwordReady: boolean;
    emailVerified: boolean;
  };
}

interface RecoveryProbeResult {
  accepted: boolean;
  alias: string;
  baseInbox: string;
  message: string;
}

type InventoryView = "root" | "test" | "normal" | "all-ai";
type TestAccountKind = "human" | "ai" | null;

const CHANNEL_ORDER = ["C1", "C2", "C3", "ADMIN"] as const;
type GovernedChannel = (typeof CHANNEL_ORDER)[number];

const TEST_HUMAN_EMAILS = new Set(
  TEST_ROLE_IDENTITIES.map((identity) => identity.humanEmail.trim().toLowerCase()),
);
const TEST_AI_EMAILS = new Set(
  TEST_ROLE_IDENTITIES.map((identity) => identity.aiEmail.trim().toLowerCase()),
);

function normalizedEmail(email: string | null): string {
  return email?.trim().toLowerCase() || "";
}

function isTestHuman(target: PhantomTarget): boolean {
  return TEST_HUMAN_EMAILS.has(normalizedEmail(target.email));
}

function isTestAi(target: PhantomTarget): boolean {
  return TEST_AI_EMAILS.has(normalizedEmail(target.email));
}

function isNormalAccount(target: PhantomTarget): boolean {
  return !target.isAIAgent && !isTestHuman(target) && !isTestAi(target);
}

function getApiTrpcUrl(): string {
  if (Platform.OS === "web") {
    const base = getApiBaseUrl();
    return base ? `${base}/api/trpc` : "/api/trpc";
  }
  return `${getRequiredApiBaseUrl("phantom console")}/api/trpc`;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function unwrapResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error?.json?.message || data.error?.message || fallbackMessage);
  }
  return data.result?.data?.json ?? data.result?.data;
}

async function loadTargets(token: string): Promise<{ targets: PhantomTarget[]; total: number }> {
  const input = encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 100 } }));
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.targets?input=${input}`, {
    headers: authHeaders(token),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to load users");
}

async function loadControlStatus(token: string): Promise<TestAccountControlStatus> {
  const input = encodeURIComponent(JSON.stringify({ json: null }));
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.testAccountControlStatus?input=${input}`, {
    headers: authHeaders(token),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to load test-account control status");
}

async function reconcileAccounts(token: string): Promise<ProvisionResult> {
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.provisionTestAccounts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ json: {} }),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to reconcile test-role accounts");
}

async function sendRecoveryProbe(token: string): Promise<RecoveryProbeResult> {
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.sendDeliveryPartnerRecoveryProbe`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ json: {} }),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to send Delivery Partner recovery probe");
}

export default function PhantomConsoleScreen() {
  const router = useRouter();
  const { user, token, isDemo, isPhantom, enterPhantomSession } = useDropiAuth();
  const [targets, setTargets] = useState<PhantomTarget[]>([]);
  const [controlStatus, setControlStatus] = useState<TestAccountControlStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [diagnosingRecovery, setDiagnosingRecovery] = useState(false);
  const [inventoryView, setInventoryView] = useState<InventoryView>("root");
  const [testAccountKind, setTestAccountKind] = useState<TestAccountKind>(null);
  const [selectedChannel, setSelectedChannel] = useState<GovernedChannel | null>(null);

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
      const [targetResult, statusResult] = await Promise.all([
        loadTargets(token),
        loadControlStatus(token),
      ]);
      setTargets(targetResult.targets || []);
      setControlStatus(statusResult);
    } catch (err: any) {
      setError(err.message || "Unable to load phantom console");
    } finally {
      setLoading(false);
    }
  }, [authorized, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const roleCompare = a.dropiRole.localeCompare(b.dropiRole);
      if (roleCompare !== 0) return roleCompare;
      return (a.name || a.email || "").localeCompare(b.name || b.email || "");
    });
  }, [targets]);

  const inventoryCounts = useMemo(() => {
    const testHumans = targets.filter(isTestHuman).length;
    const testAi = targets.filter(isTestAi).length;
    const normal = targets.filter(isNormalAccount).length;
    const allAi = targets.filter((target) => target.isAIAgent).length;
    return {
      testHumans,
      testAi,
      testTotal: testHumans + testAi,
      normal,
      allAi,
    };
  }, [targets]);

  const activePopulation = useMemo(() => {
    if (inventoryView === "normal") return sortedTargets.filter(isNormalAccount);
    if (inventoryView === "all-ai") return sortedTargets.filter((target) => target.isAIAgent);
    if (inventoryView === "test" && testAccountKind === "human") return sortedTargets.filter(isTestHuman);
    if (inventoryView === "test" && testAccountKind === "ai") return sortedTargets.filter(isTestAi);
    return [];
  }, [inventoryView, sortedTargets, testAccountKind]);

  const availableChannels = useMemo(() => {
    return CHANNEL_ORDER.map((channel) => ({
      channel,
      count: activePopulation.filter((target) => target.channel === channel).length,
    })).filter((entry) => entry.count > 0);
  }, [activePopulation]);

  const visibleTargets = useMemo(() => {
    if (!selectedChannel) return [];
    const needle = search.trim().toLowerCase();
    const inChannel = activePopulation.filter((target) => target.channel === selectedChannel);
    if (!needle) return inChannel;
    return inChannel.filter((target) =>
      [target.name, target.email, target.dropiRole, target.channel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [activePopulation, search, selectedChannel]);

  const activeTitle = useMemo(() => {
    if (inventoryView === "normal") return "NORMAL ACCOUNTS";
    if (inventoryView === "all-ai") return "ALL AI ACCOUNTS";
    if (inventoryView === "test" && testAccountKind === "human") return "TEST ACCOUNTS · HUMAN";
    if (inventoryView === "test" && testAccountKind === "ai") return "TEST ACCOUNTS · AI";
    if (inventoryView === "test") return "TEST ACCOUNTS";
    return "ACCOUNT DIRECTORY";
  }, [inventoryView, testAccountKind]);

  const resetToRoot = useCallback(() => {
    setInventoryView("root");
    setTestAccountKind(null);
    setSelectedChannel(null);
    setSearch("");
  }, []);

  const goDirectoryBack = useCallback(() => {
    if (selectedChannel) {
      setSelectedChannel(null);
      setSearch("");
      return;
    }
    if (inventoryView === "test" && testAccountKind) {
      setTestAccountKind(null);
      return;
    }
    resetToRoot();
  }, [inventoryView, resetToRoot, selectedChannel, testAccountKind]);

  const confirmProvision = useCallback(() => {
    if (!token || provisioning) return;
    if (!controlStatus?.provisioning.ready) {
      Alert.alert(
        "Server provisioning not ready",
        "Railway must provide DROPI_TEST_ACCOUNT_PROVISIONING=enabled, a policy-compliant DROPI_TEST_ACCOUNT_PASSWORD, and DROPI_TEST_ACCOUNT_ZONE.",
      );
      return;
    }

    Alert.alert(
      "Reconcile canonical test accounts?",
      `This will rotate/reconcile 29 human test identities and 29 AI role agents using the server-owned password and zone ${controlStatus.provisioning.zone}. Existing test-account sessions and push registrations will be revoked. The real base Super Admin is not modified.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reconcile",
          style: "destructive",
          onPress: async () => {
            setProvisioning(true);
            try {
              const result = await reconcileAccounts(token);
              await refresh();
              Alert.alert(
                "Test-role accounts reconciled",
                `${result.humanAccounts} human + ${result.aiAccounts} AI role agents across ${result.roles} roles now use the authoritative server configuration.`,
              );
            } catch (err: any) {
              Alert.alert("Reconciliation blocked", err.message || "Unable to reconcile test-role accounts");
            } finally {
              setProvisioning(false);
            }
          },
        },
      ],
    );
  }, [controlStatus, provisioning, refresh, token]);

  const confirmRecoveryProbe = useCallback(() => {
    if (!token || diagnosingRecovery || !controlStatus) return;
    if (!controlStatus.deliveryPartner.exists) {
      Alert.alert("Account missing", "Reconcile canonical test accounts before testing password recovery.");
      return;
    }
    if (!controlStatus.mail.configured) {
      Alert.alert("Mail transport unavailable", "Configure the server mail provider before testing recovery delivery.");
      return;
    }

    Alert.alert(
      "Send real recovery code?",
      `DROPi will run the real password-recovery flow for ${controlStatus.deliveryPartner.email}. Gmail plus-addressing should deliver it to ${controlStatus.deliveryPartner.baseInbox}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send code",
          onPress: async () => {
            setDiagnosingRecovery(true);
            try {
              const result = await sendRecoveryProbe(token);
              Alert.alert(
                "Recovery request accepted",
                `${result.alias} → ${result.baseInbox}\n\n${result.message}`,
              );
            } catch (err: any) {
              Alert.alert("Recovery delivery failed", err.message || "Unable to send recovery code");
            } finally {
              setDiagnosingRecovery(false);
            }
          },
        },
      ],
    );
  }, [controlStatus, diagnosingRecovery, token]);

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

  const renderTargetCard = useCallback((target: PhantomTarget) => {
    const disabled = !target.isActive || target.id === user?.id || enteringId !== null;
    const badge = target.isAIAgent
      ? "AI ROLE AGENT"
      : isTestHuman(target)
        ? "TEST HUMAN"
        : "NORMAL";

    return (
      <View key={target.id} className="bg-surface border border-border rounded-xl p-4 mb-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-base font-semibold text-foreground">{target.name || `User #${target.id}`}</Text>
              <Text className="text-xs text-primary font-semibold">{badge}</Text>
              {!target.isActive ? <Text className="text-xs text-error font-semibold">INACTIVE</Text> : null}
            </View>
            <Text className="text-xs text-muted mt-1">{target.email || "No email"}</Text>
            <Text className="text-xs text-muted mt-1">
              {target.dropiRole} · {target.channel}{target.zone ? ` · ${target.zone}` : ""}
            </Text>
            {target.isAIAgent ? (
              <Text className="text-xs text-muted mt-1">
                Human counterpart ID: {target.humanPairId ?? "not materialized"} · mode: {target.agentMode || "unset"}
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
              <Text className="text-white text-xs font-semibold">{target.id === user?.id ? "Current" : "Enter"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [confirmEnter, enteringId, user?.id]);

  const renderDirectoryCard = useCallback((
    title: string,
    subtitle: string,
    count: number,
    onPress: () => void,
  ) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} className="mb-3">
      <View className="bg-surface border border-border rounded-xl p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{title}</Text>
            <Text className="text-xs text-muted mt-1 leading-4">{subtitle}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-primary">{count}</Text>
            <Text className="text-xs text-primary mt-1">Open →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

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

        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground">Canonical test-account control</Text>
          <Text className="text-xs text-muted mt-2 leading-5">
            Railway/server environment is the only password and zone authority. The mobile app never asks for or transmits the shared test password. Reconciliation rotates every canonical test-account hash and revokes stale test sessions.
          </Text>

          <View className="mt-4 gap-1">
            <Text className="text-xs text-foreground">
              Provisioning: {controlStatus?.provisioning.ready ? "READY" : "BLOCKED"}
            </Text>
            <Text className="text-xs text-muted">
              Enabled {controlStatus?.provisioning.enabled ? "✓" : "✕"} · Password configured {controlStatus?.provisioning.passwordConfigured ? "✓" : "✕"} · Policy {controlStatus?.provisioning.passwordPolicySatisfied ? "✓" : "✕"} · Zone {controlStatus?.provisioning.zone || "not configured"}
            </Text>
            <Text className="text-xs text-muted">
              Mail: {controlStatus?.mail.configured ? `${controlStatus.mail.mode || "configured"} · ${controlStatus.mail.from || "sender configured"}` : "NOT CONFIGURED"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={confirmProvision}
            disabled={provisioning || !controlStatus?.provisioning.ready}
            className="border border-primary rounded-lg py-2.5 items-center mt-4"
            style={{ opacity: provisioning || !controlStatus?.provisioning.ready ? 0.45 : 1 }}
          >
            {provisioning ? (
              <ActivityIndicator size="small" color="#0a7ea4" />
            ) : (
              <Text className="text-primary text-sm font-semibold">Reconcile 29 human + 29 AI from server configuration</Text>
            )}
          </TouchableOpacity>

          <View className="border-t border-border mt-4 pt-4">
            <Text className="text-xs font-semibold text-foreground">Delivery Partner recovery diagnostic</Text>
            <Text className="text-xs text-muted mt-1 leading-5">
              Alias: {controlStatus?.deliveryPartner.email || "loading"}\nBase inbox: {controlStatus?.deliveryPartner.baseInbox || "loading"}
            </Text>
            <Text className="text-xs text-muted mt-1">
              Account {controlStatus?.deliveryPartner.exists ? "exists ✓" : "missing ✕"} · Active {controlStatus?.deliveryPartner.active ? "✓" : "✕"} · Password {controlStatus?.deliveryPartner.passwordReady ? "✓" : "✕"} · Email verified {controlStatus?.deliveryPartner.emailVerified ? "✓" : "✕"}
            </Text>
            <TouchableOpacity
              onPress={confirmRecoveryProbe}
              disabled={diagnosingRecovery || !controlStatus?.mail.configured || !controlStatus?.deliveryPartner.exists}
              className="border border-primary rounded-lg py-2.5 items-center mt-3"
              style={{ opacity: diagnosingRecovery || !controlStatus?.mail.configured || !controlStatus?.deliveryPartner.exists ? 0.45 : 1 }}
            >
              {diagnosingRecovery ? (
                <ActivityIndicator size="small" color="#0a7ea4" />
              ) : (
                <Text className="text-primary text-sm font-semibold">Send real Delivery Partner recovery code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-surface border border-border rounded-xl p-3 mb-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">IDENTITY INVENTORY</Text>
              <Text className="text-xs text-muted mt-1">
                Test {inventoryCounts.testTotal} · Normal {inventoryCounts.normal} · All AI {inventoryCounts.allAi}
              </Text>
            </View>
            <TouchableOpacity onPress={refresh} disabled={loading}>
              <Text className="text-primary text-sm font-medium">Refresh</Text>
            </TouchableOpacity>
          </View>
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
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">{activeTitle}</Text>
              {inventoryView !== "root" ? (
                <TouchableOpacity onPress={goDirectoryBack}>
                  <Text className="text-primary text-sm font-medium">← Back one level</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {inventoryView === "root" ? (
              <View>
                {renderDirectoryCard(
                  "TEST ACCOUNTS",
                  "Open the governed test population, then choose HUMAN or AI.",
                  inventoryCounts.testTotal,
                  () => {
                    setInventoryView("test");
                    setTestAccountKind(null);
                    setSelectedChannel(null);
                  },
                )}
                {renderDirectoryCard(
                  "NORMAL ACCOUNTS",
                  "Registered non-test human identities, including real operator and customer accounts.",
                  inventoryCounts.normal,
                  () => {
                    setInventoryView("normal");
                    setTestAccountKind(null);
                    setSelectedChannel(null);
                  },
                )}
                {renderDirectoryCard(
                  "ALL AI ACCOUNTS",
                  "Complete AI inventory. Test AI agents also appear under TEST ACCOUNTS → AI; they are the same database records, not duplicates.",
                  inventoryCounts.allAi,
                  () => {
                    setInventoryView("all-ai");
                    setTestAccountKind(null);
                    setSelectedChannel(null);
                  },
                )}
              </View>
            ) : inventoryView === "test" && testAccountKind === null ? (
              <View>
                {renderDirectoryCard(
                  "HUMAN",
                  "All canonical human test accounts.",
                  inventoryCounts.testHumans,
                  () => {
                    setTestAccountKind("human");
                    setSelectedChannel(null);
                  },
                )}
                {renderDirectoryCard(
                  "AI",
                  "Canonical AI role-agent identities in the test population.",
                  inventoryCounts.testAi,
                  () => {
                    setTestAccountKind("ai");
                    setSelectedChannel(null);
                  },
                )}
              </View>
            ) : selectedChannel === null ? (
              <View>
                <Text className="text-xs text-muted mb-3">
                  Choose a governed channel. Accounts remain hidden until a channel is opened.
                </Text>
                {availableChannels.map((entry) =>
                  renderDirectoryCard(
                    `CHANNEL ${entry.channel}`,
                    `Open ${entry.count} account${entry.count === 1 ? "" : "s"} in this channel.`,
                    entry.count,
                    () => {
                      setSelectedChannel(entry.channel);
                      setSearch("");
                    },
                  ),
                )}
              </View>
            ) : (
              <View>
                <View className="bg-surface border border-border rounded-xl p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-bold text-foreground">CHANNEL {selectedChannel}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {activePopulation.filter((target) => target.channel === selectedChannel).length} accounts
                      </Text>
                    </View>
                    <TouchableOpacity onPress={goDirectoryBack}>
                      <Text className="text-primary text-sm font-medium">← Channels</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search this channel by name, email, or role"
                  placeholderTextColor="#9BA1A6"
                  autoCapitalize="none"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
                />

                {visibleTargets.length === 0 ? (
                  <View className="bg-surface border border-border rounded-xl p-4">
                    <Text className="text-sm text-muted">No accounts match this search.</Text>
                  </View>
                ) : (
                  visibleTargets.map(renderTargetCard)
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
