import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { PILOT_MISSIONS } from "@/lib/mock-data";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import { DeliveryMap, createDemoRoute } from "@/components/delivery-map";
import type { VehicleType } from "@/components/delivery-map";

type MissionPhase = "detail" | "preflight" | "inflight" | "complete";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
}

// Different pre-checks depending on vehicle type
const DRONE_PREFLIGHT: CheckItem[] = [
  { id: "battery", label: "Baterie > 80%", checked: false },
  { id: "weather", label: "Condiții meteo OK (vânt < 35 km/h)", checked: false },
  { id: "connection", label: "Semnal telemetrie stabil", checked: false },
  { id: "cargo", label: "Colet securizat & cântărit", checked: false },
  { id: "route", label: "Rută de zbor liberă (no-fly zone clear)", checked: false },
  { id: "airspace", label: "Autorizare spațiu aerian confirmată", checked: false },
];

const TERRESTRIAL_PREFLIGHT: CheckItem[] = [
  { id: "vehicle", label: "Vehicul verificat & funcțional", checked: false },
  { id: "cargo", label: "Colet securizat & cântărit", checked: false },
  { id: "route", label: "Rută de navigare calculată", checked: false },
  { id: "fuel", label: "Combustibil/Baterie suficientă", checked: false },
];

const VEHICLE_INFO: Record<string, { icon: string; label: string; launchText: string; inTransitLabel: string; stopLabel: string; fallbackLabel: string }> = {
  drone: { icon: "🚁", label: "Dronă", launchText: "Lansare Dronă", inTransitLabel: "Supervizare Zbor", stopLabel: "⛔ STOP — Oprire de Urgență", fallbackLabel: "↩ FALLBACK — Retur la DronePort" },
  auto: { icon: "🚗", label: "Auto", launchText: "Pornire Cursă", inTransitLabel: "În Tranzit — Auto", stopLabel: "⛔ STOP — Oprire Imediată", fallbackLabel: "↩ RETUR — Întoarcere la Depozit" },
  van: { icon: "🚐", label: "Van", launchText: "Pornire Cursă", inTransitLabel: "În Tranzit — Van", stopLabel: "⛔ STOP — Oprire Imediată", fallbackLabel: "↩ RETUR — Întoarcere la Depozit" },
  ebike: { icon: "🚲", label: "E-Bike", launchText: "Pornire Livrare", inTransitLabel: "În Tranzit — E-Bike", stopLabel: "⛔ STOP — Oprire Imediată", fallbackLabel: "↩ RETUR — Întoarcere la Punct Pickup" },
};

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const mission = PILOT_MISSIONS.find((m) => m.id === Number(id));
  const [phase, setPhase] = useState<MissionPhase>("detail");

  const vehicleType = mission?.vehicleType || "drone";
  const isDrone = vehicleType === "drone";
  const initialChecks = isDrone ? DRONE_PREFLIGHT : TERRESTRIAL_PREFLIGHT;
  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);

  if (!mission) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Misiune negăsită</Text>
      </ScreenContainer>
    );
  }

  const vehicleInfo = VEHICLE_INFO[vehicleType];
  const modeInfo = DELIVERY_MODE_INFO[mission.deliveryMode];
  const allChecked = checks.every((c) => c.checked);

  const toggleCheck = (checkId: string) => {
    setChecks((prev) => prev.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c)));
  };

  const handleAcceptMission = () => {
    setPhase("preflight");
  };

  const handleLaunch = () => {
    if (!allChecked) {
      Alert.alert("Verificare Incompletă", "Toate punctele trebuie confirmate înainte de lansare.");
      return;
    }
    setPhase("inflight");
  };

  const handleStop = () => {
    Alert.alert(
      "OPRIRE DE URGENȚĂ",
      isDrone
        ? "Aceasta va opri imediat drona. Ești sigur?"
        : "Aceasta va opri imediat vehiculul. Ești sigur?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "STOP ACUM",
          style: "destructive",
          onPress: () => {
            Alert.alert("Vehicul Oprit", "Oprire de urgență executată. Se creează raport de incident.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleFallback = () => {
    const fallbackMsg = isDrone
      ? "Drona se va întoarce la cel mai apropiat DronePort. Confirmi?"
      : "Vehiculul se va întoarce la punctul de origine. Confirmi?";
    Alert.alert(
      "Activare Fallback",
      fallbackMsg,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Confirmă Fallback",
          onPress: () => {
            Alert.alert("Fallback Activ", isDrone ? "Drona se întoarce la DronePort Alpha." : "Vehiculul se întoarce la depozit.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert("Misiune Completă", "Raportul post-misiune a fost înregistrat.");
    router.back();
  };

  // DETAIL PHASE
  if (phase === "detail") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-4 pb-3 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
              <Text className="text-primary text-base">← Înapoi</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Detalii Misiune</Text>
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
                <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "600" }}>Vehicul: {vehicleInfo.label}</Text>
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
                <Text className="text-sm text-foreground">Livrare: {mission.deliveryZone}</Text>
              </View>
            </View>
          </View>

          <View className="mx-4 bg-surface border border-border rounded-xl p-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Info Misiune</Text>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Greutate Colet</Text>
              <Text className="text-sm text-foreground">{mission.packageWeight} kg</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Distanță</Text>
              <Text className="text-sm text-foreground">{mission.distance} km</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">{isDrone ? "Timp Estimat Zbor" : "Timp Estimat Tranzit"}</Text>
              <Text className="text-sm text-foreground">{mission.estimatedTime} min</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-muted">Tip Vehicul</Text>
              <Text className="text-sm text-foreground">{vehicleInfo.icon} {vehicleInfo.label}</Text>
            </View>
          </View>

          <View className="mx-4">
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleAcceptMission}
            >
              <Text className="text-white font-bold text-base">Acceptă Misiunea</Text>
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
              {isDrone ? "Toate punctele trebuie confirmate înainte de lansare" : "Verifică toate punctele înainte de pornire"}
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
                {allChecked ? vehicleInfo.launchText : "Completează Toate Verificările"}
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
                    <Text className="text-muted text-xs">⚡ Viteză: 65 km/h</Text>
                    <Text className="text-muted text-xs">🔋 Baterie: 74%</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-muted text-xs">⚡ Viteză: 28 km/h</Text>
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
              <Text className="text-white/80 text-xs mt-0.5">Oprire Imediată — Raport Incident</Text>
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
              style={{ backgroundColor: colors.success, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              activeOpacity={0.8}
              onPress={() => setPhase("complete")}
            >
              <Text className="text-white font-semibold text-base">✓ Livrare Completă</Text>
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
      <Text className="text-xl font-bold text-foreground mb-2">Misiune Completă</Text>
      <Text className="text-sm text-muted text-center mb-2">
        {vehicleInfo.icon} {vehicleInfo.label} — {mission.merchantName}
      </Text>
      <Text className="text-xs text-muted text-center mb-6">Raportul post-misiune a fost înregistrat în sistemul de audit.</Text>
      <TouchableOpacity
        className="bg-primary rounded-xl px-8 py-3.5"
        activeOpacity={0.8}
        onPress={handleComplete}
      >
        <Text className="text-white font-semibold">Înapoi la Misiuni</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
