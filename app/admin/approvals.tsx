import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useDropiAuth } from "@/lib/auth-context";
import { resolveDropiMediaUrl } from "@/lib/media-url";
import { safeGoBack } from "@/lib/safe-back";

const TOKEN_KEY = "@dropi_token";

type Tab = "verifications" | "roles";
type EvidenceLabel = "front" | "back" | "page" | "evidence";

type EvidenceAttachment = {
  id: number | null;
  label: EvidenceLabel;
  ordinal: number;
  mediaUid: string;
  fileName: string;
  contentType: string;
  byteLength: number;
  sha256: string;
  dataBase64: string;
};

type VerificationEvidenceBundle = {
  storage: "dropi";
  evidenceModel: "multi_attachment" | "legacy_single_url";
  documentType: string;
  status: string;
  attachmentCount: number;
  attachments: EvidenceAttachment[];
};

interface VerificationItem {
  verification: {
    id: number;
    userId: number;
    documentType: string;
    licenseNumber: string | null;
    vehicleType: string | null;
    status: string;
    expiryDate: string | null;
    notes: string | null;
    createdAt: string;
  };
  userName: string | null;
  userEmail: string | null;
}

interface RoleApplicationItem {
  application: {
    id: number;
    userId: number;
    requestedRole: string;
    requestedChannel: string;
    motivation: string | null;
    qualifications: string | null;
    status: string;
    createdAt: string;
  };
  userName: string | null;
  userEmail: string | null;
  currentRole: string | null;
  currentChannel: string | null;
}

