import { useState, useCallback } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";

type AccountType = "customer" | "merchant" | "delivery_partner";
type MerchantSubType = "verified_business" | "community_seller" | "artisan";

const ACCOUNT_TYPES: { id: AccountType; label: string; description: string; icon: string }[] = [
  { id: "customer", label: "Customer", description: "Buy products and use non-commercial P2P", icon: "🛒" },
  { id: "merchant", label: "Merchant", description: "Sell products on marketplace", icon: "🏪" },
  { id: "delivery_partner", label: "Delivery Partner", description: "Deliver orders (verification required)", icon: "🚀" },
];

const MERCHANT_SUB_TYPES: { id: MerchantSubType; label: string; description: string }[] = [
  { id: "verified_business", label: "Registered Business", description: "Licensed company or store" },
  { id: "community_seller", label: "Community Seller", description: "Local community vendor" },
  { id: "artisan", label: "Artisan", description: "Handmade & custom products" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useDropiAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [zone, setZone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [merchantSubType, setMerchantSubType] = useState<MerchantSubType>("verified_business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !zone.trim()) {
      setError("Name, email, password and operating zone are required");
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

    let dropiRole = "customer";
    if (accountType === "merchant") dropiRole = "merchant";
    if (accountType === "delivery_partner") dropiRole = "delivery_partner";

    setLoading(true);
    setError("");
    const result = await register({
      email,
      password,
      name,
      dropiRole,
      channel: "C1",
      zone: zone.trim(),
      merchantSubType: accountType === "merchant" ? merchantSubType : undefined,
      isVerified: accountType !== "delivery_partner",
    });
    setLoading(false);

    if (result.success) {
      router.replace("/verify-email");
    } else {
      setError(result.error || "Registration failed");
    }
  }, [name, email, password, confirmPassword, zone, accountType, merchantSubType, register, router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 max-w-sm w-full self-center">
            <View className="mb-6 mt-4">
              <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginBottom: 16 }}>
                <Text className="text-primary text-base font-medium">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Create Account</Text>
              <Text className="text-sm text-muted mt-1">Join the DROPi logistics platform</Text>
            </View>

            {error ? (
              <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
                <Text className="text-error text-sm text-center">{error}</Text>
              </View>
            ) : null}

            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2">I want to...</Text>
              <View className="gap-2">
                {ACCOUNT_TYPES.map((type) => (
                  <TouchableOpacity key={type.id} onPress={() => { setAccountType(type.id); setError(""); }} activeOpacity={0.7}>
                    <View className="rounded-xl px-4 py-3 border flex-row items-center" style={{ borderColor: accountType === type.id ? "#0066FF" : "#E5E7EB", backgroundColor: accountType === type.id ? "#0066FF10" : "transparent" }}>
                      <Text style={{ fontSize: 20, marginRight: 12 }}>{type.icon}</Text>
                      <View className="flex-1">
                        <Text style={{ color: accountType === type.id ? "#0066FF" : "#11181C", fontWeight: "600", fontSize: 14 }}>{type.label}</Text>
                        <Text style={{ color: "#687076", fontSize: 12, marginTop: 2 }}>{type.description}</Text>
                      </View>
                      {accountType === type.id && <Text style={{ color: "#0066FF", fontSize: 18 }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {accountType === "merchant" && (
              <View className="mb-5">
                <Text className="text-sm font-medium text-foreground mb-2">Merchant Type</Text>
                <View className="gap-2">
                  {MERCHANT_SUB_TYPES.map((subType) => (
                    <TouchableOpacity key={subType.id} onPress={() => { setMerchantSubType(subType.id); setError(""); }} activeOpacity={0.7}>
                      <View className="rounded-lg px-3 py-2.5 border flex-row items-center" style={{ borderColor: merchantSubType === subType.id ? "#0066FF" : "#E5E7EB", backgroundColor: merchantSubType === subType.id ? "#0066FF10" : "transparent" }}>
                        <View className="flex-1">
                          <Text style={{ color: merchantSubType === subType.id ? "#0066FF" : "#11181C", fontWeight: "500", fontSize: 13 }}>{subType.label}</Text>
                          <Text style={{ color: "#687076", fontSize: 11, marginTop: 1 }}>{subType.description}</Text>
                        </View>
                        {merchantSubType === subType.id && <Text style={{ color: "#0066FF", fontSize: 16 }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {accountType === "customer" && (
              <View className="mb-4 bg-primary/10 border border-primary rounded-lg p-3">
                <Text className="text-primary text-xs font-medium">P2P is included as a non-commercial C1 customer capability. It is not a merchant/store type.</Text>
              </View>
            )}

            {accountType === "delivery_partner" && (
              <View className="mb-4 bg-warning/10 border border-warning rounded-lg p-3">
                <Text className="text-warning text-xs font-medium">Note: Delivery partners require verification before receiving missions. You will need to submit your credentials after registration.</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Full Name</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base" placeholder="Your full name" placeholderTextColor="#9BA1A6" value={name} onChangeText={(t) => { setName(t); setError(""); }} autoCapitalize="words" />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Email</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base" placeholder="your@email.com" placeholderTextColor="#9BA1A6" value={email} onChangeText={(t) => { setEmail(t); setError(""); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">C1 Operating Zone</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base" placeholder="Enter your actual service/market zone" placeholderTextColor="#9BA1A6" value={zone} onChangeText={(t) => { setZone(t); setError(""); }} autoCapitalize="words" />
              <Text className="text-muted text-xs mt-1">Marketplace and delivery availability are scoped to this zone. No default location is assumed.</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl">
                <TextInput className="flex-1 px-4 py-3.5 text-foreground text-base" placeholder="Min 8 chars, 1 uppercase, 1 number" placeholderTextColor="#9BA1A6" value={password} onChangeText={(t) => { setPassword(t); setError(""); }} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text className="text-muted text-sm">{showPassword ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-1.5">Confirm Password</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base" placeholder="Repeat password" placeholderTextColor="#9BA1A6" value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setError(""); }} secureTextEntry={!showPassword} />
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9}>
              <View className="bg-primary rounded-xl py-4 items-center" style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Create Account</Text>}
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-muted text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => safeGoBack(router)}>
                <Text className="text-primary text-sm font-medium">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
