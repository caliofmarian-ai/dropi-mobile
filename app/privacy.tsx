import { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Share, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

function basisLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function deliverPrivacyExport(payload: { filename: string; contentType: string; content: string }) {
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

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isDemo, logout } = useDropiAuth();
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
  const [erasurePhrase, setErasurePhrase] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const subjectExport = trpc.privacy.subjectExport.useQuery(undefined, { enabled: false, retry: false });
  const erasurePreview = trpc.privacy.erasurePreview.useQuery(undefined, { enabled: !!user && !isDemo, retry: false });
  const eraseAccount = trpc.privacy.eraseAccount.useMutation({
    onSuccess: async (result) => {
      if (!result.success) {
        await erasurePreview.refetch();
        Alert.alert("Erasure blocked", "Resolve active delivery obligations before retrying account erasure.");
        return;
      }
      Alert.alert("Account erased", "Direct identifiers and access credentials were removed. Retained evidence is pseudonymized under the governed retention rules.");
      await logout();
      router.replace("/login");
    },
    onError: (error) => Alert.alert("Account erasure failed", error.message),
  });
  const runRetention = trpc.privacy.runRetention.useMutation({
    onSuccess: async (result) => {
      await retentionPreview.refetch();
      Alert.alert("Retention completed", `${result.affected} authorized records or expired credentials were processed.`);
    },
    onError: (error) => Alert.alert("Retention failed", error.message),
  });

  const handleSubjectExport = async () => {
    try {
      const result = await subjectExport.refetch();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("No privacy export was produced.");
      await deliverPrivacyExport(result.data);
    } catch (error: any) {
      Alert.alert("Export failed", error?.message || "Your privacy export could not be generated.");
    }
  };

  const handleErase = () => {
    if (erasurePhrase !== "ERASE_MY_DROPI_ACCOUNT") {
      Alert.alert("Confirmation required", "Type ERASE_MY_DROPI_ACCOUNT exactly before continuing.");
      return;
    }
    Alert.alert(
      "Permanently erase this DROPi account?",
      "Access will be revoked. Direct identifiers will be removed. Completed operational/audit evidence may remain only in pseudonymized form under retention rules.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase Account",
          style: "destructive",
          onPress: () => eraseAccount.mutate({
            confirm: "ERASE_MY_DROPI_ACCOUNT",
            ...(currentPassword ? { currentPassword } : {}),
          }),
        },
      ],
    );
  };

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


        <View className="bg-surface border border-border rounded-xl p-4 mt-2 mb-4">
          <Text className="text-lg font-semibold text-foreground">Your Data Rights</Text>
          <Text className="text-xs text-muted mt-1">Access/portability export excludes authentication secrets and minimizes third-party data.</Text>

          <TouchableOpacity
            disabled={subjectExport.isFetching}
            className="bg-primary rounded-xl py-3 items-center mt-4"
            onPress={handleSubjectExport}
          >
            <Text className="text-white font-semibold">{subjectExport.isFetching ? "Preparing Export…" : "Export My Data"}</Text>
          </TouchableOpacity>

          <View className="mt-5 pt-4 border-t border-border">
            <Text className="text-base font-semibold text-foreground">Right to Erasure</Text>
            {erasurePreview.data ? (
              <>
                <Text className={`text-sm mt-2 ${erasurePreview.data.allowed ? "text-foreground" : "text-warning"}`}>
                  {erasurePreview.data.allowed ? "No active operational blockers." : "Erasure is blocked while active obligations remain."}
                </Text>
                <Text className="text-xs text-muted mt-1">Active orders: {erasurePreview.data.blockers.activeOrders}</Text>
                <Text className="text-xs text-muted">Active deliveries: {erasurePreview.data.blockers.activeDeliveries}</Text>
                <Text className="text-xs text-muted">Active B2B deliveries: {erasurePreview.data.blockers.activeB2bDeliveries}</Text>
                <Text className="text-xs text-muted">Active P2P parcels: {erasurePreview.data.blockers.activeP2pParcels}</Text>
                <Text className="text-xs text-muted">Owned stores to close after obligations resolve: {erasurePreview.data.ownedStoresToClose}</Text>
                {(erasurePreview.data.retentionNotice || []).map((notice: string) => (
                  <Text key={notice} className="text-xs text-muted mt-1">• {notice}</Text>
                ))}
              </>
            ) : erasurePreview.isLoading ? (
              <Text className="text-xs text-muted mt-2">Checking operational blockers…</Text>
            ) : null}

            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Current password (required for password accounts)"
              placeholderTextColor={colors.muted}
              className="bg-background border border-border rounded-lg px-3 py-3 text-foreground mt-3"
            />
            <TextInput
              value={erasurePhrase}
              onChangeText={setErasurePhrase}
              autoCapitalize="characters"
              placeholder="Type ERASE_MY_DROPI_ACCOUNT"
              placeholderTextColor={colors.muted}
              className="bg-background border border-error/40 rounded-lg px-3 py-3 text-foreground mt-2"
            />
            <TouchableOpacity
              disabled={eraseAccount.isPending || !erasurePreview.data?.allowed || erasurePhrase !== "ERASE_MY_DROPI_ACCOUNT"}
              className="bg-error/10 border border-error/40 rounded-xl py-3 items-center mt-3"
              onPress={handleErase}
            >
              <Text className="text-error font-semibold">{eraseAccount.isPending ? "Erasing…" : "Erase My DROPi Account"}</Text>
            </TouchableOpacity>
          </View>
        </View>

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
