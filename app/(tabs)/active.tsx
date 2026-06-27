import { Text, View, TouchableOpacity, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";

export default function ActiveMissionScreen() {
  const [hasActiveMission] = useState(false);

  if (!hasActiveMission) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
          <Text className="text-2xl">🛸</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground mb-1">No Active Mission</Text>
        <Text className="text-sm text-muted text-center">
          Accept a mission from the Mission Radar to begin a delivery flight.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Flight Map Area */}
        <View className="flex-1 bg-surface items-center justify-center mx-4 mt-4 rounded-2xl border border-primary/30">
          <Text className="text-primary font-semibold text-lg">In-Flight</Text>
          <Text className="text-muted text-sm mt-1">DRN-007 Active</Text>
          <View className="mt-4 bg-primary/10 rounded-lg px-4 py-2">
            <Text className="text-primary text-sm">Alt: 45m | Speed: 32 km/h | Bat: 74%</Text>
          </View>
        </View>

        {/* Controls */}
        <View className="px-4 py-6 gap-3">
          <TouchableOpacity
            className="bg-error rounded-2xl py-5 items-center"
            activeOpacity={0.8}
            onPress={() => Alert.alert("STOP", "Emergency stop activated")}
          >
            <Text className="text-white font-bold text-xl">⛔ STOP</Text>
            <Text className="text-white/80 text-xs mt-0.5">Emergency Halt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-warning rounded-xl py-4 items-center"
            activeOpacity={0.8}
            onPress={() => Alert.alert("FALLBACK", "Returning to DronePort")}
          >
            <Text className="text-white font-bold text-base">↩ FALLBACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
