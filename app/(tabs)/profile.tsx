import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { getRoleConfig, CHANNEL_INFO } from "@/shared/types";

export default function ProfileeScreen() {
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

  const roleConfig = getRoleConfig(user.dropiRole);
  const channelInfo = CHANNEL_INFO[user.channel];
  const roleColor = channelInfo?.color || "#0066FF";

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-6">Profilee</Text>

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

          <View className="flex-row flex-wrap gap-2">
            <View style={{ backgroundColor: roleColor + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: roleColor, fontSize: 12, fontWeight: "600" }}>
                {roleConfig?.label || user.dropiRole.replace(/_/g, " ")}
              </Text>
            </View>
            <View style={{ backgroundColor: channelInfo?.color + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: channelInfo?.color, fontSize: 12, fontWeight: "600" }}>
                {user.channel} — {channelInfo?.label}
              </Text>
            </View>
            {user.zone && (
              <View className="bg-surface border border-border px-3 py-1.5 rounded-lg">
                <Text className="text-muted text-xs">{user.zone}</Text>
              </View>
            )}
          </View>

          {roleConfig && (
            <Text className="text-xs text-muted mt-3 italic">{roleConfig.description}</Text>
          )}
        </View>

        {/* Permissions */}
        {roleConfig && (
          <View className="bg-surface border border-border rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Permissions</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {roleConfig.permissions.map((perm) => (
                <View key={perm} className="bg-primary/10 px-2.5 py-1 rounded-md">
                  <Text className="text-primary text-xs">{perm.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
          <Text className="text-xs text-muted">All actions are logged and auditable per DROPi Canonical Policy.</Text>
          <Text className="text-xs text-muted mt-0.5">User ID: {user.id} • Channel: {user.channel}</Text>
          <Text className="text-xs text-muted mt-0.5">Role: {user.dropiRole}</Text>
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
