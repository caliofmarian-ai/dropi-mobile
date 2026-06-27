import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useDropiAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace("/(tabs)");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6">
            {/* Logo Area */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
                <Text className="text-3xl font-bold text-white">D</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">DROPi</Text>
              <Text className="text-base text-muted mt-1">Autonomous Delivery Platform</Text>
            </View>

            {/* Login Form */}
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {error ? (
                <Text className="text-error text-sm text-center">{error}</Text>
              ) : null}

              <TouchableOpacity
                className="bg-primary rounded-xl py-4 items-center mt-2"
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Demo Accounts */}
            <View className="mt-8 p-4 bg-surface rounded-xl border border-border">
              <Text className="text-sm font-medium text-foreground mb-2">Demo Accounts:</Text>
              <Text className="text-xs text-muted">client@dropi.app — Client Dashboard</Text>
              <Text className="text-xs text-muted">merchant@dropi.app — Merchant Queue</Text>
              <Text className="text-xs text-muted">pilot@dropi.app — Pilot Missions</Text>
              <Text className="text-xs text-muted">operator@dropi.app — Zone Control</Text>
              <Text className="text-xs text-muted mt-1 italic">Password: any value</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
