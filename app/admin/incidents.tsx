import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

type Channel = "C1" | "C2";
type IncidentType = "all" | "stop" | "fallback" | "delivery_failed";

const TYPE_LABELS: Record<IncidentType, string> = {
  all: "All",
  stop: "STOP",
  fallback: "Fallback",
  delivery_failed: "Failed",
};

export default function IncidentInvestigatorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading, isDemo } = useDropiAuth();
  const [channel, setChannel] = useState<Channel>("C1");
  const [incidentType, setIncidentType] = useState<IncidentType>("all");
  const authorized = Boolean(user && !isDemo && (user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager"));
  const query = trpc.incidents.list.useQuery(
    { channel, eventType: incidentType === "all" ? undefined : incidentType, limit: 100 },
    { enabled: authorized, retry: false },
  );

  if (loading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }
  if (!authorized) {
    return (
      <ScreenContainer className="px-4 pt-4">
        <Text className="text-xl font-bold text-foreground">Incident Reconstruction</Text>
        <Text className="text-sm text-muted mt-2">Available only to Owner/System Administrator and Audit Manager. Demo mode never exposes real incident evidence.</Text>
        <Pressable className="bg-primary rounded-xl p-3 items-center mt-4" onPress={() => safeGoBack(router)}><Text className="text-white font-semibold">Back</Text></Pressable>
      </ScreenContainer>
    );
  }

  const incidents = query.data?.incidents ?? [];
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-foreground">Incident Reconstruction</Text>
            <Text className="text-sm text-muted">Factual evidence only — operational events, telemetry, proof and Audit Core.</Text>
          </View>
          <Pressable onPress={() => safeGoBack(router)}><Text className="text-primary">← Back</Text></Pressable>
        </View>

        <Text className="text-xs font-semibold text-muted mb-2">CHANNEL — NEVER MIXED</Text>
        <View className="flex-row gap-2 mb-4">
          {(["C1", "C2"] as Channel[]).map((item) => (
            <Pressable key={item} onPress={() => setChannel(item)} className={`flex-1 rounded-lg p-3 items-center border ${channel === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
              <Text className={channel === item ? "text-white font-semibold" : "text-foreground font-semibold"}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {(["all", "stop", "fallback", "delivery_failed"] as IncidentType[]).map((item) => (
            <Pressable key={item} onPress={() => setIncidentType(item)} className={`px-3 py-2 rounded-lg border ${incidentType === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
              <Text className={incidentType === item ? "text-white text-xs font-semibold" : "text-foreground text-xs"}>{TYPE_LABELS[item]}</Text>
            </Pressable>
          ))}
        </View>

        {query.isLoading && <ActivityIndicator color={colors.primary} />}
        {query.isError && <Text className="text-error text-sm mb-3">{query.error.message}</Text>}
        {!query.isLoading && incidents.length === 0 && (
          <View className="bg-surface border border-border rounded-xl p-4"><Text className="text-sm text-muted">No persisted incidents exist for this channel/filter.</Text></View>
        )}

        {incidents.map((incident) => (
          <Pressable
            key={incident.eventUid}
            onPress={() => router.push({ pathname: "/admin/incident/[eventUid]", params: { eventUid: incident.eventUid, channel } } as any)}
            className="bg-surface border border-border rounded-xl p-4 mb-3"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-foreground">{String(incident.eventType).replace(/_/g, " ").toUpperCase()}</Text>
                <Text className="text-xs text-muted mt-1">{incident.targetType} #{incident.targetId} • {new Date(incident.occurredAt).toISOString()}</Text>
              </View>
              <Text className="text-xs font-semibold text-primary">{incident.channel}</Text>
            </View>
            <Text className="text-xs text-muted mt-2">Actor: {incident.actorRole || "unknown"} #{incident.actorUserId ?? "—"}</Text>
            <Text className="text-xs text-muted mt-1" numberOfLines={1}>Hash: {incident.evidenceHash}</Text>
          </Pressable>
        ))}
        {query.data?.nextCursor && <Text className="text-xs text-muted text-center mt-2">Showing the latest 100 matching incidents. Older records remain persisted and can be queried by cursor/API.</Text>}
      </ScrollView>
    </ScreenContainer>
  );
}
