import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { PILOT_MISSIONS } from "@/lib/mock-data";

type MissionPhase = "detail" | "preflight" | "inflight" | "complete";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
}

const PREFLIGHT_CHECKS: CheckItem[] = [
  { id: "battery", label: "Battery Level > 80%", checked: false },
  { id: "weather", label: "Weather Conditions OK", checked: false },
  { id: "connection", label: "Signal Connection Stable", checked: false },
  { id: "cargo", label: "Cargo Secured & Weighed", checked: false },
  { id: "route", label: "Flight Route Clear", checked: false },
];

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mission = PILOT_MISSIONS.find((m) => m.id === Number(id));
  const [phase, setPhase] = useState<MissionPhase>("detail");
  const [checks, setChecks] = useState<CheckItem[]>(PREFLIGHT_CHECKS);

  if (!mission) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center">
        <Text className="text-muted">Mission not found</Text>
      </ScreenContainer>
    );
  }

  const allChecked = checks.every((c) => c.checked);

  const toggleCheck = (checkId: string) => {
    setChecks((prev) => prev.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c)));
  };

  const handleAcceptMission = () => {
    setPhase("preflight");
  };

  const handleLaunch = () => {
    if (!allChecked) {
      Alert.alert("Pre-Flight Incomplete", "All checks must be confirmed before launch.");
      return;
    }
    setPhase("inflight");
  };

  const handleStop = () => {
    Alert.alert(
      "EMERGENCY STOP",
      "This will immediately halt the drone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "STOP NOW",
          style: "destructive",
          onPress: () => {
            Alert.alert("Drone Stopped", "Emergency stop executed. Filing incident report.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleFallback = () => {
    Alert.alert(
      "Activate Fallback",
      "Drone will return to nearest DronePort. Confirm?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Fallback",
          onPress: () => {
            Alert.alert("Fallback Active", "Drone returning to DronePort Alpha.");
            setPhase("complete");
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert("Mission Complete", "Post-flight report submitted.");
    router.back();
  };

  // DETAIL PHASE
  if (phase === "detail") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-4 pb-3 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Mission Details</Text>
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
              <Text className="text-sm text-muted">Est. Flight Time</Text>
              <Text className="text-sm text-foreground">{mission.estimatedTime} min</Text>
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

  // PRE-FLIGHT PHASE
  if (phase === "preflight") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-4 pb-3">
            <Text className="text-lg font-bold text-foreground">Pre-Flight Checklist</Text>
            <Text className="text-sm text-muted mt-1">All items must be confirmed before launch</Text>
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
                {allChecked ? "Launch Drone" : "Complete All Checks"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // IN-FLIGHT PHASE
  if (phase === "inflight") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1">
          {/* Flight Map */}
          <View className="flex-1 bg-surface items-center justify-center mx-4 mt-4 rounded-2xl border border-primary/30">
            <Text className="text-primary font-semibold text-lg">In-Flight Supervision</Text>
            <Text className="text-muted text-sm mt-1">Drone DRN-007 Active</Text>
            <View className="mt-4 bg-primary/10 rounded-lg px-4 py-2">
              <Text className="text-primary text-sm">Alt: 45m | Speed: 32 km/h | Battery: 74%</Text>
            </View>
          </View>

          {/* Critical Controls */}
          <View className="px-4 py-6 gap-3">
            {/* STOP Button - Large and prominent */}
            <TouchableOpacity
              className="bg-error rounded-2xl py-5 items-center"
              activeOpacity={0.8}
              onPress={handleStop}
            >
              <Text className="text-white font-bold text-xl">⛔ STOP</Text>
              <Text className="text-white/80 text-xs mt-0.5">Emergency Halt</Text>
            </TouchableOpacity>

            {/* FALLBACK Button */}
            <TouchableOpacity
              className="bg-warning rounded-2xl py-4 items-center"
              activeOpacity={0.8}
              onPress={handleFallback}
            >
              <Text className="text-white font-bold text-base">↩ FALLBACK — Return to DronePort</Text>
            </TouchableOpacity>

            {/* Complete Delivery */}
            <TouchableOpacity
              className="bg-success rounded-xl py-3.5 items-center"
              activeOpacity={0.8}
              onPress={() => setPhase("complete")}
            >
              <Text className="text-white font-semibold text-base">Delivery Complete</Text>
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
      <Text className="text-sm text-muted text-center mb-6">Post-flight report has been logged to audit system.</Text>
      <TouchableOpacity
        className="bg-primary rounded-xl px-8 py-3.5"
        activeOpacity={0.8}
        onPress={handleComplete}
      >
        <Text className="text-white font-semibold">Return to Missions</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}
