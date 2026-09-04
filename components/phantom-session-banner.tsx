import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useDropiAuth } from "@/lib/auth-context";

export function PhantomSessionBanner() {
  const router = useRouter();
  const { user, isPhantom, exitPhantomSession } = useDropiAuth();
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState("");

  if (!isPhantom || !user) return null;

  const exit = async () => {
    if (exiting) return;
    setExiting(true);
    setError("");
    const result = await exitPhantomSession();
    setExiting(false);
    if (!result.success) {
      setError(result.error || "Unable to exit phantom mode");
      return;
    }
    router.replace("/(tabs)" as any);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 8,
        left: 10,
        right: 10,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: "#7F1D1D",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 12 }}>
              PHANTOM MODE · AUDITED
            </Text>
            <Text style={{ color: "#FECACA", fontSize: 11, marginTop: 2 }} numberOfLines={1}>
              Acting as {user.name} · {user.dropiRole}/{user.channel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={exit}
            disabled={exiting}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              minWidth: 78,
              alignItems: "center",
              opacity: exiting ? 0.7 : 1,
            }}
          >
            {exiting ? (
              <ActivityIndicator size="small" color="#7F1D1D" />
            ) : (
              <Text style={{ color: "#7F1D1D", fontWeight: "800", fontSize: 11 }}>EXIT</Text>
            )}
          </TouchableOpacity>
        </View>
        {error ? <Text style={{ color: "#FEE2E2", fontSize: 10, marginTop: 6 }}>{error}</Text> : null}
      </View>
    </View>
  );
}
