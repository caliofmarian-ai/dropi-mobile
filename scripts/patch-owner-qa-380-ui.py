from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


# ===== Phantom Console owner QA controls =====
p = Path("app/admin/phantom-console.tsx")
text = p.read_text()
text = text.replace(
    "  email: string | null;\n  dropiRole: string;",
    "  email: string | null;\n  username: string | null;\n  dropiRole: string;",
    1,
)

marker = '''interface RecoveryProbeResult {
  accepted: boolean;
  alias: string;
  baseInbox: string;
  message: string;
}
'''
insert = marker + '''
interface OwnerQaMissionFixtureStatus {
  enabled: boolean;
  issue: number;
  zone: string;
  deliveryPartner: {
    id: number;
    email: string;
    active: boolean;
    operationallyVerified: boolean;
  };
  fixtureCount: number;
  readyForRadar: boolean;
  fixtures: Array<{
    kind: "drone" | "terrestrial";
    orderUid: string;
    exists: boolean;
    orderId: number | null;
    status: string | null;
    targetPilotMatches: boolean;
    deliveryMode: string | null;
    vehicleType: string | null;
    vehicleId: string | null;
  }>;
}
'''
if marker not in text:
    raise SystemExit("RecoveryProbeResult marker missing")
text = text.replace(marker, insert, 1)

marker = '''async function sendRecoveryProbe(token: string): Promise<RecoveryProbeResult> {
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.sendDeliveryPartnerRecoveryProbe`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ json: {} }),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to send Delivery Partner recovery probe");
}
'''
insert = marker + '''
async function loadOwnerQaMissionFixtureStatus(token: string): Promise<OwnerQaMissionFixtureStatus> {
  const input = encodeURIComponent(JSON.stringify({ json: null }));
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.ownerQaMissionFixtureStatus?input=${input}`, {
    headers: authHeaders(token),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to load owner QA mission fixture status");
}

async function reconcileOwnerQaMissions(token: string): Promise<OwnerQaMissionFixtureStatus> {
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.reconcileOwnerQaMissionFixtures`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ json: {} }),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to reconcile owner QA mission fixtures");
}

async function resetOwnerQaMissions(token: string): Promise<{ success: boolean; deleted: number }> {
  const response = await fetch(`${getApiTrpcUrl()}/phantomConsole.resetOwnerQaMissionFixtures`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ json: {} }),
    credentials: "include",
  });
  return unwrapResponse(response, "Unable to reset owner QA mission fixtures");
}
'''
if marker not in text:
    raise SystemExit("sendRecoveryProbe marker missing")
text = text.replace(marker, insert, 1)

text = text.replace(
    '  const [controlStatus, setControlStatus] = useState<TestAccountControlStatus | null>(null);\n',
    '  const [controlStatus, setControlStatus] = useState<TestAccountControlStatus | null>(null);\n  const [ownerQaStatus, setOwnerQaStatus] = useState<OwnerQaMissionFixtureStatus | null>(null);\n  const [ownerQaError, setOwnerQaError] = useState("");\n',
    1,
)
text = text.replace(
    '  const [diagnosingRecovery, setDiagnosingRecovery] = useState(false);\n',
    '  const [diagnosingRecovery, setDiagnosingRecovery] = useState(false);\n  const [ownerQaWorking, setOwnerQaWorking] = useState<"reconcile" | "reset" | null>(null);\n',
    1,
)

old_refresh = '''      const [targetResult, statusResult] = await Promise.all([
        loadTargets(token),
        loadControlStatus(token),
      ]);
      setTargets(targetResult.targets || []);
      setControlStatus(statusResult);'''
new_refresh = '''      const [targetResult, statusResult] = await Promise.all([
        loadTargets(token),
        loadControlStatus(token),
      ]);
      setTargets(targetResult.targets || []);
      setControlStatus(statusResult);
      if (statusResult.provisioning.ready) {
        try {
          const qaStatus = await loadOwnerQaMissionFixtureStatus(token);
          setOwnerQaStatus(qaStatus);
          setOwnerQaError("");
        } catch (qaErr: any) {
          setOwnerQaStatus(null);
          setOwnerQaError(qaErr.message || "Owner QA fixtures need reconciliation");
        }
      } else {
        setOwnerQaStatus(null);
        setOwnerQaError("Canonical test-account provisioning is not ready on the server.");
      }'''
