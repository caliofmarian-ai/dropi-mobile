import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, resetPassword } = useDropiAuth();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendReset = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setSuccess("A reset link has been sent to your email. Check your inbox.");
      // For development: if resetToken is returned, allow inline reset
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setStep("reset");
        setSuccess("Enter your new password below.");
      }
    } else {
      setError(result.message || "Failed to send reset email");
    }
  }, [email, forgotPassword]);

  const handleResetPassword = useCallback(async () => {
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);
    setError("");
    const result = await resetPassword(resetToken, newPassword);
    setLoading(false);
    if (result.success) {
      setSuccess("Password reset successfully! You can now login with your new password.");
      setTimeout(() => router.replace("/login" as any), 2000);
    } else {
      setError(result.error || "Password reset failed");
    }
  }, [newPassword, confirmPassword, resetToken, resetPassword, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center max-w-sm w-full self-center">
            {/* Header */}
            <View className="mb-8">
              <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
                <Text className="text-primary text-base font-medium">← Back to Login</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">
                {step === "email" ? "Reset Password" : "New Password"}
              </Text>
              <Text className="text-sm text-muted mt-2">
                {step === "email"
                  ? "Enter your email address and we'll send you a reset link."
                  : "Enter your new password below."}
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
                <Text className="text-error text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Success */}
            {success ? (
              <View className="bg-success/10 border border-success rounded-lg p-3 mb-4">
                <Text className="text-success text-sm text-center">{success}</Text>
              </View>
            ) : null}

            {step === "email" ? (
              <>
                {/* Email Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-foreground mb-1.5">Email Address</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                    placeholder="your@email.com"
                    placeholderTextColor="#9BA1A6"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendReset}
                  />
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  onPress={handleSendReset}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold text-base">Send Reset Link</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* New Password */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-foreground mb-1.5">New Password</Text>
                  <View className="flex-row items-center bg-surface border border-border rounded-xl">
                    <TextInput
                      className="flex-1 px-4 py-3.5 text-foreground text-base"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      placeholderTextColor="#9BA1A6"
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); setError(""); }}
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
                    placeholder="Repeat new password"
                    placeholderTextColor="#9BA1A6"
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold text-base">Reset Password</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
