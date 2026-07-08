import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/constants/oauth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@dropi_token";

// API helper
async function apiCall(path: string, input: any) {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: input }),
    credentials: "include",
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error?.json?.message || data.error?.message || "API error");
  return data.result?.data?.json ?? data.result?.data;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await apiCall("dropiAuth.verifyEmail", { code: fullCode });
      Alert.alert(
        "Email Verified!",
        "Your email has been verified successfully. Welcome to DROPi!",
        [{ text: "Continue", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid or expired code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await apiCall("dropiAuth.resendVerificationCode", {});
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      // Start cooldown (60 seconds)
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer className="p-6" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-center items-center">
        {/* Icon */}
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
          <Text className="text-4xl">✉️</Text>
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Verify Your Email
        </Text>
        <Text className="text-base text-muted text-center mb-2">
          We sent a 6-digit code to
        </Text>
        <Text className="text-base font-semibold text-foreground text-center mb-8">
          {user?.email || "your email"}
        </Text>

        {/* Code Input */}
        <View className="flex-row gap-2 mb-8">
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              returnKeyType={index === 5 ? "done" : "next"}
              onSubmitEditing={index === 5 ? handleVerify : undefined}
              className="w-12 h-14 bg-surface border-2 border-border rounded-xl text-center text-xl font-bold text-foreground"
              style={{ fontSize: 22, textAlign: "center" }}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || code.join("").length !== 6}
          className={`w-full max-w-xs rounded-xl py-4 items-center mb-4 ${
            loading || code.join("").length !== 6 ? "bg-muted" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-background font-semibold text-base">Verify Email</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resending || cooldown > 0}
          className="py-3"
        >
          {resending ? (
            <ActivityIndicator size="small" color="#0a7ea4" />
          ) : cooldown > 0 ? (
            <Text className="text-muted text-sm">Resend code in {cooldown}s</Text>
          ) : (
            <Text className="text-primary text-sm font-medium">Didn&apos;t receive the code? Resend</Text>
          )}
        </TouchableOpacity>

        {/* Skip for now */}
        <TouchableOpacity onPress={handleSkip} className="mt-6 py-2">
          <Text className="text-muted text-sm">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
