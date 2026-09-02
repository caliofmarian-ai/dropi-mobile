import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

type Channel = "C1" | "C2";
type Target = "CAAP" | "EASA" | "FAA";
type Format = "json" | "csv";

async function deliverExport(payload: { filename: string; contentType: string; content: string }) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([payload.content], { type: payload.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: payload.filename, message: payload.content });
}

function compactData(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    return text.length > 360 ? `${text.slice(0, 357)}…` : text;
  } catch {
    return String(value ?? "");
  }
}

export default function IncidentReconstructionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading, isDemo } = useDropiAuth();
  const [channel, setChannel] = useState<Channel>("C1");
  const [target, setTarget] = useState<Target>("CAAP");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [exporting, setExporting] = useState<Format | null>(null);
  const authorized = Boolean(user && !isDemo && (user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager"));

  const incidents = trpc.incidentReconstruction.list.useQuery(
    { channel, limit: 50 },
    { enabled: authorized, retry: false },
  );

  useEffect(() => {
    const rows = incidents.data?.incidents ?? [];
    if (rows.length === 0) {
      setSelectedUid(null);
      return;
    }
    if (!selectedUid || !rows.some((row) => row.eventUid === selectedUid)) {
      setSelectedUid(rows[0].eventUid);
    }
  }, [channel, incidents.data?.incidents, selectedUid]);

  const selectedInput = useMemo(() => ({
    channel,
    incidentEventUid: selectedUid ?? "00000000-0000-0000-0000-000000000000",
  }), [channel, selectedUid]);

  const reconstruction = trpc.incidentReconstruction.reconstruct.useQuery(
    selectedInput,
    { enabled: authorized && Boolean(selectedUid), retry: false },
  );
  const jsonExport = trpc.incidentReconstruction.export.useQuery(
    { ...selectedInput, target, format: "json" },
    { enabled: false, retry: false },
  );
  const csvExport = trpc.incidentReconstruction.export.useQuery(
    { ...selectedInput, target, format: "csv" },
    { enabled: false, retry: false },
  );

  const exportIncident = async (format: Format) => {
    if (!selectedUid) return;
    setExporting(format);
    try {
      const result = await (format === "json" ? jsonExport.refetch() : csvExport.refetch());
      if (result.error) throw result.error;
      if (!result.data) throw new Error("No incident evidence pack was produced.");
      await deliverExport(result.data);
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "The incident evidence pack could not be generated.");
    } finally {
      setExporting(null);
    }
  };

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

  const pack: any = reconstruction.data;
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-foreground">Incident Reconstruction</Text>
            <Text className="text-sm text-muted">Factual evidence sequence from persisted operational trace and Audit Core signals.</Text>
          </View>
          <Pressable onPress={() => safeGoBack(router)}><Text className="text-primary">← Back</Text></Pressable>
        </View>

        <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground">Evidence only — no inferred cause or fault</Text>
          <Text className="text-xs text-muted mt-1">The view orders persisted records by timestamp and source. It does not generate a narrative conclusion.</Text>
        </View>

        <Text className="text-xs font-semibold text-muted mb-2">OPERATIONAL CHANNEL</Text>
        <View className="flex-row gap-2 mb-4">
          {(["C1", "C2"] as Channel[]).map((item) => (
            <Pressable key={item} onPress={() => { setChannel(item); setSelectedUid(null); }} className={`flex-1 rounded-lg p-3 items-center border ${channel === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
              <Text className={channel === item ? "text-white font-semibold" : "text-foreground font-semibold"}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-semibold text-muted mb-2">RECENT INCIDENT EVIDENCE</Text>
        {incidents.isLoading && <ActivityIndicator color={colors.primary} />}
        {incidents.isError && <Text className="text-error text-sm mb-3">{incidents.error.message}</Text>}
        {(incidents.data?.incidents ?? []).length === 0 && !incidents.isLoading && (
          <View className="bg-surface border border-border rounded-xl p-4 mb-4"><Text className="text-sm text-muted">No persisted fallback, STOP or delivery-failure evidence exists in {channel} yet.</Text></View>
        )}
        {(incidents.data?.incidents ?? []).map((incident) => (
          <Pressable key={incident.eventUid} onPress={() => setSelectedUid(incident.eventUid)} className={`rounded-xl border p-3 mb-2 ${selectedUid === incident.eventUid ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
            <Text className="text-sm font-semibold text-foreground">{incident.eventType.replace(/_/g, " ").toUpperCase()}</Text>
            <Text className="text-xs text-muted mt-1">{incident.targetType} #{incident.targetId} • {new Date(incident.occurredAt).toISOString()}</Text>
            <Text className="text-xs text-muted mt-1">Evidence {incident.evidenceHash.slice(0, 16)}…</Text>
          </Pressable>
        ))}

        {reconstruction.isLoading && selectedUid && <ActivityIndicator color={colors.primary} />}
        {reconstruction.isError && <Text className="text-error text-sm my-3">{reconstruction.error.message}</Text>}

        {pack && (
          <>
            <View className="bg-surface border border-border rounded-xl p-4 my-4">
              <Text className="text-base font-semibold text-foreground">{pack.incident.eventType.toUpperCase()} • {pack.scope.targetType} #{pack.scope.targetId}</Text>
              <Text className="text-xs text-muted mt-1">Anchor: {pack.incident.occurredAt}</Text>
              <Text className="text-xs text-muted mt-1">{pack.scope.contextRule}</Text>
              <Text className="text-sm text-foreground mt-3">Operational events: {pack.counts.operationalEvents}</Text>
              <Text className="text-sm text-foreground">Telemetry samples: {pack.counts.telemetrySamples}</Text>
              <Text className="text-sm text-foreground">Proofs / attestations: {pack.counts.proofs} / {pack.counts.attestations}</Text>
              <Text className="text-sm text-foreground">Audit decision signals: {pack.counts.auditDecisionSignals}</Text>
              {pack.preview?.truncated && <Text className="text-xs text-warning mt-2">Preview shows {pack.preview.returnedTimelineItems} of {pack.preview.totalTimelineItems} records. Export contains the complete reconstruction.</Text>}
            </View>

            <Text className="text-xs font-semibold text-muted mb-2">FACTUAL TIMELINE</Text>
            {pack.timeline.map((item: any, index: number) => (
              <View key={item.key} className={`border rounded-xl p-3 mb-2 ${index === pack.incidentTimelineIndex ? "border-error bg-error/5" : "border-border bg-surface"}`}>
                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm font-semibold text-foreground flex-1">{item.kind}</Text>
                  <Text className="text-xs text-muted">{item.source}</Text>
                </View>
                <Text className="text-xs text-muted mt-1">{item.timestamp}</Text>
                {(item.actorUserId || item.actorRole) && <Text className="text-xs text-muted mt-1">Actor: {item.actorRole || "unknown"}{item.actorUserId ? ` #${item.actorUserId}` : ""}</Text>}
                {item.evidenceHash && <Text className="text-xs text-muted mt-1">Hash: {item.evidenceHash.slice(0, 24)}…</Text>}
                <Text className="text-xs text-foreground mt-2">{compactData(item.data)}</Text>
              </View>
            ))}

            <Text className="text-xs font-semibold text-muted mt-4 mb-2">AUTHORITY ADAPTATION TARGET</Text>
            <View className="flex-row gap-2 mb-3">
              {(["CAAP", "EASA", "FAA"] as Target[]).map((item) => (
                <Pressable key={item} onPress={() => setTarget(item)} className={`flex-1 rounded-lg p-3 items-center border ${target === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                  <Text className={target === item ? "text-white font-semibold" : "text-foreground font-semibold"}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-xs text-muted mb-3">Exports are DROPi internal evidence packs for adaptation; they are not official authority filing forms.</Text>
            <View className="flex-row gap-2">
              <Pressable disabled={!!exporting} onPress={() => exportIncident("json")} className="flex-1 bg-primary rounded-xl py-3 items-center"><Text className="text-white font-semibold">{exporting === "json" ? "Exporting…" : "Export JSON"}</Text></Pressable>
              <Pressable disabled={!!exporting} onPress={() => exportIncident("csv")} className="flex-1 bg-surface border border-border rounded-xl py-3 items-center"><Text className="text-foreground font-semibold">{exporting === "csv" ? "Exporting…" : "Export CSV"}</Text></Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
