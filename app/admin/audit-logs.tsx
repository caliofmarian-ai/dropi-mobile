/**
 * Audit Log Viewer
 * Full audit trail with filters by action type, actor, date, severity, phantom mode.
 * Supports: phantom mode highlighting, AI action markers, export functionality.
 * Accessible by: System Administrator, Audit Manager, Security Officer, and Authorities.
 */

import { useState } from "react";
import { Text, View, ScrollView, Pressable, RefreshControl, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

type SeverityFilter = "all" | "info" | "warning" | "critical";
type ChannelFilter = "all" | "C1" | "C2" | "C3" | "ADMIN";

export default function AuditLogsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [searchAction, setSearchAction] = useState("");
  const [showPhantomOnly, setShowPhantomOnly] = useState(false);

  // Build query input
  const queryInput: any = { page, limit: 30 };
  if (severity !== "all") queryInput.severity = severity;
  if (channel !== "all") queryInput.channel = channel;
  if (searchAction.trim()) queryInput.action = searchAction.trim();

  const logsQuery = trpc.audit.list.useQuery(queryInput);
  const statsQuery = trpc.audit.getStats.useQuery({});

  const logs = logsQuery.data?.logs || [];
  const totalCount = logsQuery.data?.total || 0;
  const stats = statsQuery.data;

  // Filter phantom mode locally if toggled
  const displayLogs = showPhantomOnly
    ? logs.filter((l: any) => l.isPhantomMode)
    : logs;

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([logsQuery.refetch(), statsQuery.refetch()]).finally(() => setRefreshing(false));
  };

  const totalPages = Math.ceil(totalCount / 30);

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Audit Logs</Text>
            <Text className="text-sm text-muted">{totalCount} total entries</Text>
          </View>
          <Pressable
            onPress={() => safeGoBack(router)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]}
          >
            <Text className="text-primary text-sm font-medium">← Back</Text>
          </Pressable>
        </View>

        {/* Stats Summary */}
        {stats && (
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold text-foreground">{stats.total || 0}</Text>
              <Text className="text-xs text-muted">Total Logs</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold" style={{ color: "#F59E0B" }}>{(stats as any).warningCount || 0}</Text>
              <Text className="text-xs text-muted">Warnings</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-lg font-bold" style={{ color: "#EF4444" }}>{(stats as any).criticalCount || 0}</Text>
              <Text className="text-xs text-muted">Critical</Text>
            </View>
          </View>
        )}

        {/* Filters */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Filters</Text>

          {/* Action Search */}
          <TextInput
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm mb-3"
            placeholder="Search by action type..."
            placeholderTextColor={colors.muted}
            value={searchAction}
            onChangeText={setSearchAction}
            returnKeyType="done"
            onSubmitEditing={() => { setPage(1); logsQuery.refetch(); }}
          />

          {/* Severity Filter */}
          <Text className="text-xs text-muted mb-1">Severity</Text>
          <View className="flex-row gap-2 mb-3">
            {(["all", "info", "warning", "critical"] as SeverityFilter[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => { setSeverity(s); setPage(1); }}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: severity === s ? colors.primary : colors.background,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: severity === s ? colors.primary : colors.border,
                }]}
              >
                <Text style={{ color: severity === s ? "#FFFFFF" : colors.foreground, fontSize: 11, fontWeight: "600" }}>
                  {s.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Channel Filter */}
          <Text className="text-xs text-muted mb-1">Channel</Text>
          <View className="flex-row gap-2 mb-3">
            {(["all", "C1", "C2", "C3", "ADMIN"] as ChannelFilter[]).map((c) => (
              <Pressable
                key={c}
                onPress={() => { setChannel(c); setPage(1); }}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: channel === c ? colors.primary : colors.background,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: channel === c ? colors.primary : colors.border,
                }]}
              >
                <Text style={{ color: channel === c ? "#FFFFFF" : colors.foreground, fontSize: 11, fontWeight: "600" }}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Phantom Mode Toggle */}
          <Pressable
            onPress={() => setShowPhantomOnly(!showPhantomOnly)}
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
              <Text className="text-xs text-muted">Show only admin-as-user actions</Text>
            </View>
            <View style={{
              width: 20, height: 20, borderRadius: 4,
              borderWidth: 2, borderColor: showPhantomOnly ? "#8B5CF6" : colors.border,
              backgroundColor: showPhantomOnly ? "#8B5CF6" : "transparent",
              alignItems: "center", justifyContent: "center",
            }}>
              {showPhantomOnly && <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>✓</Text>}
            </View>
          </Pressable>
        </View>

        {/* Log Entries */}
        {logsQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : displayLogs.length === 0 ? (
          <View className="items-center py-8">
            <Text style={{ fontSize: 32 }}>📭</Text>
            <Text className="text-muted mt-2">No audit logs match your filters</Text>
          </View>
        ) : (
          <View className="gap-2 mb-4">
            {displayLogs.map((log: any) => (
              <AuditLogEntry key={log.id} log={log} colors={colors} />
            ))}
          </View>
        )}

        {/* Pagination */}
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

        {/* Export Button */}
        <Pressable
          onPress={() => {
            // Export functionality — in production this would trigger a server-side CSV/JSON export
            alert("Export triggered. In production, this generates a downloadable audit report.");
          }}
          style={({ pressed }) => [{
            opacity: pressed ? 0.7 : 1,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            marginBottom: 40,
          }]}
        >
          <Text className="text-primary font-semibold">📥 Export Audit Logs</Text>
          <Text className="text-xs text-muted mt-1">Download filtered logs as CSV/JSON</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

