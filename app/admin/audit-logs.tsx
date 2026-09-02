/**
 * Audit Core Investigator Viewer
 * Read-only, channel-separated evidence retrieval for Owner and Audit Manager.
 * Supports multi-criteria filtering plus real JSON/CSV export.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

type SeverityFilter = "all" | "info" | "warning" | "critical";
type ChannelFilter = "C1" | "C2" | "C3" | "ADMIN";
type ExportFormat = "json" | "csv";

function parseUtcDate(value: string, endOfDay: boolean): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const parsed = new Date(`${trimmed}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseActorId(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

async function deliverExport(payload: { filename: string; contentType: string; content: string }) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([payload.content], { type: payload.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: payload.filename,
    message: payload.content,
  });
}

export default function AuditLogsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading, isDemo } = useDropiAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [channel, setChannel] = useState<ChannelFilter>("C1");
  const [searchAction, setSearchAction] = useState("");
  const [actorId, setActorId] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showPhantomOnly, setShowPhantomOnly] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const authorized = Boolean(
    user && !isDemo && (user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager"),
  );
  const parsedActorId = parseActorId(actorId);
  const parsedFrom = parseUtcDate(fromDate, false);
  const parsedTo = parseUtcDate(toDate, true);
  const actorInvalid = actorId.trim().length > 0 && parsedActorId === undefined;
  const fromInvalid = fromDate.trim().length > 0 && parsedFrom === undefined;
  const toInvalid = toDate.trim().length > 0 && parsedTo === undefined;
  const rangeInvalid = Boolean(parsedFrom && parsedTo && parsedFrom > parsedTo);
  const filtersValid = !actorInvalid && !fromInvalid && !toInvalid && !rangeInvalid;

  const filterInput: any = { channel };
  if (severity !== "all") filterInput.severity = severity;
  if (searchAction.trim()) filterInput.action = searchAction.trim();
  if (parsedActorId !== undefined) filterInput.userId = parsedActorId;
  if (resourceType.trim()) filterInput.resourceType = resourceType.trim();
  if (resourceId.trim()) filterInput.resourceId = resourceId.trim();
  if (parsedFrom) filterInput.from = parsedFrom;
  if (parsedTo) filterInput.to = parsedTo;
  if (showPhantomOnly) filterInput.phantomMode = true;

  const queryEnabled = authorized && filtersValid;
  const logsQuery = trpc.audit.list.useQuery(
    { ...filterInput, page, limit: 30 },
    { enabled: queryEnabled },
  );
  const statsInput: any = { channel };
  if (parsedFrom) statsInput.from = parsedFrom;
  if (parsedTo) statsInput.to = parsedTo;
  const statsQuery = trpc.audit.getStats.useQuery(statsInput, { enabled: queryEnabled });
  const csvExportQuery = trpc.audit.export.useQuery(
    { ...filterInput, format: "csv" },
    { enabled: false, retry: false },
  );
  const jsonExportQuery = trpc.audit.export.useQuery(
    { ...filterInput, format: "json" },
    { enabled: false, retry: false },
  );

  const logs = logsQuery.data?.logs || [];
  const totalCount = logsQuery.data?.total || 0;
  const stats = statsQuery.data;
  const totalPages = Math.max(1, Math.ceil(totalCount / 30));

  const onRefresh = () => {
    if (!queryEnabled) return;
    setRefreshing(true);
    Promise.all([logsQuery.refetch(), statsQuery.refetch()]).finally(() => setRefreshing(false));
  };

  const handleExport = async (format: ExportFormat) => {
    if (!authorized) {
      Alert.alert("Access denied", "Audit export requires Owner or Auditor authority.");
      return;
    }
    if (!filtersValid) {
      Alert.alert("Invalid filters", "Use a positive actor ID and UTC dates in YYYY-MM-DD format. The start date must not be after the end date.");
      return;
    }

    setExporting(format);
    try {
      const result = await (format === "csv" ? csvExportQuery.refetch() : jsonExportQuery.refetch());
      if (result.error) throw result.error;
      if (!result.data) throw new Error("Audit export returned no payload.");
      await deliverExport(result.data);
      if (result.data.truncated) {
        Alert.alert(
          "Export truncated",
          `The export contains the first ${result.data.rowCount} matching records. Narrow the filters to export the remaining evidence.`,
        );
      }
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "Audit export could not be generated.");
    } finally {
      setExporting(null);
    }
  };

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!authorized) {
    return (
      <ScreenContainer className="px-4 pt-4">
        <View className="bg-surface border border-border rounded-2xl p-5 mt-4">
          <Text className="text-xl font-bold text-foreground mb-2">Audit Core</Text>
          <Text className="text-sm text-muted mb-4">
            Full audit evidence is restricted to the Owner/System Administrator and Audit Manager. Demo sessions never expose real audit data.
          </Text>
          <Pressable onPress={() => safeGoBack(router)} className="bg-primary rounded-xl p-3 items-center">
            <Text className="text-white font-semibold">Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Audit Core</Text>
            <Text className="text-sm text-muted">{totalCount} matching entries · UTC evidence</Text>
          </View>
          <Pressable
            onPress={() => safeGoBack(router)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]}
          >
            <Text className="text-primary text-sm font-medium">← Back</Text>
          </Pressable>
        </View>

        {stats && (
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold text-foreground">{stats.total || 0}</Text>
              <Text className="text-xs text-muted">Channel logs</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold" style={{ color: "#F59E0B" }}>{stats.warningCount || 0}</Text>
              <Text className="text-xs text-muted">Warnings</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold" style={{ color: "#EF4444" }}>{stats.criticalCount || 0}</Text>
              <Text className="text-xs text-muted">Critical</Text>
            </View>
          </View>
        )}

        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Investigation filters</Text>

          <TextInput
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
            placeholder="Action contains..."
            placeholderTextColor={colors.muted}
            value={searchAction}
            onChangeText={(value) => { setSearchAction(value); setPage(1); }}
          />
          <TextInput
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-2"
            placeholder="Actor user ID"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={actorId}
            onChangeText={(value) => { setActorId(value); setPage(1); }}
          />
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              placeholder="Resource type"
              placeholderTextColor={colors.muted}
              value={resourceType}
              onChangeText={(value) => { setResourceType(value); setPage(1); }}
            />
            <TextInput
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              placeholder="Resource ID"
              placeholderTextColor={colors.muted}
              value={resourceId}
              onChangeText={(value) => { setResourceId(value); setPage(1); }}
            />
          </View>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              placeholder="From UTC YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={fromDate}
              onChangeText={(value) => { setFromDate(value); setPage(1); }}
            />
            <TextInput
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              placeholder="To UTC YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={toDate}
              onChangeText={(value) => { setToDate(value); setPage(1); }}
            />
          </View>
          {!filtersValid && (
            <Text style={{ color: "#EF4444", fontSize: 11, marginBottom: 10 }}>
              Invalid actor/date filter. Actor ID must be positive; dates use YYYY-MM-DD UTC and From ≤ To.
            </Text>
          )}

          <Text className="text-xs text-muted mb-1">Severity</Text>
          <View className="flex-row gap-2 mb-3">
            {(["all", "info", "warning", "critical"] as SeverityFilter[]).map((value) => (
              <Pressable
                key={value}
                onPress={() => { setSeverity(value); setPage(1); }}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: severity === value ? colors.primary : colors.background,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: severity === value ? colors.primary : colors.border,
                }]}
              >
                <Text style={{ color: severity === value ? "#FFFFFF" : colors.foreground, fontSize: 11, fontWeight: "600" }}>
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-xs text-muted mb-1">Channel</Text>
          <View className="flex-row gap-2 mb-3">
            {(["C1", "C2", "C3", "ADMIN"] as ChannelFilter[]).map((value) => (
              <Pressable
                key={value}
                onPress={() => { setChannel(value); setPage(1); }}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: channel === value ? colors.primary : colors.background,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: channel === value ? colors.primary : colors.border,
                }]}
              >
                <Text style={{ color: channel === value ? "#FFFFFF" : colors.foreground, fontSize: 11, fontWeight: "600" }}>
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => { setShowPhantomOnly(!showPhantomOnly); setPage(1); }}
            style={({ pressed }) => [{
              opacity: pressed ? 0.7 : 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: showPhantomOnly ? "#8B5CF620" : colors.background,
              borderWidth: 1,
              borderColor: showPhantomOnly ? "#8B5CF6" : colors.border,
              borderRadius: 8,
              padding: 10,
            }]}
          >
            <Text style={{ fontSize: 16, marginRight: 8 }}>👻</Text>
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-medium text-foreground">Phantom Mode Only</Text>
              <Text className="text-xs text-muted">Only delegated admin-as-user actions</Text>
            </View>
            <Text style={{ color: showPhantomOnly ? "#8B5CF6" : colors.muted, fontWeight: "700" }}>
              {showPhantomOnly ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>

        {logsQuery.isLoading ? (
          <View className="items-center py-8"><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : logsQuery.error ? (
          <View className="bg-surface border border-border rounded-xl p-4 mb-4">
            <Text style={{ color: "#EF4444", fontWeight: "600" }}>Audit retrieval failed</Text>
            <Text className="text-xs text-muted mt-1">{logsQuery.error.message}</Text>
          </View>
        ) : logs.length === 0 ? (
          <View className="items-center py-8">
            <Text style={{ fontSize: 32 }}>📭</Text>
            <Text className="text-muted mt-2">No audit logs match these filters</Text>
          </View>
        ) : (
          <View className="gap-2 mb-4">
            {logs.map((log: any) => <AuditLogEntry key={log.id} log={log} colors={colors} />)}
          </View>
        )}

        {totalPages > 1 && (
          <View className="flex-row items-center justify-center gap-4 mb-4">
            <Pressable
              onPress={() => setPage(Math.max(1, page - 1))}
              style={({ pressed }) => [{ opacity: pressed || page === 1 ? 0.4 : 1, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
              disabled={page === 1}
            >
              <Text className="text-foreground font-medium">← Prev</Text>
            </Pressable>
            <Text className="text-sm text-muted">Page {page} of {totalPages}</Text>
            <Pressable
              onPress={() => setPage(Math.min(totalPages, page + 1))}
              style={({ pressed }) => [{ opacity: pressed || page === totalPages ? 0.4 : 1, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }]}
              disabled={page === totalPages}
            >
              <Text className="text-foreground font-medium">Next →</Text>
            </Pressable>
          </View>
        )}

        <View className="bg-surface border border-border rounded-2xl p-4 mb-10">
          <Text className="text-sm font-semibold text-foreground mb-1">Evidence export</Text>
          <Text className="text-xs text-muted mb-3">
            Exports use the active filters and contain at most 5,000 rows. Narrow the filters if the server reports truncation.
          </Text>
          <View className="flex-row gap-2">
            {(["csv", "json"] as ExportFormat[]).map((format) => (
              <Pressable
                key={format}
                onPress={() => handleExport(format)}
                disabled={exporting !== null || !filtersValid}
                style={({ pressed }) => [{
                  flex: 1,
                  opacity: pressed || exporting !== null || !filtersValid ? 0.5 : 1,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }]}
              >
                {exporting === format ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Export {format.toUpperCase()}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function AuditLogEntry({ log, colors }: { log: any; colors: any }) {
  const severityColors: Record<string, string> = {
    info: "#0066FF",
    warning: "#F59E0B",
    critical: "#EF4444",
  };
  const sevColor = severityColors[log.severity] || "#6B7280";
  const isPhantom = Boolean(log.isPhantomMode);
  const isAI = Boolean(log.isAIAction);
  const timeStr = log.createdAt
    ? new Date(log.createdAt).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " UTC"
    : "";

  return (
    <View style={{
      backgroundColor: isPhantom ? "#8B5CF610" : colors.surface,
      borderWidth: 1,
      borderColor: isPhantom ? "#8B5CF640" : colors.border,
      borderRadius: 12,
      padding: 12,
    }}>
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          {isPhantom && <Text style={{ fontSize: 12, marginRight: 4 }}>👻</Text>}
          {isAI && <Text style={{ fontSize: 12, marginRight: 4 }}>🤖</Text>}
          <Text className="text-sm font-medium text-foreground" numberOfLines={1} style={{ flex: 1 }}>{log.action}</Text>
        </View>
        <View style={{ backgroundColor: sevColor + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: sevColor, fontSize: 9, fontWeight: "700" }}>{(log.severity || "info").toUpperCase()}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text style={{ fontSize: 10, color: colors.muted, backgroundColor: colors.background, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginRight: 6 }}>
            {log.channel}
          </Text>
          <Text className="text-xs text-muted">User #{log.userId} · {log.userRole}</Text>
        </View>
        <Text className="text-xs text-muted">{timeStr}</Text>
      </View>

      {isPhantom && (
        <Text style={{ marginTop: 4, fontSize: 10, color: "#8B5CF6", fontWeight: "600" }}>
          PHANTOM — Admin #{log.phantomAdminId} acting as User #{log.userId}
        </Text>
      )}
      {isAI && (
        <Text style={{ marginTop: 2, fontSize: 10, color: "#06B6D4", fontWeight: "600" }}>AI PERSONAL ACTION</Text>
      )}
      {log.resourceType && (
        <Text className="text-xs text-muted mt-1">Resource: {log.resourceType} #{log.resourceId || "—"}</Text>
      )}
      {log.sessionId && (
        <Text className="text-xs text-muted mt-1">Session #{log.sessionId}</Text>
      )}
    </View>
  );
}
