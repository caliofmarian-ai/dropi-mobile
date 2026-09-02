import { useMemo } from "react";
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

function basisLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isDemo } = useDropiAuth();
  const overview = trpc.privacy.overview.useQuery(undefined, { enabled: !!user && !isDemo });
  const retentionPolicies = trpc.privacy.retentionPolicies.useQuery(undefined, {
    enabled: !!user && !isDemo && user.dropiRole === "system_administrator",
  });
  const retentionPreview = trpc.privacy.retentionPreview.useQuery(undefined, {
    enabled: !!user && !isDemo && user.dropiRole === "system_administrator",
  });
  const setConsent = trpc.privacy.setConsent.useMutation({
    onSuccess: () => overview.refetch(),
    onError: (error) => Alert.alert("Privacy preference not changed", error.message),
  });
  const runRetention = trpc.privacy.runRetention.useMutation({
    onSuccess: async (result) => {
      await retentionPreview.refetch();
      Alert.alert("Retention completed", `${result.affected} authorized records or expired credentials were processed.`);
    },
    onError: (error) => Alert.alert("Retention failed", error.message),
  });

  const previewTotal = useMemo(() => {
    const preview = retentionPreview.data;
    if (!preview) return 0;
    return preview.expiredSessions +
      preview.expiredResetCredentials +
      preview.expiredVerificationCredentials +
      preview.audit.operational.eligible +
      preview.audit.security.eligible +
      preview.audit.financial.eligible;
  }, [retentionPreview.data]);

  if (!user) return null;

  if (isDemo) {
    return (
      <ScreenContainer className="px-4 pt-4">
        <TouchableOpacity onPress={() => safeGoBack(router)} className="mb-4">
          <Text className="text-primary font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground mb-3">Privacy & Data Use</Text>
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-foreground font-semibold">Real privacy records are unavailable in demo mode.</Text>
          <Text className="text-muted text-sm mt-2">Sign in with a real account to view governed processing purposes and consent history.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-foreground">Privacy & Data Use</Text>
            <Text className="text-sm text-muted mt-1">What DROPi processes, why, and how retention is governed.</Text>
          </View>
          <TouchableOpacity onPress={() => safeGoBack(router)}>
            <Text className="text-primary font-medium">← Back</Text>
          </TouchableOpacity>
        </View>

        {overview.isLoading ? (
          <Text className="text-muted">Loading privacy registry…</Text>
        ) : overview.isError ? (
          <View className="bg-error/10 border border-error/30 rounded-xl p-4 mb-4">
            <Text className="text-error font-semibold">Privacy registry unavailable</Text>
            <Text className="text-muted text-sm mt-1">{overview.error.message}</Text>
          </View>
        ) : (
          <>
            {(overview.data?.purposes || []).map((purpose: any) => (
              <View key={purpose.key} className="bg-surface border border-border rounded-xl p-4 mb-3">
                <Text className="text-base font-semibold text-foreground">{purpose.label}</Text>
                <Text className="text-sm text-muted mt-1">{purpose.description}</Text>

                <View className="mt-3">
                  <Text className="text-xs font-semibold text-muted">LAWFUL BASIS</Text>
                  <Text className="text-sm text-foreground mt-0.5">{basisLabel(purpose.lawfulBasis)}</Text>
                </View>

                <View className="mt-3">
                  <Text className="text-xs font-semibold text-muted">DATA CATEGORIES</Text>
                  <Text className="text-sm text-foreground mt-0.5">{purpose.dataCategories.join(", ")}</Text>
                </View>

                <View className="mt-3">
                  <Text className="text-xs font-semibold text-muted">RETENTION</Text>
                  {(purpose.retentionPolicies || []).map((policy: any) => (
                    <Text key={policy.key} className="text-sm text-foreground mt-1">• {policy.label}: {policy.description}</Text>
                  ))}
                </View>

                {purpose.consentRequired ? (
                  <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-border">
                    <View className="flex-1 pr-4">
                      <Text className="text-sm font-semibold text-foreground">Optional consent</Text>
                      <Text className="text-xs text-muted">You can withdraw this at any time.</Text>
                    </View>
                    <Switch
                      value={purpose.consent?.granted === true}
                      disabled={setConsent.isPending}
                      onValueChange={(granted) => setConsent.mutate({
                        purposeKey: purpose.key,
                        purposeVersion: purpose.version,
                        granted,
                      })}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                ) : (
                  <View className="mt-4 pt-3 border-t border-border">
                    <Text className="text-xs text-muted">This purpose is not based on consent, so it is not presented as an opt-in toggle.</Text>
                  </View>
                )}
              </View>
            ))}

            {!overview.data?.hasConsentControlledPurposes && (
              <View className="bg-surface border border-border rounded-xl p-4 mb-4">
                <Text className="text-sm font-semibold text-foreground">No optional consent-based processing is currently registered.</Text>
                <Text className="text-xs text-muted mt-1">DROPi will only show a consent control when a processing purpose is actually governed by consent.</Text>
              </View>
            )}
          </>
        )}

        {user.dropiRole === "system_administrator" && (
          <View className="bg-surface border border-border rounded-xl p-4 mt-2">
            <Text className="text-lg font-semibold text-foreground">Authorized Retention Operations</Text>
            <Text className="text-xs text-muted mt-1">Only explicit expiry contracts and canonical audit windows are executed automatically.</Text>

            {(retentionPolicies.data?.policies || []).map((policy: any) => (
              <View key={policy.key} className="mt-3">
                <Text className="text-sm font-medium text-foreground">{policy.label}</Text>
                <Text className="text-xs text-muted">{policy.automatic ? "Automatic" : "Deferred"} • {policy.action.replace(/_/g, " ")} • {policy.authority}</Text>
              </View>
            ))}

            {retentionPreview.data && (
              <View className="mt-4 pt-3 border-t border-border">
                <Text className="text-sm font-semibold text-foreground">Eligible now: {previewTotal}</Text>
                <Text className="text-xs text-muted mt-1">Expired sessions: {retentionPreview.data.expiredSessions}</Text>
                <Text className="text-xs text-muted">Expired reset credentials: {retentionPreview.data.expiredResetCredentials}</Text>
                <Text className="text-xs text-muted">Expired verification credentials: {retentionPreview.data.expiredVerificationCredentials}</Text>
                <Text className="text-xs text-muted">Operational audit: {retentionPreview.data.audit.operational.eligible}</Text>
                <Text className="text-xs text-muted">Security audit: {retentionPreview.data.audit.security.eligible}</Text>
                <Text className="text-xs text-muted">Financial audit: {retentionPreview.data.audit.financial.eligible}</Text>
              </View>
            )}

            <TouchableOpacity
              disabled={runRetention.isPending || retentionPreview.isLoading}
              className="bg-primary rounded-xl py-3 items-center mt-4"
              onPress={() => Alert.alert(
                "Execute authorized retention?",
                "This permanently removes only records already eligible under explicit retention rules. Deferred account/order data is not touched.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Execute",
                    style: "destructive",
                    onPress: () => runRetention.mutate({ confirm: "EXECUTE_AUTHORIZED_RETENTION" }),
                  },
                ],
              )}
            >
              <Text className="text-white font-semibold">{runRetention.isPending ? "Executing…" : "Execute Authorized Retention"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
