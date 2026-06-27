import { useState } from "react";
import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";
import { CHANNEL_INFO, type Channel } from "@/shared/types";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const router = useRouter();
  const { login } = useDropiAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const success = await login(email, password);
      setIsLoading(false);
      if (success) {
        router.replace("/(tabs)");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setIsLoading(false);
      setError("Login failed");
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    const success = await login(demoEmail, "demo");
    setIsLoading(false);
    if (success) {
      router.replace("/(tabs)");
    }
  };

  const channels: Channel[] = ["C1", "C2", "C3", "ADMIN"];

  const getDemoAccountsForChannel = (channel: Channel) => {
    return Object.entries(DEMO_ACCOUNTS).filter(([_, user]) => user.channel === channel);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pt-10">
            {/* Logo */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-3">
                <Text className="text-3xl font-bold text-white">D</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">DROPi</Text>
              <Text className="text-sm text-muted mt-1">Autonomous Delivery Platform</Text>
            </View>

            {/* Login Form */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-1">Email</Text>
              <TextInput
                className="w-full h-12 px-4 bg-surface border border-border rounded-xl text-foreground"
                placeholder="your@email.com"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text className="text-sm font-medium text-foreground mb-1 mt-3">Password</Text>
              <TextInput
                className="w-full h-12 px-4 bg-surface border border-border rounded-xl text-foreground"
                placeholder="Enter password"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              {error ? <Text className="text-error text-sm mt-2">{error}</Text> : null}
              <TouchableOpacity
                className="w-full h-12 bg-primary rounded-xl items-center justify-center mt-4"
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Channel Selector */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-foreground mb-3">Demo Accounts — Select Channel:</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {channels.map((ch) => {
                  const info = CHANNEL_INFO[ch];
                  const isSelected = selectedChannel === ch;
                  return (
                    <TouchableOpacity
                      key={ch}
                      onPress={() => setSelectedChannel(isSelected ? null : ch)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? info.color : "#E5E7EB",
                        backgroundColor: isSelected ? info.color + "15" : "transparent",
                      }}
                    >
                      <Text style={{ color: info.color, fontWeight: "700", fontSize: 13 }}>{ch}</Text>
                      <Text style={{ color: "#6B7280", fontSize: 10 }}>{info.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Demo Accounts List */}
            {selectedChannel && (
              <View className="bg-surface rounded-xl p-3 border border-border">
                <Text className="text-xs font-bold text-muted mb-2">
                  {CHANNEL_INFO[selectedChannel].label} — {CHANNEL_INFO[selectedChannel].description}
                </Text>
                {getDemoAccountsForChannel(selectedChannel).map(([demoEmail, user]) => (
                  <TouchableOpacity
                    key={demoEmail}
                    onPress={() => handleDemoLogin(demoEmail)}
                    className="flex-row items-center justify-between py-2.5"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB" }}
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-medium text-foreground">{user.name}</Text>
                      <Text className="text-xs text-muted">{demoEmail}</Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: CHANNEL_INFO[selectedChannel].color + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: CHANNEL_INFO[selectedChannel].color, fontSize: 9, fontWeight: "600" }}>
                        {user.dropiRole.replace(/_/g, " ").toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <Text className="text-xs text-muted mt-2 italic">Tap any account to login instantly</Text>
              </View>
            )}

            {!selectedChannel && (
              <View className="bg-surface rounded-xl p-4 border border-border items-center">
                <Text className="text-xs text-muted text-center">
                  Select a channel above to see available demo accounts{"\n"}(29 roles across 4 channels)
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
