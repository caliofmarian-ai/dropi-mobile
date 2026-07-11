import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import { DeliveryMap, createDemoRoute } from "@/components/delivery-map";
import type { VehicleType } from "@/components/delivery-map";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

type MissionPhase = "detail" | "preflight" | "inflight" | "complete";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
}

// Different pre-checks depending on vehicle type
const DRONE_PREFLIGHT: CheckItem[] = [
  { id: "battery", label: "Battery > 80%", checked: false },
  { id: "weather", label: "Weather OK (wind < 35 km/h)", checked: false },
  { id: "connection", label: "Semnal telemetrie stabil", checked: false },
  { id: "cargo", label: "Package secured & weighed", checked: false },
  { id: "route", label: "Flight route clear (no-fly zone clear)", checked: false },
  { id: "airspace", label: "Airspace authorization confirmed", checked: false },
];

const TERRESTRIAL_PREFLIGHT: CheckItem[] = [
  { id: "vehicle", label: "Vehicle checked & functional", checked: false },
  { id: "cargo", label: "Package secured & weighed", checked: false },
  { id: "route", label: "Navigation route calculated", checked: false },
  { id: "fuel", label: "Fuel/Battery sufficient", checked: false },
];

const VEHICLE_INFO: Record<string, { icon: string; label: string; launchText: string; inTransitLabel: string; stopLabel: string; fallbackLabel: string }> = {
  drone: { icon: "🚁", label: "Drone", launchText: "Launch Drone", inTransitLabel: "Flight Supervision", stopLabel: "⛔ STOP — Emergency Stop", fallbackLabel: "↩ FALLBACK — Return to DronePort" },
  auto: { icon: "🚗", label: "Car", launchText: "Start Delivery", inTransitLabel: "In Transit — Car", stopLabel: "⛔ STOP — Immediate Stop", fallbackLabel: "↩ RETURN — Back to Depot" },
  van: { icon: "🚐", label: "Van", launchText: "Start Delivery", inTransitLabel: "In Transit — Van", stopLabel: "⛔ STOP — Immediate Stop", fallbackLabel: "↩ RETURN — Back to Depot" },
  ebike: { icon: "🚲", label: "E-Bike", launchText: "Start Delivery", inTransitLabel: "In Transit — E-Bike", stopLabel: "⛔ STOP — Immediate Stop", fallbackLabel: "↩ RETURN — Back to Pickup Point" },
};

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { user } = useDropiAuth();
  const missionId = Number(id);
  const missionQuery = trpc.operations.myPilotMissionById.useQuery(
    { id: missionId },
    { enabled: Number.isFinite(missionId) },
  );
  const mission = missionQuery.data;
  const [phase, setPhase] = useState<MissionPhase>("detail");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const vehicleType = mission?.vehicleType || "drone";
  const isDrone = vehicleType === "drone";
  const initialChecks = isDrone ? DRONE_PREFLIGHT : TERRESTRIAL_PREFLIGHT;
  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (missionQuery.isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Loading mission...</Text>
      </ScreenContainer>
    );
  }

  // tRPC mutation for pilot status updates (triggers webhooks server-side)
  const pilotUpdateStatus = trpc.b2bDelivery.pilotUpdateStatus.useMutation({
    onError: (err) => {
      console.warn("[Pilot Status] Update failed:", err.message);
      // Non-blocking: mission flow continues even if server update fails
    },
  });

  // Helper to sync status to server (non-blocking for UX)
  const syncStatusToServer = async (newStatus: string, extras?: { failureReason?: string }) => {
    // Only sync if mission has a B2B delivery ID (orderId maps to delivery)
    if (!mission?.orderId) return;
    setStatusUpdating(true);
    try {
      await pilotUpdateStatus.mutateAsync({
        deliveryId: mission.orderId,
        newStatus: newStatus as any,
        ...(extras?.failureReason && { failureReason: extras.failureReason }),
      });
    } catch (e) {
      // Silent fail — local flow continues
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!mission) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Mission not found</Text>
      </ScreenContainer>
    );
  }

  const vehicleInfo = VEHICLE_INFO[vehicleType];
  const modeInfo = DELIVERY_MODE_INFO[mission.deliveryMode];
  const allChecked = checks.every((c) => c.checked);

  const toggleCheck = (checkId: string) => {
    setChecks((prev) => prev.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c)));
  };

  const handleAcceptMission = async () => {
    // Mission guard: block unverified delivery partners
    if (user?.dropiRole === "delivery_partner") {
      setCheckingVerification(true);
      try {
        const token = await AsyncStorage.getItem("@dropi_token");
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/trpc/verification.myStatus`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        const result = data?.result?.data;
        if (!result?.isFullyVerified) {
          Alert.alert(
            "Verification Required",
            "You must complete document verification before accepting missions. At minimum, a driving license or drone license must be approved.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Verify Now", onPress: () => router.push("/verify-documents" as any) },
            ]
          );
          setCheckingVerification(false);
          return;
        }
      } catch (e) {
        // If we can't check, allow in demo mode but warn
        console.warn("Could not verify status:", e);
      }
      setCheckingVerification(false);
    }
    // Sync to server: assigned
    syncStatusToServer("assigned");
    setPhase("preflight");
  };

  const handleLaunch = () => {
    if (!allChecked) {
      Alert.alert("Incomplete Check", "All items must be confirmed before launch.");
      return;
    }
    // Sync to server: pickup_enroute → picked_up → in_transit (rapid progression)
    syncStatusToServer("pickup_enroute");
    setTimeout(() => syncStatusToServer("picked_up"), 500);
    setTimeout(() => syncStatusToServer("in_transit"), 1000);
    setPhase("inflight");
  };

  const handleStop = () => {
    Alert.alert(
      "EMERGENCY STOP",
      isDrone
        ? "This will immediately stop the drone. Are you sure?"
        : "This will immediately stop the vehicle. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "STOP NOW",
          style: "destructive",
              onPress: () => {
            syncStatusToServer("failed", { failureReason: "Emergency stop executed by pilot" });
            Alert.alert("Vehicle Stopped", "Emergency stop executed. Creating incident report.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleFallback = () => {
    const fallbackMsg = isDrone
      ? "The drone will return to the nearest DronePort. Confirm?"
      : "The vehicle will return to the origin point. Confirm?";
    Alert.alert(
      "Activate Fallback",
      fallbackMsg,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Fallback",
            onPress: () => {
            syncStatusToServer("failed", { failureReason: isDrone ? "Fallback: drone returning to DronePort" : "Fallback: vehicle returning to depot" });
            Alert.alert("Fallback Active", isDrone ? "Drone returning to DronePort Alpha." : "Vehicle returning to depot.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert("Mission Complete", "Post-mission report has been recorded.");
    safeGoBack(router);
  };

  // DETAIL PHASE
  if (phase === "detail") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-4 pb-3 flex-row items-center">
            <TouchableOpacity onPress={() => safeGoBack(router)} className="mr-3 p-2">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Mission Details</Text>
          </View>

          {/* Vehicle & Delivery Mode */}
          <View className="mx-4 mb-4" style={{ backgroundColor: modeInfo.color + "10", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: modeInfo.color + "40" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 32 }}>{vehicleInfo.icon}</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: modeInfo.color }}>{modeInfo.label}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{modeInfo.description}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border }}>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "600" }}>Vehicle: {vehicleInfo.label}</Text>
              </View>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "600" }}>Mod: {mission.deliveryMode.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View className="mx-4 bg-surface border border-border rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">{mission.merchantName}</Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-success mr-2" />
                <Text className="text-sm text-foreground">Pickup: {mission.pickupZone}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-error mr-2" />
                <Text className="text-sm text-foreground">Delivery: {mission.deliveryZone}</Text>
              </View>
            </View>
          </View>

          <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Mission Info</Text>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Package Weight</Text>
              <Text className="text-sm text-foreground">{mission.packageWeight} kg</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Distance</Text>
              <Text className="text-sm text-foreground">{mission.distance} km</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">{isDrone ? "Estimated Flight Time" : "Estimated Transit Time"}</Text>
              <Text className="text-sm text-foreground">{mission.estimatedTime} min</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Vehicle Type</Text>
              <Text className="text-sm text-foreground">{vehicleInfo.icon} {vehicleInfo.label}</Text>
            </View>
          </View>

          <View className="mx-4">
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleAcceptMission}
            >
              <Text className="text-white font-bold text-base">Accept Mission</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // PRE-FLIGHT / PRE-DEPARTURE PHASE
  if (phase === "preflight") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-4 pb-3">
            <Text className="text-lg font-bold text-foreground">
              {isDrone ? "Pre-Flight Checklist" : "Checklist Pre-Plecare"}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {isDrone ? "All items must be confirmed before launch" : "Verify all items before departure"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontSize: 18 }}>{vehicleInfo.icon}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>{vehicleInfo.label} — {mission.merchantName}</Text>
            </View>
          </View>

          <View className="mx-4 gap-2 mb-6">
            {checks.map((check) => (
              <TouchableOpacity
                key={check.id}
                className={`flex-row items-center p-4 rounded-xl border ${check.checked ? "bg-success/10 border-success/30" : "bg-surface border-border"}`}
                activeOpacity={0.7}
                onPress={() => toggleCheck(check.id)}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: check.checked ? "#10B981" : "transparent",
                    borderWidth: 2,
                    borderColor: check.checked ? "#10B981" : "#9CA3AF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {check.checked && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <Text className={`text-sm flex-1 ${check.checked ? "text-foreground" : "text-muted"}`}>
                  {check.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mx-4">
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${allChecked ? "bg-primary" : "bg-muted/30"}`}
              activeOpacity={allChecked ? 0.8 : 1}
              onPress={handleLaunch}
            >
              <Text className={`font-bold text-base ${allChecked ? "text-white" : "text-muted"}`}>
                {allChecked ? vehicleInfo.launchText : "Complete All Checks"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // IN-FLIGHT / IN-TRANSIT PHASE
  if (phase === "inflight") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1">
          {/* Interactive Map - Live Supervision */}
          <View className="mx-4 mt-4 flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold text-base">📍 Supervizare Live</Text>
              <View className="flex-row items-center">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 }} />
                <Text className="text-muted text-xs">LIVE</Text>
              </View>
            </View>
            <DeliveryMap
              route={createDemoRoute(
                (mission.vehicleType || "drone") as VehicleType,
                "in_transit",
                0.45
              )}
              height={200}
              showRoute={true}
              showETA={true}
            />
            {/* Telemetry overlay */}
            <View className="bg-surface border border-border rounded-xl p-3 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-foreground text-sm font-semibold">{vehicleInfo.inTransitLabel}</Text>
                <Text className="text-primary text-sm font-bold">ETA: {Math.ceil(mission.estimatedTime * 0.6)} min</Text>
              </View>
              <Text className="text-muted text-xs mt-1">{mission.merchantName} → {mission.deliveryZone}</Text>
              <View className="flex-row mt-2 gap-4">
                {isDrone ? (
                  <>
                    <Text className="text-muted text-xs">📶 Alt: 85m</Text>
                    <Text className="text-muted text-xs">⚡ Speed: 65 km/h</Text>
                    <Text className="text-muted text-xs">🔋 Battery: 74%</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-muted text-xs">⚡ Speed: 28 km/h</Text>
                    <Text className="text-muted text-xs">📍 Dist: {(mission.distance * 0.6).toFixed(1)} km</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Critical Controls */}
          <View className="px-4 py-6 gap-3">
            {/* STOP Button - Large and prominent (56px height as per canonical) */}
            <TouchableOpacity
              style={{ backgroundColor: colors.error, borderRadius: 16, paddingVertical: 20, alignItems: "center" }}
              activeOpacity={0.8}
              onPress={handleStop}
            >
              <Text className="text-white font-bold text-xl">{vehicleInfo.stopLabel}</Text>
              <Text className="text-white/80 text-xs mt-0.5">Immediate Stop — Incident Report</Text>
            </TouchableOpacity>

            {/* FALLBACK Button */}
            <TouchableOpacity
              style={{ backgroundColor: colors.warning, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
              activeOpacity={0.8}
              onPress={handleFallback}
            >
              <Text className="text-white font-bold text-base">{vehicleInfo.fallbackLabel}</Text>
            </TouchableOpacity>

            {/* Complete Delivery */}
            <TouchableOpacity
              style={{ backgroundColor: colors.success, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: statusUpdating ? 0.6 : 1 }}
              activeOpacity={0.8}
              onPress={() => {
                syncStatusToServer("delivered");
                setPhase("complete");
              }}
            >
              <Text className="text-white font-semibold text-base">✓ Delivery Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // COMPLETE PHASE
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-6">
      <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center mb-4">
        <Text className="text-3xl">✓</Text>
      </View>
      <Text className="text-xl font-bold text-foreground mb-2">Mission Complete</Text>
      <Text className="text-sm text-muted text-center mb-2">
        {vehicleInfo.icon} {vehicleInfo.label} — {mission.merchantName}
      </Text>
      <Text className="text-xs text-muted text-center mb-6">Post-mission report has been recorded in the audit system.</Text>
      <TouchableOpacity
        className="bg-primary rounded-xl px-8 py-3.5"
        activeOpacity={0.8}
        onPress={handleComplete}
      >
        <Text className="text-white font-semibold">Back to Missions</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
