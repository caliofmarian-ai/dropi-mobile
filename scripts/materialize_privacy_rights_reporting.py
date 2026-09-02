from pathlib import Path

root = Path('.')

def replace_once(path: str, old: str, new: str):
    p = root / path
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'marker not found in {path}: {old[:80]!r}')
    p.write_text(text.replace(old, new, 1))

# 1. Schema: privacy rights request evidence ledger.
replace_once(
    'drizzle/schema.ts',
    'export type PrivacyRetentionRun = typeof privacyRetentionRuns.$inferSelect;\nexport type InsertPrivacyRetentionRun = typeof privacyRetentionRuns.$inferInsert;\n\n/**\n * Verifications table',
    '''export type PrivacyRetentionRun = typeof privacyRetentionRuns.$inferSelect;
export type InsertPrivacyRetentionRun = typeof privacyRetentionRuns.$inferInsert;

/**
 * Privacy rights requests — immutable evidence for access/portability/erasure.
 * Historical references continue to use the stable numeric user ID after the
 * user row has been pseudonymized.
 */
export const privacyRightsRequests = mysqlTable("privacyRightsRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requestType: mysqlEnum("requestType", ["access", "portability", "erasure"]).notNull(),
  status: mysqlEnum("status", ["requested", "blocked", "completed", "failed"]).default("requested").notNull(),
  blockerSummary: json("blockerSummary"),
  resultSummary: json("resultSummary"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PrivacyRightsRequest = typeof privacyRightsRequests.$inferSelect;
export type InsertPrivacyRightsRequest = typeof privacyRightsRequests.$inferInsert;

/**
 * Verifications table'''
)

# 2. Privacy API: subject export + guarded erasure.
replace_once(
    'server/privacy-router.ts',
    'import { executeAuthorizedPrivacyRetention, previewPrivacyRetention } from "./privacy-retention-service";\n',
    '''import { executeAuthorizedPrivacyRetention, previewPrivacyRetention } from "./privacy-retention-service";
import { buildPrivacySubjectExport, executePrivacyErasure, getPrivacyErasurePreview } from "./privacy-rights-service";
'''
)
replace_once(
    'server/privacy-router.ts',
    '  retentionPolicies: adminProcedure.query(() => ({\n',
    '''  subjectExport: protectedProcedure.query(async ({ ctx }) =>
    buildPrivacySubjectExport(ctx.user!.id)),

  erasurePreview: protectedProcedure.query(async ({ ctx }) =>
    getPrivacyErasurePreview(ctx.user!.id)),

  eraseAccount: protectedProcedure
    .input(z.object({
      confirm: z.literal("ERASE_MY_DROPI_ACCOUNT"),
      currentPassword: z.string().min(8).max(128).optional(),
    }))
    .mutation(async ({ input, ctx }) => executePrivacyErasure({
      userId: ctx.user!.id,
      currentPassword: input.currentPassword,
    })),

  retentionPolicies: adminProcedure.query(() => ({
'''
)

# 3. Application router: authority report namespace.
replace_once(
    'server/routers.ts',
    'import { privacyRouter } from "./privacy-router";\n',
    'import { privacyRouter } from "./privacy-router";\nimport { authorityReportRouter } from "./authority-report-router";\n'
)
replace_once(
    'server/routers.ts',
    '  privacy: privacyRouter,\n\n  // Trust & Badge System',
    '''  privacy: privacyRouter,

  // Audit-backed, channel-scoped evidence packs for authority adaptation
  authorityReports: authorityReportRouter,

  // Trust & Badge System'''
)

# 4. Audit Core: do not reintroduce erased IP/device/session on the final successful erasure log.
replace_once(
    'server/audit-middleware.ts',
    '  const sanitizedInput = sanitizeAuditInput(input);\n  const isAIAction = Boolean((ctx.user as any).isAIAgent);\n  const deviceInfo = ctx.session?.deviceInfo || getUserAgent(ctx.req);\n',
    '''  const sanitizedInput = sanitizeAuditInput(input);
  const isAIAction = Boolean((ctx.user as any).isAIAgent);
  const privacySafeErasureLog = path === "privacy.eraseAccount" && success;
  const deviceInfo = privacySafeErasureLog ? null : (ctx.session?.deviceInfo || getUserAgent(ctx.req));
  const persistedInput = privacySafeErasureLog ? null : sanitizedInput;
'''
)
replace_once(
    'server/audit-middleware.ts',
    '''    ipAddress: getClientIp(ctx.req),
    userAgent: getUserAgent(ctx.req),
    sessionId: ctx.session?.id != null ? String(ctx.session.id) : null,
''',
    '''    ipAddress: privacySafeErasureLog ? null : getClientIp(ctx.req),
    userAgent: privacySafeErasureLog ? null : getUserAgent(ctx.req),
    sessionId: privacySafeErasureLog ? null : (ctx.session?.id != null ? String(ctx.session.id) : null),
'''
)
replace_once(
    'server/audit-middleware.ts',
    '''      input: sanitizedInput,
      decision: extractDecisionMetadata(procedureType, sanitizedInput),
      success,
''',
    '''      input: persistedInput,
      decision: privacySafeErasureLog ? null : extractDecisionMetadata(procedureType, sanitizedInput),
      privacySafeErasureLog,
      success,
'''
)

# 5. User-facing privacy rights controls.
replace_once('app/privacy.tsx', 'import { useMemo } from "react";', 'import { useMemo, useState } from "react";')
replace_once(
    'app/privacy.tsx',
    'import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";',
    'import { Alert, Platform, ScrollView, Share, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";'
)
replace_once(
    'app/privacy.tsx',
    '''function basisLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
}
''',
    '''function basisLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
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
'''
)
replace_once('app/privacy.tsx', '  const { user, isDemo } = useDropiAuth();', '  const { user, isDemo, logout } = useDropiAuth();')
replace_once(
    'app/privacy.tsx',
    '  const runRetention = trpc.privacy.runRetention.useMutation({\n',
    '''  const [erasurePhrase, setErasurePhrase] = useState("");
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
'''
)
replace_once(
    'app/privacy.tsx',
    '  const previewTotal = useMemo(() => {\n',
    '''  const handleSubjectExport = async () => {
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
'''
)
rights_section = '''
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

'''
replace_once(
    'app/privacy.tsx',
    '        {user.dropiRole === "system_administrator" && (\n',
    rights_section + '        {user.dropiRole === "system_administrator" && (\n'
)

# 6. Add authority-report navigation to Audit Manager dashboard after the unique full audit viewer card.
p = root / 'app/(tabs)/index.tsx'
text = p.read_text()
needle = '<Text className="text-sm font-medium text-foreground">Full Audit Log Viewer</Text>'
pos = text.find(needle)
if pos == -1:
    raise SystemExit('Audit Manager viewer marker not found')
end = text.find('</TouchableOpacity>', pos)
if end == -1:
    raise SystemExit('Audit Manager viewer closing tag not found')
end += len('</TouchableOpacity>')
authority_card = '''
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/authority-reports" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📑</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Authority Evidence Packs</Text>
            <Text className="text-xs text-muted">CAAP, EASA, FAA adaptation — internal templates</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>'''
text = text[:end] + authority_card + text[end:]
p.write_text(text)

print('privacy rights/reporting materialization complete')
