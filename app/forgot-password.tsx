import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, verifyResetCode, resetPassword } = useDropiAuth();

  const [step, setStep] = useState<"email" | "code" | "newpass">("email");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = useCallback(async () => {
    if (!identifier.trim()) {
      setError("Please enter your email address or username");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    const result = await forgotPassword(identifier);
    setLoading(false);
    if (result.success) {
      setSuccess("If the account exists, a 6-digit code has been sent. Check your inbox and use the newest message.");
      setStep("code");
    } else {
      setError(result.message || "Failed to send reset code");
    }
  }, [identifier, forgotPassword]);

  const handleVerifyCode = useCallback(async () => {
    if (!code.trim() || code.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Code must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    const result = await verifyResetCode(identifier, code);
    setLoading(false);
    if (result.success) {
      setSuccess("Code verified securely. You can now choose a new password.");
      setStep("newpass");
    } else {
      setError(result.error || "Invalid or expired code. Use the newest code from your inbox or request another one.");
    }
  }, [code, identifier, verifyResetCode]);

  const handleResetPassword = useCallback(async () => {
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword !== newPassword.trim()) {
      setError("Password cannot start or end with spaces. Remove the invisible space and try again.");
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
    const result = await resetPassword(identifier, code, newPassword);
    setLoading(false);
    if (result.success) {
      setSuccess("Password saved and verified. Existing sessions were signed out. Redirecting to login...");
      setTimeout(() => router.replace("/login" as any), 2000);
    } else {
      setSuccess("");
      setError(result.error || "Invalid or expired code. Use the newest code from your inbox or request another one.");
      if (result.error?.toLowerCase().includes("expired") || result.error?.toLowerCase().includes("invalid")) {
        setStep("code");
        setNewPassword("");
        setConfirmPassword("");
      }
    }
  }, [newPassword, confirmPassword, identifier, code, resetPassword, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center max-w-sm w-full self-center">
            <View className="mb-8">
              <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginBottom: 16 }}>
                <Text className="text-primary text-base font-medium">← Back to Login</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">
                {step === "email" ? "Reset Password" : step === "code" ? "Enter Code" : "New Password"}
              </Text>
              <Text className="text-sm text-muted mt-2">
                {step === "email"
                  ? "Enter your email address or username and we'll send a 6-digit verification code to the account email."
                  : step === "code"
                  ? "Enter the newest 6-digit code sent to the account email. DROPi will verify it before you can change the password."
                  : "Choose a new password for your account. Leading or trailing spaces are not allowed."}
              </Text>
            </View>

            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
                <Text className="text-error text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View className="bg-success/10 border border-success rounded-lg p-3 mb-4">
                <Text className="text-success text-sm text-center">{success}</Text>
              </View>
            ) : null}

            {step === "email" && (
              <>
                <View className="mb-6">
                  <Text className="text-sm font-medium text-foreground mb-1.5">Email or Username</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                    placeholder="email@example.com or username"
                    placeholderTextColor="#9BA1A6"
                    value={identifier}
                    onChangeText={(t) => { setIdentifier(t); setError(""); }}
                    keyboardType="default"
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

            {step === "code" && (
              <>
                <View className="mb-6">
                  <Text className="text-sm font-medium text-foreground mb-1.5">6-Digit Code</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base text-center tracking-widest"
                    placeholder="000000"
                    placeholderTextColor="#9BA1A6"
                    value={code}
                    onChangeText={(t) => { setCode(t.replace(/[^0-9]/g, "").slice(0, 6)); setError(""); setSuccess(""); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                    style={{ fontSize: 24, letterSpacing: 8 }}
                  />
                  <Text className="text-xs text-muted mt-2 text-center">
                    Code expires in 15 minutes. Only the newest code is valid after a resend.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  activeOpacity={0.9}
                >
                  <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading || code.length !== 6 ? 0.5 : 1 }}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold text-base">Verify Code</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setStep("email"); setCode(""); setError(""); setSuccess(""); }}
                  style={{ marginTop: 16 }}
                >
                  <Text className="text-primary text-sm text-center">Didn’t receive the latest code? Send again</Text>
                </TouchableOpacity>
              </>
            )}

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
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
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
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
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
