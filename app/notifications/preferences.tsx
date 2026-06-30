/**
 * Notification Preferences — Sprint 6B
 * Allows users to toggle push and in-app notifications per category.
 */
import { useState, useEffect } from "react";
import { Text, View, ScrollView, Switch, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { safeGoBack } from "@/lib/safe-back";

interface PreferenceCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  pushKey: string;
  inAppKey: string;
}

const CATEGORIES: PreferenceCategory[] = [
  {
    key: "verification",
    label: "Verification",
    description: "Document and account approvals/rejections",
    icon: "checkmark.shield.fill",
    color: "#22C55E",
    pushKey: "pushVerification",
    inAppKey: "inAppVerification",
  },
  {
    key: "missions",
    label: "Missions",
    description: "New missions, delivery status updates",
    icon: "airplane",
    color: "#3B82F6",
    pushKey: "pushMissions",
    inAppKey: "inAppMissions",
  },
  {
    key: "orders",
    label: "Orders",
    description: "New orders, confirmations, cancellations",
    icon: "cart.fill",
    color: "#8B5CF6",
    pushKey: "pushOrders",
    inAppKey: "inAppOrders",
  },
  {
    key: "system",
    label: "System",
    description: "Platform updates, maintenance",
    icon: "gear",
    color: "#6B7280",
    pushKey: "pushSystem",
    inAppKey: "inAppSystem",
  },
  {
    key: "promotions",
    label: "Promotions",
    description: "Special offers, bonuses, campaigns",
    icon: "tag.fill",
    color: "#F59E0B",
    pushKey: "pushPromotions",
    inAppKey: "inAppPromotions",
  },
  {
    key: "security",
    label: "Security",
    description: "New logins, security alerts",
    icon: "shield.fill",
    color: "#EF4444",
    pushKey: "pushSecurity",
    inAppKey: "inAppSecurity",
  },
];

export default function NotificationPreferencesScreen() {
  const colors = useColors();
  const router = useRouter();

  const { data: prefs, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updatePrefs = trpc.notifications.updatePreferences.useMutation();
  const utils = trpc.useUtils();

  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs as Record<string, boolean>);
    }
  }, [prefs]);

  const handleToggle = async (key: string, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    await updatePrefs.mutateAsync({ [key]: value });
    utils.notifications.getPreferences.invalidate();
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => router.replace("/notifications")}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
        >
          <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">Notification Preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Push Notifications Section */}
        <View className="px-4 pt-6 pb-2">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider">
            Push Notifications
          </Text>
          <Text className="text-xs text-muted mt-1">
            Appear on lock screen and notification bar
          </Text>
        </View>

        {CATEGORIES.map((cat) => (
          <View
            key={`push-${cat.key}`}
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: cat.color + "15",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}>
              <IconSymbol name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-medium text-foreground">{cat.label}</Text>
              <Text className="text-xs text-muted">{cat.description}</Text>
            </View>
            <Switch
              value={localPrefs[cat.pushKey] ?? true}
              onValueChange={(val) => handleToggle(cat.pushKey, val)}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={localPrefs[cat.pushKey] ? colors.primary : "#f4f3f4"}
            />
          </View>
        ))}

        {/* In-App Notifications Section */}
        <View className="px-4 pt-8 pb-2">
          <Text className="text-xs font-semibold text-muted uppercase tracking-wider">
            In-App Notifications
          </Text>
          <Text className="text-xs text-muted mt-1">
            Appear in the app notification center
          </Text>
        </View>

        {CATEGORIES.map((cat) => (
          <View
            key={`inapp-${cat.key}`}
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: cat.color + "15",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}>
              <IconSymbol name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-medium text-foreground">{cat.label}</Text>
              <Text className="text-xs text-muted">{cat.description}</Text>
            </View>
            <Switch
              value={localPrefs[cat.inAppKey] ?? true}
              onValueChange={(val) => handleToggle(cat.inAppKey, val)}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={localPrefs[cat.inAppKey] ? colors.primary : "#f4f3f4"}
            />
          </View>
        ))}

        {/* Info note */}
        <View className="px-4 pt-6">
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-xs text-muted leading-relaxed">
              Security notifications cannot be fully disabled — you will always receive critical security alerts in the app, regardless of settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