if old_refresh not in text:
    raise SystemExit("refresh block missing")
text = text.replace(old_refresh, new_refresh, 1)

text = text.replace(
    '[target.name, target.email, target.dropiRole, target.channel]',
    '[target.name, target.email, target.username, target.dropiRole, target.channel]',
    1,
)

marker = '''  const confirmEnter = useCallback((target: PhantomTarget) => {'''
handlers = '''  const confirmOwnerQaReconcile = useCallback(() => {
    if (!token || ownerQaWorking) return;
    Alert.alert(
      "Reconcile owner QA missions?",
      "DROPi will reset only the governed #380 test fixtures and create one READY DRONE mission plus one READY TERRESTRIAL/VAN mission for the canonical TEST HUMAN Delivery Partner. Production users are not targeted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reconcile",
          onPress: async () => {
            setOwnerQaWorking("reconcile");
            try {
              const result = await reconcileOwnerQaMissions(token);
              setOwnerQaStatus(result);
              setOwnerQaError("");
              Alert.alert(
                "Owner QA missions ready",
                `Mission Radar now has ${result.fixtureCount} governed QA missions in ${result.zone}. Log out and use human.delivery_partner for the physical Android test.`,
              );
            } catch (err: any) {
              setOwnerQaError(err.message || "Unable to reconcile owner QA missions");
              Alert.alert("Owner QA reconciliation blocked", err.message || "Unable to reconcile owner QA missions");
            } finally {
              setOwnerQaWorking(null);
            }
          },
        },
      ],
    );
  }, [ownerQaWorking, token]);

  const confirmOwnerQaReset = useCallback(() => {
    if (!token || ownerQaWorking) return;
    Alert.alert(
      "Reset owner QA missions?",
      "This removes only the two #380 runtime fixtures and their QA runtime evidence. Permanent audit history is retained.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setOwnerQaWorking("reset");
            try {
              const result = await resetOwnerQaMissions(token);
              setOwnerQaStatus(null);
              setOwnerQaError(`Fixtures reset (${result.deleted} removed). Reconcile when you want to test again.`);
              Alert.alert("Owner QA missions reset", `${result.deleted} fixture orders removed. Audit history was retained.`);
            } catch (err: any) {
              Alert.alert("Owner QA reset blocked", err.message || "Unable to reset owner QA missions");
            } finally {
              setOwnerQaWorking(null);
            }
          },
        },
      ],
    );
  }, [ownerQaWorking, token]);

'''+marker
if marker not in text:
    raise SystemExit("confirmEnter marker missing")
text = text.replace(marker, handlers, 1)

text = text.replace(
    '<Text className="text-xs text-muted mt-1">{target.email || "No email"}</Text>',
    '<Text className="text-xs text-muted mt-1">{target.email || "No email"}</Text>\n            {target.username ? <Text className="text-xs text-primary mt-1">Username: {target.username}</Text> : null}',
    1,
)

