import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDropiAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

const DISMISS_KEY = "@dropi_nudge_dismissed";

interface CompletionStep {
  label: string;
  done: boolean;
  route?: string;
}

/**
 * Onboarding nudge banner that appears on the home screen
 * when the user's profile completion is below 100%.
 * Dismissible per session, reappears on next app launch.
 */
export function OnboardingNudgeBanner() {
  const { user } = useDropiAuth();
  const router = useRouter();
  const colors = useColors();
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then((val) => {
      if (val === "true") setDismissed(true);
      setLoaded(true);
    });
  }, []);

  if (!loaded || !user?.isAuthenticated) return null;

  // Calculate completion steps
  const steps: CompletionStep[] = [
    {
      label: "Email verified",
      done: user.emailVerified === true,
      route: "/verify-email",
    },
    {
      label: "Profile photo",
      done: !!user.profilePhotoUrl,
      route: "/(tabs)/profile",
    },
  ];

  // Add role-specific steps
  if (user.dropiRole === "delivery_partner") {
    steps.push({
      label: "Documents verified",
      done: user.isVerified === true,
      route: "/verify-documents",
    });
  }

  if (user.dropiRole === "customer") {
    steps.push({
      label: "Apply for a role",
      done: !!user.channel && user.channel !== "C1",
      route: "/apply-role",
    });
  }

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  // Don't show if 100% complete or dismissed
  if (percentage >= 100 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISS_KEY, "true");
  };

  const handleGoToProfile = () => {
    // Navigate to the first incomplete step
    const nextStep = steps.find((s) => !s.done);
    if (nextStep?.route) {
      router.push(nextStep.route as any);
    } else {
      router.push("/(tabs)/profile");
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.primary + "10",
        borderWidth: 1,
        borderColor: colors.primary + "30",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
            Complete your profile
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {completedCount}/{totalSteps} steps done — {percentage}%
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.border,
          borderRadius: 3,
          marginTop: 12,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            width: `${percentage}%`,
            backgroundColor: colors.primary,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Steps list */}
      <View style={{ marginTop: 10, gap: 6 }}>
        {steps.map((step, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 13, marginRight: 6 }}>
              {step.done ? "✓" : "○"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: step.done ? colors.muted : colors.foreground,
                textDecorationLine: step.done ? "line-through" : "none",
              }}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={handleGoToProfile}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
          Continue Setup
        </Text>
      </TouchableOpacity>
    </View>
  );
}
