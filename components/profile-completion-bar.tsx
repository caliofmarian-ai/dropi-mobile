import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import type { DropiUser } from "@/shared/types";

interface ProfileStep {
  key: string;
  label: string;
  completed: boolean;
  route?: string;
  description: string;
}

interface ProfileCompletionBarProps {
  user: DropiUser;
}

export function ProfileCompletionBar({ user }: ProfileCompletionBarProps) {
  const router = useRouter();
  const colors = useColors();

  // Define completion steps based on user role
  const steps: ProfileStep[] = getStepsForUser(user);
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  // Don't show if fully complete
  if (percentage === 100) {
    return (
      <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg">✅</Text>
          <Text className="text-sm font-semibold text-success">Profile Complete</Text>
        </View>
        <Text className="text-xs text-muted mt-1">
          All verification steps are done. You have full platform access.
        </Text>
      </View>
    );
  }

  // Progress bar color based on percentage
  const barColor =
    percentage >= 75 ? colors.success : percentage >= 50 ? colors.warning : colors.primary;

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-foreground">Profile Completion</Text>
        <Text className="text-xs font-bold" style={{ color: barColor }}>
          {percentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-2.5 bg-border rounded-full overflow-hidden mb-3">
        <View
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: 9999,
          }}
        />
      </View>

      {/* Steps */}
      <View className="gap-2">
        {steps.map((step) => (
          <TouchableOpacity
            key={step.key}
            onPress={() => {
              if (!step.completed && step.route) {
                router.push(step.route as any);
              }
            }}
            disabled={step.completed || !step.route}
            style={{ opacity: step.completed ? 0.7 : 1 }}
            className="flex-row items-center gap-3 py-1.5"
          >
            {/* Step indicator */}
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: step.completed ? colors.success + "20" : colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {step.completed ? (
                <Text style={{ color: colors.success, fontSize: 12, fontWeight: "700" }}>✓</Text>
              ) : (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.muted,
                  }}
                />
              )}
            </View>

            {/* Step content */}
            <View className="flex-1">
              <Text
                className={`text-sm ${step.completed ? "text-muted line-through" : "text-foreground font-medium"}`}
              >
                {step.label}
              </Text>
              {!step.completed && (
                <Text className="text-xs text-muted mt-0.5">{step.description}</Text>
              )}
            </View>

            {/* Action arrow for incomplete steps */}
            {!step.completed && step.route && (
              <Text className="text-primary text-xs font-semibold">→</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Hint */}
      <Text className="text-xs text-muted mt-3 italic">
        Complete all steps to unlock full platform features.
      </Text>
    </View>
  );
}

function getStepsForUser(user: DropiUser): ProfileStep[] {
  const steps: ProfileStep[] = [];

  // Step 1: Email verification (all users)
  steps.push({
    key: "email",
    label: "Verify email address",
    completed: user.emailVerified === true,
    route: "/verify-email",
    description: "Confirm your email to secure your account",
  });

  // Step 2: Document verification (delivery partners only)
  if (user.dropiRole === "delivery_partner") {
    steps.push({
      key: "documents",
      label: "Submit verification documents",
      completed: user.isVerified === true,
      route: "/verify-documents",
      description: "Upload ID and license for delivery approval",
    });
  }

  // Step 3: Role application (for users who might want to upgrade)
  if (
    user.dropiRole === "customer" ||
    user.dropiRole === "merchant" ||
    user.dropiRole === "delivery_partner"
  ) {
    steps.push({
      key: "role",
      label: "Apply for operational role",
      completed: user.hasAppliedForRole === true,
      route: "/apply-role",
      description: "Request access to C2/C3 operational channels",
    });
  }

  // Step 4: Profile photo (all users)
  steps.push({
    key: "photo",
    label: "Add profile photo",
    completed: !!user.profilePhotoUrl,
    route: undefined, // Handled via modal on profile screen
    description: "Tap your avatar above to add a photo",
  });

  return steps;
}