async function apiCall(path: string, input: any, method: "POST" | "GET" = "POST") {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (method === "GET") {
    const queryUrl = input
      ? `${url}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
      : url;
    const response = await fetch(queryUrl, { headers, credentials: "include" });
    const data = await response.json();
    if (data.error) throw new Error(data.error?.json?.message || data.error?.message || "API error");
    return data.result?.data?.json ?? data.result?.data;
  }

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

function formatDocType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEvidenceLabel(label: EvidenceLabel) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function AdminApprovalsScreen() {
  const router = useRouter();
  useDropiAuth();

  const [activeTab, setActiveTab] = useState<Tab>("verifications");
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [roleApps, setRoleApps] = useState<RoleApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [evidenceBundle, setEvidenceBundle] = useState<VerificationEvidenceBundle | null>(null);
  const [selectedImage, setSelectedImage] = useState<EvidenceAttachment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectId, setShowRejectId] = useState<number | null>(null);

  const loadVerifications = useCallback(async () => {
    try {
      const data = await apiCall("verification.listPending", { status: "pending" }, "GET");
      setVerifications(data || []);
    } catch (err: any) {
      console.error("Failed to load verifications:", err);
    }
  }, []);

  const loadRoleApplications = useCallback(async () => {
    try {
      const data = await apiCall("roleApplications.listAll", { status: "pending" }, "GET");
      setRoleApps(data || []);
    } catch (err: any) {
      console.error("Failed to load role applications:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadVerifications(), loadRoleApplications()]);
    setLoading(false);
  }, [loadRoleApplications, loadVerifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerificationDecision = async (verificationId: number, decision: "approved" | "rejected") => {
    if (decision === "rejected" && !rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a rejection reason");
      return;
    }

    setProcessing(verificationId);
    try {
      await apiCall("verification.review", {
        verificationId,
        decision,
        rejectionReason: decision === "rejected" ? rejectionReason.trim() : undefined,
      });
      setShowRejectId(null);
      setRejectionReason("");
      setEvidenceBundle(null);
      await loadVerifications();
      Alert.alert("Done", `Verification ${decision}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to process");
    } finally {
      setProcessing(null);
    }
  };

  const openPdfPreview = async (data: EvidenceAttachment) => {
    try {
      const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "verification.pdf";
      if (Platform.OS === "web") {
        const binary = globalThis.atob(data.dataBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: data.contentType }));
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
      }

      const FS = require("expo-file-system/legacy");
      const fileUri = `${FS.cacheDirectory}${safeName}`;
      await FS.writeAsStringAsync(fileUri, data.dataBase64, { encoding: FS.EncodingType.Base64 });
      const openUri = Platform.OS === "android" && FS.getContentUriAsync
        ? await FS.getContentUriAsync(fileUri)
        : fileUri;
      await Linking.openURL(openUri);
    } catch (err: any) {
      Alert.alert("Preview unavailable", err.message || "The PDF was verified but could not be opened by this device.");
    }
  };

  const handlePreviewVerification = async (verificationId: number) => {
    setPreviewLoadingId(verificationId);
    try {
      const data = await apiCall("verificationMedia.getByVerificationId", { verificationId }, "GET");
      if (data?.storage === "legacy") {
        const legacyUrl = resolveDropiMediaUrl(data.legacyUrl);
        if (legacyUrl && /^(https?:\/\/|\/)/i.test(data.legacyUrl)) {
          try {
            await Linking.openURL(legacyUrl);
          } catch {
            Alert.alert("Legacy evidence unavailable", data.message || "This historical file requires re-upload.");
          }
        } else {
          Alert.alert("Legacy evidence", data.message || "This historical file requires re-upload.");
        }
        return;
      }
      if (data?.storage !== "dropi" || !Array.isArray(data.attachments) || data.attachments.length === 0) {
        throw new Error("Verification evidence response contains no attachments");
      }
      setEvidenceBundle(data as VerificationEvidenceBundle);
    } catch (err: any) {
      Alert.alert("Evidence unavailable", err.message || "Could not load verification evidence");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleRoleDecision = async (applicationId: number, decision: "approved" | "rejected") => {
    if (decision === "rejected" && !rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a rejection reason");
      return;
    }

    setProcessing(applicationId);
    try {
      await apiCall("roleApplications.review", {
        applicationId,
        decision,
        rejectionReason: decision === "rejected" ? rejectionReason.trim() : undefined,
      });
      setShowRejectId(null);
      setRejectionReason("");
      await loadRoleApplications();
      Alert.alert("Done", `Application ${decision}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to process");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted mt-4">Loading pending approvals...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ padding: 8, marginRight: 12 }}>
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Approval Panel</Text>
        </View>

        <View className="flex-row bg-surface rounded-xl p-1 mb-6 border border-border">
          <TouchableOpacity
            onPress={() => setActiveTab("verifications")}
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "verifications" ? "bg-primary" : ""}`}
          >
            <Text className={`font-semibold ${activeTab === "verifications" ? "text-background" : "text-muted"}`}>
              Verifications ({verifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("roles")}
            className={`flex-1 py-3 rounded-lg items-center ${activeTab === "roles" ? "bg-primary" : ""}`}
          >
            <Text className={`font-semibold ${activeTab === "roles" ? "text-background" : "text-muted"}`}>
              Role Applications ({roleApps.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "verifications" ? (
          verifications.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 items-center border border-border">
              <Text className="text-muted text-center">No pending verifications</Text>
            </View>
          ) : (
            verifications.map((item) => (
              <View key={item.verification.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-start justify-between gap-3 mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-foreground">{item.userName || "Unknown"}</Text>
                    <Text className="text-xs text-muted">{item.userEmail}</Text>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-xs font-semibold">Pending review</Text>
                  </View>
                </View>

                <View className="bg-background rounded-lg p-3 mb-3">
                  <Text className="text-sm text-foreground font-medium">{formatDocType(item.verification.documentType)}</Text>
                  {item.verification.licenseNumber ? (
                    <Text className="text-sm text-muted mt-1">Number: {item.verification.licenseNumber}</Text>
                  ) : null}
                  {item.verification.vehicleType ? (
                    <Text className="text-sm text-muted mt-1">Vehicle: {formatDocType(item.verification.vehicleType)}</Text>
                  ) : null}
                  {item.verification.expiryDate ? (
                    <Text className="text-sm text-muted mt-1">Expiry: {new Date(item.verification.expiryDate).toLocaleDateString()}</Text>
                  ) : null}
                  {item.verification.notes ? (
                    <Text className="text-sm text-muted mt-1">Notes: {item.verification.notes}</Text>
                  ) : null}
                  <Text className="text-xs text-muted mt-2">Submitted: {new Date(item.verification.createdAt).toLocaleDateString()}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handlePreviewVerification(item.verification.id)}
                  disabled={previewLoadingId === item.verification.id}
                  className="bg-primary/10 border border-primary/30 rounded-lg py-3 items-center mb-3"
                >
                  {previewLoadingId === item.verification.id ? (
                    <ActivityIndicator size="small" color="#0a7ea4" />
                  ) : (
                    <Text className="text-primary font-semibold">Review All Private Evidence</Text>
                  )}
                </TouchableOpacity>

                {showRejectId === item.verification.id ? (
                  <View className="mb-3">
                    <TextInput
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      placeholder="Reason for rejection..."
                      multiline
                      className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#687076"
                      style={{ minHeight: 60, textAlignVertical: "top" }}
                    />
                  </View>
                ) : null}

                <View className="flex-row gap-3">
                  {showRejectId === item.verification.id ? (
                    <>
                      <TouchableOpacity
                        onPress={() => { setShowRejectId(null); setRejectionReason(""); }}
                        className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
                      >
                        <Text className="text-foreground font-medium">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleVerificationDecision(item.verification.id, "rejected")}
                        disabled={processing === item.verification.id}
                        className="flex-1 bg-error rounded-lg py-3 items-center"
                      >
                        {processing === item.verification.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text className="text-background font-semibold">Confirm Reject</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => setShowRejectId(item.verification.id)}
                        className="flex-1 bg-background border border-error rounded-lg py-3 items-center"
                      >
                        <Text className="text-error font-medium">Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleVerificationDecision(item.verification.id, "approved")}
                        disabled={processing === item.verification.id}
                        className="flex-1 bg-success rounded-lg py-3 items-center"
                      >
                        {processing === item.verification.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text className="text-background font-semibold">Approve</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )
        ) : roleApps.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center border border-border">
            <Text className="text-muted text-center">No pending role applications</Text>
          </View>
        ) : (
          roleApps.map((item) => {
            const rejectKey = item.application.id + 10000;
            return (
              <View key={item.application.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="font-bold text-foreground">{item.userName || "Unknown"}</Text>
                    <Text className="text-xs text-muted">{item.userEmail}</Text>
                  </View>
                  <View className="bg-amber-100 px-3 py-1 rounded-full">
                    <Text className="text-amber-700 text-xs font-semibold">Pending</Text>
                  </View>
                </View>

                <View className="bg-background rounded-lg p-3 mb-3">
                  <Text className="text-xs text-muted">
                    Current: {formatDocType(item.currentRole || "none")} ({item.currentChannel || "none"})
                  </Text>
                  <Text className="text-sm font-bold text-primary mt-2">
                    Requesting: {formatDocType(item.application.requestedRole)} · {item.application.requestedChannel}
                  </Text>
                  {item.application.motivation ? (
                    <Text className="text-sm text-muted mt-2">Motivation: {item.application.motivation}</Text>
                  ) : null}
                  {item.application.qualifications ? (
                    <Text className="text-sm text-muted mt-2">Qualifications: {item.application.qualifications}</Text>
                  ) : null}
                  <Text className="text-xs text-muted mt-2">Applied: {new Date(item.application.createdAt).toLocaleDateString()}</Text>
                </View>

                {showRejectId === rejectKey ? (
                  <View className="mb-3">
                    <TextInput
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      placeholder="Reason for rejection..."
                      multiline
                      className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#687076"
                      style={{ minHeight: 60, textAlignVertical: "top" }}
                    />
                  </View>
                ) : null}

                <View className="flex-row gap-3">
                  {showRejectId === rejectKey ? (
                    <>
                      <TouchableOpacity
                        onPress={() => { setShowRejectId(null); setRejectionReason(""); }}
                        className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
                      >
                        <Text className="text-foreground font-medium">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRoleDecision(item.application.id, "rejected")}
                        disabled={processing === item.application.id}
                        className="flex-1 bg-error rounded-lg py-3 items-center"
                      >
                        {processing === item.application.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text className="text-background font-semibold">Confirm Reject</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => setShowRejectId(rejectKey)}
                        className="flex-1 bg-background border border-error rounded-lg py-3 items-center"
                      >
                        <Text className="text-error font-medium">Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRoleDecision(item.application.id, "approved")}
                        disabled={processing === item.application.id}
                        className="flex-1 bg-success rounded-lg py-3 items-center"
                      >
                        {processing === item.application.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text className="text-background font-semibold">Approve</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={Boolean(evidenceBundle)}
        transparent
        animationType="fade"
        onRequestClose={() => setEvidenceBundle(null)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-4 w-full" style={{ maxWidth: 680, maxHeight: "92%" }}>
            <Text className="text-lg font-bold text-foreground">Private Verification Evidence</Text>
            <Text className="text-xs text-muted mt-1 mb-3">
              {evidenceBundle?.attachmentCount || 0} attachment{evidenceBundle?.attachmentCount === 1 ? "" : "s"} · every file passed owner binding, metadata, byte-length and SHA-256 integrity checks.
            </Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              {evidenceBundle?.attachments.map((attachment, index) => (
                <View key={`${attachment.mediaUid}-${attachment.ordinal}`} className="border border-border rounded-xl p-3 mb-3 bg-surface">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {index + 1}. {formatEvidenceLabel(attachment.label)} · {attachment.fileName}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {attachment.contentType} · {Math.ceil(attachment.byteLength / 1024)} KB
                      </Text>
                      <Text className="text-[10px] text-muted mt-1" numberOfLines={1}>
                        SHA-256 {attachment.sha256}
                      </Text>
                    </View>
                    <Text className="text-xs text-green-600 font-semibold">✓ Integrity verified</Text>
                  </View>

                  {attachment.contentType.startsWith("image/") ? (
                    <TouchableOpacity onPress={() => setSelectedImage(attachment)} className="mt-3">
                      <Image
                        source={{ uri: `data:${attachment.contentType};base64,${attachment.dataBase64}` }}
                        resizeMode="contain"
                        style={{ width: "100%", height: 180, backgroundColor: "#111" }}
                      />
                      <Text className="text-primary text-xs font-semibold text-center mt-2">Open image</Text>
                    </TouchableOpacity>
                  ) : attachment.contentType === "application/pdf" ? (
                    <TouchableOpacity onPress={() => openPdfPreview(attachment)} className="border border-primary rounded-lg py-3 items-center mt-3">
                      <Text className="text-primary font-semibold">Open PDF in device viewer</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setEvidenceBundle(null)} className="bg-primary rounded-xl py-3 items-center mt-2">
              <Text className="text-background font-semibold">Close Evidence File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center p-4">
          <View className="w-full" style={{ maxWidth: 760 }}>
            <Text className="text-white text-center font-semibold mb-3">
              {selectedImage ? `${formatEvidenceLabel(selectedImage.label)} · ${selectedImage.fileName}` : "Evidence image"}
            </Text>
            {selectedImage ? (
              <Image
                source={{ uri: `data:${selectedImage.contentType};base64,${selectedImage.dataBase64}` }}
                resizeMode="contain"
                style={{ width: "100%", height: 560 }}
              />
            ) : null}
            <TouchableOpacity onPress={() => setSelectedImage(null)} className="bg-primary rounded-xl py-3 items-center mt-4">
              <Text className="text-background font-semibold">Close Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
