import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { CHANNEL_INFO, getRolesForChannel, type Channel } from "@/shared/types";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useDropiAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [channel, setChannel] = useState<Channel>("C1");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const roles = getRolesForChannel(channel);

  const handleRegister = useCallback(async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);
    setError("");
    const result = await register({
      email,
      password,
      name,
      dropiRole: role,
      channel,
      zone: "Manila-Central",
    });
    setLoading(false);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error || "Registration failed");
    }
  }, [name, email, password, confirmPassword, channel, role, register, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 max-w-sm w-full self-center">
            {/* Header */}
            <View className="mb-6 mt-4">
              <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                <Text className="text-primary text-base font-medium">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Create Account</Text>
              <Text className="text-sm text-muted mt-1">Join the DROPi logistics platform</Text>
            </View>

            {/* Error */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
                <Text className="text-error text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Full Name</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                placeholder="Your full name"
                placeholderTextColor="#9BA1A6"
                value={name}
                onChangeText={(t) => { setName(t); setError(""); }}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
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
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl">
                <TextInput
                  className="flex-1 px-4 py-3.5 text-foreground text-base"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  placeholderTextColor="#9BA1A6"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  <Text className="text-muted text-sm">{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-1.5">Confirm Password</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                placeholder="Repeat password"
                placeholderTextColor="#9BA1A6"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
              />
            </View>

            {/* Channel Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Channel</Text>
              <View className="flex-row gap-2">
                {(Object.keys(CHANNEL_INFO) as Channel[]).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => { setChannel(ch); setRole(getRolesForChannel(ch)[0]?.role || "customer"); }}
                    activeOpacity={0.7}
                  >
                    <View
                      className="rounded-lg px-3 py-2 border"
                      style={{
                        borderColor: channel === ch ? CHANNEL_INFO[ch].color : "#E5E7EB",
                        backgroundColor: channel === ch ? CHANNEL_INFO[ch].color + "15" : "transparent",
                      }}
                    >
                      <Text style={{ color: channel === ch ? CHANNEL_INFO[ch].color : "#6B7280", fontWeight: "600", fontSize: 12 }}>
                        {ch}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Role Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-2">Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {roles.map((rc) => (
                    <TouchableOpacity
                      key={rc.role}
                      onPress={() => setRole(rc.role)}
                      activeOpacity={0.7}
                    >
                      <View
                        className="rounded-lg px-3 py-2 border"
                        style={{
                          borderColor: role === rc.role ? CHANNEL_INFO[channel].color : "#E5E7EB",
                          backgroundColor: role === rc.role ? CHANNEL_INFO[channel].color + "15" : "transparent",
                        }}
                      >
                        <Text style={{ color: role === rc.role ? CHANNEL_INFO[channel].color : "#6B7280", fontWeight: "500", fontSize: 11 }}>
                          {rc.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Create Account</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-muted text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-sm font-medium">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