# Add owner QA control card immediately after canonical test-account control card.
anchor = '''        <View className="bg-surface border border-border rounded-xl p-3 mb-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">IDENTITY INVENTORY</Text>'''
qa_card = '''        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Owner Android Mission Acceptance · #380</Text>
              <Text className="text-xs text-muted mt-1 leading-5">
                Governed C1 fixtures are visible only to TEST HUMAN Delivery Partner. Direct login username: human.delivery_partner
              </Text>
            </View>
            <Text className={`text-xs font-bold ${ownerQaStatus?.readyForRadar ? "text-success" : "text-warning"}`}>
              {ownerQaStatus?.readyForRadar ? "READY" : "NOT READY"}
            </Text>
          </View>

          <View className="mt-3 gap-1">
            <Text className="text-xs text-muted">Zone: {ownerQaStatus?.zone || controlStatus?.provisioning.zone || "not resolved"}</Text>
            {ownerQaStatus?.fixtures.map((fixture) => (
              <Text key={fixture.kind} className="text-xs text-foreground">
                {fixture.kind === "drone" ? "🚁 DRONE" : "🚐 TERRESTRIAL"} · {fixture.orderUid} · {fixture.exists ? String(fixture.status || "materialized").toUpperCase() : "MISSING"}
              </Text>
            ))}
            {ownerQaError ? <Text className="text-xs text-warning mt-1">{ownerQaError}</Text> : null}
          </View>

          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={confirmOwnerQaReconcile}
              disabled={ownerQaWorking !== null || !controlStatus?.provisioning.ready}
              className="flex-1 border border-primary rounded-lg py-2.5 items-center"
              style={{ opacity: ownerQaWorking !== null || !controlStatus?.provisioning.ready ? 0.45 : 1 }}
            >
              {ownerQaWorking === "reconcile" ? (
                <ActivityIndicator size="small" color="#0a7ea4" />
              ) : (
                <Text className="text-primary text-xs font-semibold">Reconcile QA Missions</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmOwnerQaReset}
              disabled={ownerQaWorking !== null}
              className="flex-1 border border-error rounded-lg py-2.5 items-center"
              style={{ opacity: ownerQaWorking !== null ? 0.45 : 1 }}
            >
              {ownerQaWorking === "reset" ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text className="text-error text-xs font-semibold">Reset QA Missions</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

'''+anchor
if anchor not in text:
    raise SystemExit("identity inventory anchor missing")
text = text.replace(anchor, qa_card, 1)
p.write_text(text)


# ===== Mission Radar QA differentiation =====
p = Path("components/c1-transactional-dashboards.tsx")
text = p.read_text()

assigned_old = '''                        <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
                        <Text className="text-xs text-muted mt-1">{item.status.replace(/_/g, " ").toUpperCase()}</Text>'''
assigned_new = '''                        <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
                        {(item as any).isOwnerQaFixture ? (
                          <Text className="text-xs text-primary font-bold mt-1">{(item as any).ownerQaLabel}</Text>
                        ) : null}
                        <Text className="text-xs text-muted mt-1">
                          {VEHICLE_ICONS[(item as any).vehicleType || "auto"]} {(item as any).vehicleType || "auto"} · {item.status.replace(/_/g, " ").toUpperCase()}
                        </Text>'''
if assigned_old not in text:
    raise SystemExit("assigned mission card block missing")
text = text.replace(assigned_old, assigned_new, 1)

ready_old = '''            <Text className="text-sm font-semibold text-foreground">{item.merchantName}</Text>
            <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
            <Text className="text-xs text-muted mt-1">{item.pickupZone} → {item.deliveryZone}</Text>'''
ready_new = '''            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{item.merchantName}</Text>
                <Text className="text-xs text-muted mt-1">{item.orderUid}</Text>
              </View>
              {(item as any).isOwnerQaFixture ? (
                <View className="bg-primary/10 border border-primary rounded-lg px-2 py-1">
                  <Text className="text-primary text-xs font-bold">OWNER QA</Text>
                </View>
              ) : null}
            </View>
            {(item as any).isOwnerQaFixture ? (
              <Text className="text-xs text-primary font-bold mt-2">{(item as any).ownerQaLabel}</Text>
            ) : null}
            <Text className="text-xs text-muted mt-1">
              {VEHICLE_ICONS[(item as any).vehicleType || "auto"]} {(item as any).vehicleType || "auto"}
              {(item as any).vehicleId ? ` · ${(item as any).vehicleId}` : ""}
              {` · ${item.packageWeight} kg · ETA ${item.estimatedTime} min`}
            </Text>
            <Text className="text-xs text-muted mt-1">{item.pickupZone} → {item.deliveryZone}</Text>'''
if ready_old not in text:
    raise SystemExit("ready mission card block missing")
text = text.replace(ready_old, ready_new, 1)

# Make empty state QA-useful without claiming fixtures exist.
text = text.replace(
    '<Text className="text-muted text-base">No Marketplace missions available</Text>',
    '<Text className="text-muted text-base">No Marketplace missions available</Text><Text className="text-muted text-xs mt-2 text-center">For owner QA, reconcile #380 fixtures from the real Super Admin Phantom Console.</Text>',
    1,
)
p.write_text(text)