// === Audit Log Entry Component ===

function AuditLogEntry({ log, colors }: { log: any; colors: any }) {
  const severityColors: Record<string, string> = {
    info: "#0066FF",
    warning: "#F59E0B",
    critical: "#EF4444",
  };
  const sevColor = severityColors[log.severity] || "#6B7280";

  const isPhantom = log.isPhantomMode;
  const isAI = log.isAIAction;

  const timeStr = log.createdAt
    ? new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <View style={{
      backgroundColor: isPhantom ? "#8B5CF610" : colors.surface,
      borderWidth: 1,
      borderColor: isPhantom ? "#8B5CF640" : colors.border,
      borderRadius: 12,
      padding: 12,
    }}>
      {/* Top row: action + severity */}
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          {isPhantom && <Text style={{ fontSize: 12, marginRight: 4 }}>👻</Text>}
          {isAI && <Text style={{ fontSize: 12, marginRight: 4 }}>🤖</Text>}
          <Text className="text-sm font-medium text-foreground" numberOfLines={1} style={{ flex: 1 }}>
            {log.action}
          </Text>
        </View>
        <View style={{ backgroundColor: sevColor + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: sevColor, fontSize: 9, fontWeight: "700" }}>{(log.severity || "info").toUpperCase()}</Text>
        </View>
      </View>

      {/* Details row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {log.channel && (
            <Text style={{ fontSize: 10, color: colors.muted, backgroundColor: colors.background, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginRight: 6 }}>
              {log.channel}
            </Text>
          )}
          <Text className="text-xs text-muted">User #{log.userId || "system"}</Text>
        </View>
        <Text className="text-xs text-muted">{timeStr}</Text>
      </View>

      {/* Phantom mode indicator */}
      {isPhantom && (
        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#8B5CF6", fontWeight: "600" }}>
            PHANTOM MODE — Admin #{log.phantomAdminId} acting as User #{log.userId}
          </Text>
        </View>
      )}

      {/* AI action indicator */}
      {isAI && (
        <View style={{ marginTop: 2, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#06B6D4", fontWeight: "600" }}>
            AI AGENT ACTION
          </Text>
        </View>
      )}

      {/* Resource info */}
      {log.resourceType && (
        <Text className="text-xs text-muted mt-1">
          Resource: {log.resourceType} #{log.resourceId}
        </Text>
      )}
    </View>
  );
}
