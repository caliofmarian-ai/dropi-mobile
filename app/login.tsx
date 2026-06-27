import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth, DEMO_ACCOUNTS } from "@/lib/auth-context";
import { CHANNEL_INFO, getRolesForChannel, type Channel } from "@/shared/types";

export default function LoginScreen() {
  const router = useRouter();
  const { login, enterDemoMode } = useDropiAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error || "Login failed");
    }
  }, [email, password, login, router]);

  const handleDemoLogin = useCallback(async (demoEmail: string) => {
    await enterDemoMode(demoEmail);
    router.replace("/(tabs)");
  }, [enterDemoMode, router]);

  if (showDemo) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity
                onPress={() => { setShowDemo(false); setSelectedChannel(null); }}
                style={{ padding: 4 }}
              >
                <Text className="text-primary text-base font-medium">← Back to Login</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold text-foreground mb-2">Demo Mode</Text>
            <Text className="text-sm text-muted mb-6">Select a channel and role to explore the platform.</Text>

            {/* Channel Selector */}
            {!selectedChannel && (
              <View className="gap-3">
                {(Object.keys(CHANNEL_INFO) as Channel[]).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => setSelectedChannel(ch)}
                    style={{ opacity: 1 }}
                    activeOpacity={0.7}
                  >
                    <View className="bg-surface border border-border rounded-xl p-4">
                      <View className="flex-row items-center gap-3">
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: CHANNEL_INFO[ch].color, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{ch}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-foreground font-semibold">{CHANNEL_INFO[ch].label}</Text>
                          <Text className="text-muted text-xs">{CHANNEL_INFO[ch].description}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Role Selector */}
            {selectedChannel && (
              <View className="gap-2">
                <TouchableOpacity onPress={() => setSelectedChannel(null)}>
                  <Text className="text-primary text-sm mb-3">← Change Channel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-foreground mb-2">
                  {CHANNEL_INFO[selectedChannel].label} Roles
                </Text>
                {getRolesForChannel(selectedChannel).map((rc) => {
                  const demoEmail = Object.keys(DEMO_ACCOUNTS).find(
                    (e) => DEMO_ACCOUNTS[e].dropiRole === rc.role && DEMO_ACCOUNTS[e].channel === selectedChannel
                  );
                  return (
                    <TouchableOpacity
                      key={rc.role}
                      onPress={() => demoEmail && handleDemoLogin(demoEmail)}
                      activeOpacity={0.7}
                    >
                      <View className="bg-surface border border-border rounded-lg p-3 flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-foreground font-medium text-sm">{rc.label}</Text>
                          <Text className="text-muted text-xs">{rc.description}</Text>
                        </View>
                        <Text className="text-primary text-xs font-medium">Enter →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center max-w-sm w-full self-center">
            {/* Logo / Title */}
            <View className="items-center mb-10">
              <Text className="text-4xl font-bold text-primary">DROPi</Text>
              <Text className="text-sm text-muted mt-1">Logistics Platform</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
                <Text className="text-error text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                placeholder="your@email.com"
                placeholderTextColor="#9BA1A6"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl">
                <TextInput
                  className="flex-1 px-4 py-3.5 text-foreground text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9BA1A6"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  <Text className="text-muted text-sm">{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Login</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Links */}
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                <Text className="text-primary text-sm">Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/register" as any)}>
                <Text className="text-primary text-sm font-medium">Register →</Text>
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-muted text-xs mx-4">or</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Demo Mode Button */}
            <TouchableOpacity
              onPress={() => setShowDemo(true)}
              activeOpacity={0.8}
            >
              <View className="border-2 border-primary/30 rounded-xl py-3.5 items-center">
                <Text className="text-primary font-medium text-base">Enter Demo Mode</Text>
                <Text className="text-muted text-xs mt-0.5">Explore all 29 roles without registration</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
