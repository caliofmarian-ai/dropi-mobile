/**
 * Admin FCM Configuration Screen
 * Allows admin to upload/paste Firebase Service Account JSON
 * for enabling push notifications on DROPi's own server.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function FCMConfigScreen() {
  const colors = useColors();
  const [jsonInput, setJsonInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testPushResult, setTestPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentConfig, setCurrentConfig] = useState<{
    configured: boolean;
    projectId?: string;
    clientEmail?: string;
    lastUpdated?: string;
  } | null>(null);

  // Fetch current FCM config status
  const { data: configStatus, refetch } = trpc.notifications.getFcmStatus.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (configStatus) {
      setCurrentConfig(configStatus);
    }
  }, [configStatus]);

  const testPushMutation = trpc.notifications.sendTestPush.useMutation({
    onSuccess: (result) => {
      setTestPushResult(result);
    },
    onError: (err: any) => {
      setTestPushResult({ success: false, message: err.message || "Eroare la trimitere" });
    },
    onSettled: () => setTestingPush(false),
  });

  const handleTestPush = useCallback(() => {
    setTestingPush(true);
    setTestPushResult(null);
    testPushMutation.mutate();
  }, [testPushMutation]);

  const saveMutation = trpc.notifications.saveFcmConfig.useMutation({
    onSuccess: () => {
      Alert.alert("Succes", "Configurația FCM a fost salvată. Push notifications sunt acum active.");
      setJsonInput("");
      refetch();
    },
    onError: (err: any) => {
      Alert.alert("Eroare", err.message || "Nu s-a putut salva configurația FCM.");
    },
    onSettled: () => setSaving(false),
  });

  const handleSave = () => {
    if (!jsonInput.trim()) {
      Alert.alert("Eroare", "Lipește conținutul fișierului Service Account JSON.");
      return;
    }

    // Validate JSON structure
    try {
      const parsed = JSON.parse(jsonInput.trim());
      if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
        Alert.alert(
          "Format Invalid",
          "JSON-ul trebuie să conțină: project_id, private_key, client_email. Descarcă Service Account JSON din Firebase Console."
        );
        return;
      }
    } catch (e) {
      Alert.alert("JSON Invalid", "Conținutul nu este un JSON valid. Verifică și încearcă din nou.");
      return;
    }

    Alert.alert(
      "Confirmare",
      "Salvezi configurația FCM? Push notifications vor fi activate pentru toți utilizatorii DROPi.",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Salvează",
          onPress: () => {
            setSaving(true);
            saveMutation.mutate({ serviceAccountJson: jsonInput.trim() });
          },
        },
      ]
    );
  };

  const handleRemove = () => {
    Alert.alert(
      "Șterge Configurația FCM",
      "Push notifications vor fi dezactivate. Ești sigur?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: () => {
            setSaving(true);
            saveMutation.mutate({ serviceAccountJson: "" });
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-foreground mb-2">
          Configurare FCM
        </Text>
        <Text className="text-sm text-muted mb-6">
          Firebase Cloud Messaging — notificări push independente pe serverul DROPi.
        </Text>

        {/* Current Status */}
        <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Status Actual
          </Text>
          {currentConfig?.configured ? (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-success" />
                <Text className="text-sm text-foreground">FCM Activ</Text>
              </View>
              <Text className="text-xs text-muted">
                Project: {currentConfig.projectId}
              </Text>
              <Text className="text-xs text-muted">
                Service Account: {currentConfig.clientEmail}
              </Text>
              {currentConfig.lastUpdated && (
                <Text className="text-xs text-muted">
                  Ultima actualizare: {currentConfig.lastUpdated}
                </Text>
              )}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={handleTestPush}
                  disabled={testingPush}
                  style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 8 }}
                >
                  {testingPush ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                      Trimite Test Push
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRemove}
                  style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.error, borderRadius: 8 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                    Șterge Configurația
                  </Text>
                </TouchableOpacity>
              </View>
              {testPushResult && (
                <Text style={{ marginTop: 8, fontSize: 12, color: testPushResult.success ? colors.success : colors.error }}>
                  {testPushResult.message}
                </Text>
              )}
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-warning" />
              <Text className="text-sm text-muted">FCM Neconfigurat — push notifications inactive</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Cum obții Service Account JSON:
          </Text>
          <Text className="text-xs text-muted leading-5">
            1. Accesează Firebase Console → Project Settings{"\n"}
            2. Tab "Service accounts" → "Generate new private key"{"\n"}
            3. Descarcă fișierul JSON{"\n"}
            4. Lipește conținutul complet mai jos{"\n"}
            {"\n"}
            ⚠️ Nu partaja acest fișier. Conține cheia privată a serverului.
          </Text>
        </View>

        {/* JSON Input */}
        <Text className="text-sm font-semibold text-foreground mb-2">
          Service Account JSON:
        </Text>
        <TextInput
          value={jsonInput}
          onChangeText={setJsonInput}
          placeholder={'{\n  "type": "service_account",\n  "project_id": "dropi-...",\n  ....\n}'}
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={12}
          textAlignVertical="top"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            fontSize: 11,
            fontFamily: "monospace",
            color: colors.foreground,
            minHeight: 200,
            marginBottom: 16,
          }}
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !jsonInput.trim()}
          style={{
            backgroundColor: saving || !jsonInput.trim() ? colors.muted : colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Salvează Configurația FCM
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
