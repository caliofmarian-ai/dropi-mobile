import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

type Target = "CAAP" | "EASA" | "FAA";
type Channel = "C1" | "C2" | "C3" | "ADMIN";
type Format = "json" | "csv";

function utcDate(value: string, endOfDay: boolean): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return undefined;
  const parsed = new Date(`${value.trim()}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

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

export default function AuthorityReportsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading, isDemo } = useDropiAuth();
  const now = new Date();
  const initialTo = now.toISOString().slice(0, 10);
  const initialFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const [target, setTarget] = useState<Target>("CAAP");
  const [channel, setChannel] = useState<Channel>("C1");
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);
  const [exporting, setExporting] = useState<Format | null>(null);

  const authorized = Boolean(user && !isDemo && (user.dropiRole === "system_administrator" || user.dropiRole === "audit_manager"));
  const from = utcDate(fromDate, false);
  const to = utcDate(toDate, true);
  const validRange = Boolean(from && to && from <= to);
  const input = useMemo(() => ({ target, channel, from: from!, to: to! }), [target, channel, from?.getTime(), to?.getTime()]);

  const templates = trpc.authorityReports.templates.useQuery(undefined, { enabled: authorized });
  const preview = trpc.authorityReports.preview.useQuery(input, { enabled: authorized && validRange });
  const jsonExport = trpc.authorityReports.export.useQuery({ ...input, format: "json" }, { enabled: false, retry: false });
  const csvExport = trpc.authorityReports.export.useQuery({ ...input, format: "csv" }, { enabled: false, retry: false });

  const exportPack = async (format: Format) => {
    if (!validRange) {
      Alert.alert("Invalid UTC date range", "Use YYYY-MM-DD and keep the start date on or before the end date.");
      return;
    }
    setExporting(format);
    try {
      const result = await (format === "json" ? jsonExport.refetch() : csvExport.refetch());
      if (result.error) throw result.error;
      if (!result.data) throw new Error("No evidence pack was produced.");
      await deliverExport(result.data);
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "The authority evidence pack could not be generated.");
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
        <Text className="text-xl font-bold text-foreground">Authority Evidence Packs</Text>
        <Text className="text-sm text-muted mt-2">Available only to Owner/System Administrator and Audit Manager. Demo mode never exposes real evidence.</Text>
        <Pressable className="bg-primary rounded-xl p-3 items-center mt-4" onPress={() => safeGoBack(router)}><Text className="text-white font-semibold">Back</Text></Pressable>
      </ScreenContainer>
    );
  }

  const pack: any = preview.data;
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-foreground">Authority Evidence Packs</Text>
            <Text className="text-sm text-muted">Channel-scoped internal evidence for CAAP, EASA or FAA adaptation.</Text>
          </View>
          <Pressable onPress={() => safeGoBack(router)}><Text className="text-primary">← Back</Text></Pressable>
        </View>

        <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground">Internal template — not an official filing form</Text>
          <Text className="text-xs text-muted mt-1">{templates.data?.disclaimer}</Text>
        </View>

        <Pressable onPress={() => router.push("/admin/incident-reconstruction" as any)} className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-foreground">Incident Reconstruction →</Text>
          <Text className="text-xs text-muted mt-1">Open factual per-incident timelines from persisted operational evidence.</Text>
        </Pressable>

        <Text className="text-xs font-semibold text-muted mb-2">TARGET AUTHORITY</Text>
        <View className="flex-row gap-2 mb-4">
          {(["CAAP", "EASA", "FAA"] as Target[]).map((item) => (
            <Pressable key={item} onPress={() => setTarget(item)} className={`flex-1 rounded-lg p-3 items-center border ${target === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
              <Text className={target === item ? "text-white font-semibold" : "text-foreground font-semibold"}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-semibold text-muted mb-2">AUDIT CHANNEL — NEVER MIXED</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(["C1", "C2", "C3", "ADMIN"] as Channel[]).map((item) => (
            <Pressable key={item} onPress={() => setChannel(item)} className={`px-4 py-2 rounded-lg border ${channel === item ? "bg-primary border-primary" : "bg-surface border-border"}`}>
              <Text className={channel === item ? "text-white font-semibold" : "text-foreground"}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-2 mb-4">
          <TextInput value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} className="flex-1 bg-surface border border-border rounded-lg px-3 py-3 text-foreground" />
          <TextInput value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} className="flex-1 bg-surface border border-border rounded-lg px-3 py-3 text-foreground" />
        </View>

        {!validRange && <Text className="text-error text-xs mb-3">Use a valid UTC date range.</Text>}
        {preview.isLoading && <ActivityIndicator color={colors.primary} />}
        {preview.isError && <Text className="text-error text-sm mb-3">{preview.error.message}</Text>}

        {pack && (
          <View className="bg-surface border border-border rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-foreground">{pack.target} • {pack.scope.channel}</Text>
            <Text className="text-xs text-muted mt-1">{pack.adaptationContext}</Text>
            <Text className="text-sm text-foreground mt-3">Audit events: {pack.auditSummary.total}</Text>
            <Text className="text-sm text-foreground">Warnings: {pack.auditSummary.warning} • Critical: {pack.auditSummary.critical}</Text>
            <Text className="text-sm text-foreground">Safety evidence events: {pack.safetySummary.total}</Text>
            <Text className="text-xs text-muted mt-2">Operational source: {pack.operationalEvidence.source}</Text>
            {pack.operationalEvidence.limitation && <Text className="text-xs text-warning mt-1">{pack.operationalEvidence.limitation}</Text>}
          </View>
        )}

        <View className="flex-row gap-2">
          <Pressable disabled={!!exporting || !validRange} onPress={() => exportPack("json")} className="flex-1 bg-primary rounded-xl py-3 items-center">
            <Text className="text-white font-semibold">{exporting === "json" ? "Exporting…" : "Export JSON"}</Text>
          </Pressable>
          <Pressable disabled={!!exporting || !validRange} onPress={() => exportPack("csv")} className="flex-1 bg-surface border border-border rounded-xl py-3 items-center">
            <Text className="text-foreground font-semibold">{exporting === "csv" ? "Exporting…" : "Export CSV"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
