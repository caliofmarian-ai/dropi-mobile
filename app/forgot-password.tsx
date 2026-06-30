import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, resetPassword } = useDropiAuth();

  const [step, setStep] = useState<"email" | "code" | "newpass">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = useCallback(async () => {
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
      setSuccess("A 6-digit code has been sent to your email. Check your inbox.");
      setStep("code");
    } else {
      setError(result.message || "Failed to send reset code");
    }
  }, [email, forgotPassword]);

  const handleVerifyCode = useCallback(() => {
    if (!code.trim() || code.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Code must be 6 digits");
      return;
    }
    setError("");
    setSuccess("Code accepted. Enter your new password.");
    setStep("newpass");
  }, [code]);

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
    const result = await resetPassword(code, newPassword);
    setLoading(false);
    if (result.success) {
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.replace("/login" as any), 2000);
    } else {
      setError(result.error || "Invalid or expired code. Please request a new one.");
      // If token is invalid/expired, go back to email step
      if (result.error?.includes("expired") || result.error?.includes("Invalid")) {
        setTimeout(() => {
          setStep("email");
          setCode("");
          setSuccess("");
        }, 2000);
      }
    }
  }, [newPassword, confirmPassword, code, resetPassword, router]);

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
              <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginBottom: 16 }}>
                <Text className="text-primary text-base font-medium">← Back to Login</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">
                {step === "email" ? "Reset Password" : step === "code" ? "Enter Code" : "New Password"}
              </Text>
              <Text className="text-sm text-muted mt-2">
                {step === "email"
                  ? "Enter your email address and we'll send you a 6-digit verification code."
                  : step === "code"
                  ? "Enter the 6-digit code sent to your email."
                  : "Choose a new password for your account."}
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

            {/* Step 1: Email */}
            {step === "email" && (
              <>
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
                    onSubmitEditing={handleSendCode}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold text-base">Send Verification Code</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Enter 6-digit code */}
            {step === "code" && (
              <>
                <View className="mb-6">
                  <Text className="text-sm font-medium text-foreground mb-1.5">6-Digit Code</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base text-center tracking-widest"
                    placeholder="000000"
                    placeholderTextColor="#9BA1A6"
                    value={code}
                    onChangeText={(t) => { setCode(t.replace(/[^0-9]/g, "").slice(0, 6)); setError(""); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                    style={{ fontSize: 24, letterSpacing: 8 }}
                  />
                  <Text className="text-xs text-muted mt-2 text-center">
                    Code expires in 15 minutes
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  activeOpacity={0.9}
                >
                  <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: code.length !== 6 ? 0.5 : 1 }}>
                    <Text className="text-white font-semibold text-base">Verify Code</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setStep("email"); setCode(""); setError(""); setSuccess(""); }}
                  style={{ marginTop: 16 }}
                >
                  <Text className="text-primary text-sm text-center">Didn't receive code? Send again</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: New Password */}
            {step === "newpass" && (
              <>
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
