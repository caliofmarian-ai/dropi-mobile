import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import type { DropiRole } from "@/shared/types";

const ROLE_LABELS: Record<DropiRole, string> = {
  client: "Client",
  merchant: "Merchant",
  pilot: "Pilot",
  operator: "Operator",
};

const ROLE_COLORS: Record<DropiRole, string> = {
  client: "#0066FF",
  merchant: "#F59E0B",
  pilot: "#8B5CF6",
  operator: "#10B981",
};

export default function ProfileScreen() {
  const { user, logout } = useDropiAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.dropiRole];

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-6">Profile</Text>

        {/* User Card */}
        <View className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <View className="flex-row items-center mb-4">
            <View
              style={{ backgroundColor: roleColor + "20", width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: roleColor, fontSize: 20, fontWeight: "700" }}>
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-foreground">{user.name}</Text>
              <Text className="text-sm text-muted">{user.email}</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View style={{ backgroundColor: roleColor + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: roleColor, fontSize: 12, fontWeight: "600" }}>
                {ROLE_LABELS[user.dropiRole]}
              </Text>
            </View>
            <View className="bg-primary/10 px-3 py-1.5 rounded-lg">
              <Text className="text-primary text-xs font-semibold">Channel {user.channel}</Text>
            </View>
            {user.zone && (
              <View className="bg-surface border border-border px-3 py-1.5 rounded-lg">
                <Text className="text-muted text-xs">{user.zone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings */}
        <View className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
          <TouchableOpacity className="px-4 py-3.5 border-b border-border flex-row justify-between items-center">
            <Text className="text-sm text-foreground">Notifications</Text>
            <Text className="text-muted text-xs">Enabled</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-3.5 border-b border-border flex-row justify-between items-center">
            <Text className="text-sm text-foreground">Language</Text>
            <Text className="text-muted text-xs">English</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-3.5 flex-row justify-between items-center">
            <Text className="text-sm text-foreground">Support</Text>
            <Text className="text-muted text-xs">→</Text>
          </TouchableOpacity>
        </View>

        {/* Audit Info */}
        <View className="bg-surface border border-border rounded-xl p-4 mb-6">
          <Text className="text-xs font-medium text-muted mb-1">Audit Info</Text>
          <Text className="text-xs text-muted">All actions are logged and auditable.</Text>
          <Text className="text-xs text-muted mt-0.5">User ID: {user.id}</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="bg-error/10 border border-error/30 rounded-xl py-3.5 items-center"
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Text className="text-error font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
