import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/constants/oauth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeGoBack } from "@/lib/safe-back";
import {
  deriveVerificationLifecycle,
  latestVerificationByDocumentType,
  type VerificationLifecycleState,
} from "@/shared/verification-lifecycle";

const TOKEN_KEY = "@dropi_token";
const MAX_EVIDENCE_ATTACHMENTS = 5;

type EvidenceLabel = "front" | "back" | "page" | "evidence";
type VerificationStatus = "pending" | "approved" | "rejected";

const DOCUMENT_TYPES = [
  { value: "driving_license", label: "Driving License" },
  { value: "drone_license", label: "Drone Pilot License" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "background_check", label: "Background Check" },
  { value: "other", label: "Other Document" },
] as const;

const VEHICLE_TYPES = [
  { value: "drone", label: "Drone" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "ebike", label: "E-Bike" },
  { value: "motorcycle", label: "Motorcycle" },
] as const;

const EVIDENCE_LABELS: Array<{ value: EvidenceLabel; label: string }> = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "page", label: "Page" },
  { value: "evidence", label: "Evidence" },
];

interface Verification {
  id: number;
  documentType: string;
  licenseNumber: string | null;
  vehicleType: string | null;
  status: VerificationStatus;
  expiryDate: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  attachmentCount?: number;
  evidenceModel?: "multi_attachment" | "legacy_single_url";
}

interface StatusSummary {
  isVerified: boolean;
  hasPending: boolean;
  totalSubmitted: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface SelectedEvidence {
  localId: string;
  uri: string;
  name: string;
  type: string;
  label: EvidenceLabel;
  uploaded?: {
    mediaUid: string;
    url: string;
  };
}

async function apiCall(path: string, input: any, method: "POST" | "GET" = "POST") {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (method === "GET") {
    const queryUrl = `${url}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
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

function defaultEvidenceLabel(index: number, contentType: string): EvidenceLabel {
  if (contentType === "application/pdf") return "evidence";
  if (index === 0) return "front";
  if (index === 1) return "back";
  return "page";
}

function lifecycleColor(state: VerificationLifecycleState): string {
  switch (state) {
    case "approved": return "#16A34A";
    case "expiring": return "#EA580C";
    case "pending": return "#2563EB";
    case "rejected":
    case "expired": return "#DC2626";
    case "not_submitted": return "#6B7280";
  }
}

function formatDocType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatExpiry(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export default function VerifyDocumentsScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [status, setStatus] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [documentType, setDocumentType] = useState<string>("driving_license");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<SelectedEvidence[]>([]);
  const [uploadingLocalId, setUploadingLocalId] = useState<string | null>(null);

  const latestByType = useMemo(
    () => latestVerificationByDocumentType(verifications),
    [verifications],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [verifs, statusData] = await Promise.all([
        apiCall("verification.myVerifications", undefined, "GET"),
        apiCall("verification.myStatus", undefined, "GET"),
      ]);
      setVerifications(verifs || []);
      setStatus(statusData || null);
    } catch (err: any) {
      console.error("Failed to load verifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const appendEvidence = useCallback((incoming: Array<Omit<SelectedEvidence, "localId" | "label">>) => {
    setSelectedEvidence((current) => {
      const remaining = MAX_EVIDENCE_ATTACHMENTS - current.length;
      if (remaining <= 0) {
        Alert.alert("Attachment limit", `You can attach up to ${MAX_EVIDENCE_ATTACHMENTS} files to one verification.`);
        return current;
      }
      const accepted = incoming.slice(0, remaining).map((item, index) => ({
        ...item,
        localId: `${Date.now()}_${current.length}_${index}_${Math.random().toString(36).slice(2)}`,
        label: defaultEvidenceLabel(current.length + index, item.type),
      }));
      if (incoming.length > remaining) {
        Alert.alert("Attachment limit", `Only the first ${remaining} selected file${remaining === 1 ? "" : "s"} were added.`);
      }
      return [...current, ...accepted];
    });
  }, []);

  const handlePickImages = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "image/jpeg,image/png,image/webp";
      input.onchange = (event: any) => {
        const files = Array.from(event.target?.files || []) as File[];
        appendEvidence(files.map((file) => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: file.type || "image/jpeg",
        })));
      };
      input.click();
      return;
    }

    try {
      const ImagePicker = require("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload documents.");
        return;
      }
      const remaining = Math.max(1, MAX_EVIDENCE_ATTACHMENTS - selectedEvidence.length);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
      if (!result.canceled && result.assets?.length) {
        appendEvidence(result.assets.map((asset: any) => ({
          uri: asset.uri,
          name: asset.fileName || `document_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        })));
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to pick images: " + (err.message || "Unknown error"));
    }
  };

  const handlePickPdf = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "application/pdf";
      input.onchange = (event: any) => {
        const files = Array.from(event.target?.files || []) as File[];
        appendEvidence(files.map((file) => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          type: "application/pdf",
        })));
      };
      input.click();
      return;
    }

    try {
      // expo-file-system is already part of the SDK/native build used by DROPi.
      // Its system file picker lets Android choose PDF evidence without adding a
      // new native module that would invalidate the current OTA runtime.
      const FileSystem = require("expo-file-system");
      const picked = await FileSystem.File.pickFileAsync(undefined, "application/pdf");
      const files = Array.isArray(picked) ? picked : [picked];
      appendEvidence(files.filter(Boolean).map((file: any) => ({
        uri: file.uri,
        name: file.name || `document_${Date.now()}.pdf`,
        type: file.type || "application/pdf",
      })));
    } catch (err: any) {
      const message = err?.message || "Unknown error";
      if (!/cancel/i.test(message)) Alert.alert("PDF Picker Error", message);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Camera capture is only available on mobile devices.");
      return;
    }
    if (selectedEvidence.length >= MAX_EVIDENCE_ATTACHMENTS) {
      Alert.alert("Attachment limit", `You can attach up to ${MAX_EVIDENCE_ATTACHMENTS} files.`);
      return;
    }

    try {
      const ImagePicker = require("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access to photograph documents.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: false });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        appendEvidence([{
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        }]);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to take photo: " + (err.message || "Unknown error"));
    }
  };

  const readBase64 = async (file: SelectedEvidence): Promise<string> => {
    if (Platform.OS === "web") {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    const FS = require("expo-file-system/legacy");
    return FS.readAsStringAsync(file.uri, { encoding: FS.EncodingType.Base64 });
  };

  const uploadOneEvidence = async (file: SelectedEvidence) => {
    if (file.uploaded) return file.uploaded;
    setUploadingLocalId(file.localId);
    const base64 = await readBase64(file);
    const result = await apiCall("verification.uploadDocument", {
      fileName: file.name,
      fileBase64: base64,
      contentType: file.type,
    });
    const uploaded = { mediaUid: result.mediaUid || result.key, url: result.url };
    setSelectedEvidence((current) => current.map((item) =>
      item.localId === file.localId ? { ...item, uploaded } : item,
    ));
    return uploaded;
  };

  const resetForm = () => {
    setLicenseNumber("");
    setVehicleType("");
    setExpiryDate("");
    setNotes("");
    setSelectedEvidence([]);
    setUploadingLocalId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert("Required", "License / document number is required.");
      return;
    }
    if (selectedEvidence.length === 0) {
      Alert.alert("Evidence required", "Attach at least one image or PDF before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const evidence: Array<{ mediaUid: string; label: EvidenceLabel }> = [];
      for (const file of selectedEvidence) {
        const uploaded = await uploadOneEvidence(file);
        evidence.push({ mediaUid: uploaded.mediaUid, label: file.label });
      }

      const input: any = {
        documentType,
        licenseNumber: licenseNumber.trim(),
        evidence,
      };
      if (vehicleType) input.vehicleType = vehicleType;
      if (expiryDate) input.expiryDate = expiryDate;
      if (notes.trim()) input.notes = notes.trim();

      await apiCall("verification.submit", input);
      resetForm();
      await loadData();
      Alert.alert("Submitted", "All evidence files were submitted together for admin review.");
    } catch (err: any) {
      Alert.alert("Submission Error", err.message || "Failed to submit verification");
    } finally {
      setUploadingLocalId(null);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted mt-4">Loading verification status...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ padding: 8, marginRight: 12 }}>
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Document Verification</Text>
        </View>

        <View className={`rounded-xl p-4 mb-5 border ${status?.isVerified ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <View className="flex-row items-start">
            <Text className="text-2xl mr-3">{status?.isVerified ? "✓" : "!"}</Text>
            <View className="flex-1">
              <Text className={`font-bold text-base ${status?.isVerified ? "text-green-800" : "text-amber-800"}`}>
                {status?.isVerified ? "Operationally Verified — Ready for Missions" : "Operational Verification Required"}
              </Text>
              <Text className={`text-sm mt-1 leading-5 ${status?.isVerified ? "text-green-700" : "text-amber-700"}`}>
                {status?.isVerified
                  ? "An approved, unexpired driving or drone license is on record."
                  : "Mission access requires an approved, unexpired driving or drone license. Insurance, registration, background checks and other approved documents do not unlock missions by themselves."}
              </Text>
            </View>
          </View>
        </View>

        {status && status.totalSubmitted > 0 && (
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-surface rounded-lg p-3 items-center border border-border">
              <Text className="text-2xl font-bold text-foreground">{status.approved}</Text>
              <Text className="text-xs text-muted">Approved records</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 items-center border border-border">
              <Text className="text-2xl font-bold text-foreground">{status.pending}</Text>
              <Text className="text-xs text-muted">Pending</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 items-center border border-border">
              <Text className="text-2xl font-bold text-foreground">{status.rejected}</Text>
              <Text className="text-xs text-muted">Rejected</Text>
            </View>
          </View>
        )}

        <View className="bg-surface border border-border rounded-xl p-4 mb-5">
          <Text className="text-sm font-semibold text-foreground mb-3">Document status</Text>
          <View className="flex-row flex-wrap gap-2">
            {DOCUMENT_TYPES.map((dt) => {
              const record = latestByType.get(dt.value);
              const lifecycle = deriveVerificationLifecycle(record);
              const color = lifecycleColor(lifecycle.state);
              const expiry = formatExpiry(lifecycle.expiryDate);
              return (
                <View
                  key={`status-${dt.value}`}
                  style={{
                    width: "48%",
                    borderWidth: 1,
                    borderColor: color,
                    backgroundColor: color + "10",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{dt.label}</Text>
                  <Text style={{ color, fontSize: 11, marginTop: 3 }}>{lifecycle.label}</Text>
                  {expiry ? <Text className="text-xs text-muted mt-1">Expiry: {expiry}</Text> : null}
                </View>
              );
            })}
          </View>
          <Text className="text-xs text-muted mt-3">
            Expiring = approved evidence within 30 days of expiry. Status text is authoritative; color is supplemental.
          </Text>
        </View>

        {!showForm && (
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-primary rounded-xl p-4 mb-6 items-center">
            <Text className="text-background font-semibold text-base">+ Submit New Document</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Submit Document</Text>

            <Text className="text-sm font-medium text-foreground mb-2">Document Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {DOCUMENT_TYPES.map((dt) => {
                const lifecycle = deriveVerificationLifecycle(latestByType.get(dt.value));
                const stateColor = lifecycleColor(lifecycle.state);
                const selected = documentType === dt.value;
                return (
                  <TouchableOpacity
                    key={dt.value}
                    onPress={() => setDocumentType(dt.value)}
                    style={{
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#0066FF" : stateColor,
                      backgroundColor: selected ? "#0066FF10" : stateColor + "08",
                      borderRadius: 9,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: selected ? "#0066FF" : stateColor, fontSize: 13, fontWeight: "600" }}>{dt.label}</Text>
                    <Text style={{ color: stateColor, fontSize: 10, marginTop: 2 }}>{lifecycle.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm font-medium text-foreground mb-2">License / Document Number *</Text>
            <TextInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Enter document number"
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
            />

            <Text className="text-sm font-medium text-foreground mb-2">Vehicle Type (optional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {VEHICLE_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt.value}
                  onPress={() => setVehicleType(vehicleType === vt.value ? "" : vt.value)}
                  className={`px-3 py-2 rounded-lg border ${vehicleType === vt.value ? "bg-primary border-primary" : "bg-background border-border"}`}
                >
                  <Text className={`text-sm ${vehicleType === vt.value ? "text-background font-semibold" : "text-foreground"}`}>{vt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-foreground mb-2">Expiry Date (optional, YYYY-MM-DD)</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2027-12-31"
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
            />

            <Text className="text-sm font-medium text-foreground mb-1">Private Evidence *</Text>
            <Text className="text-xs text-muted mb-3">
              Attach 1–5 files. Use Front + Back for cards/licences, add extra pages as needed, or choose a PDF from Android Files.
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              <TouchableOpacity onPress={handlePickImages} className="bg-background border border-border rounded-lg px-3 py-3">
                <Text className="text-foreground text-sm">🖼️ Add Images</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTakePhoto} className="bg-background border border-border rounded-lg px-3 py-3">
                <Text className="text-foreground text-sm">📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePickPdf} className="bg-background border border-border rounded-lg px-3 py-3">
                <Text className="text-foreground text-sm">📄 Add PDF</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-muted mb-3">{selectedEvidence.length}/{MAX_EVIDENCE_ATTACHMENTS} attachments</Text>

            {selectedEvidence.map((file, index) => (
              <View key={file.localId} className="border border-border rounded-xl overflow-hidden mb-3 bg-background">
                {file.type.startsWith("image/") ? (
                  <Image source={{ uri: file.uri }} style={{ width: "100%", height: 150 }} resizeMode="contain" />
                ) : (
                  <View className="items-center justify-center py-6 bg-surface">
                    <Text style={{ fontSize: 36 }}>📄</Text>
                    <Text className="text-sm font-semibold text-foreground mt-2">PDF document</Text>
                  </View>
                )}
                <View className="p-3">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-xs text-foreground flex-1" numberOfLines={1}>{index + 1}. {file.name}</Text>
                    {uploadingLocalId === file.localId ? <ActivityIndicator size="small" color="#0a7ea4" /> : null}
                    {file.uploaded ? <Text className="text-xs text-green-600 font-semibold">✓ Stored</Text> : null}
                  </View>
                  <View className="flex-row flex-wrap gap-1.5 mt-3">
                    {EVIDENCE_LABELS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setSelectedEvidence((current) => current.map((item) =>
                          item.localId === file.localId ? { ...item, label: option.value } : item,
                        ))}
                        style={{
                          borderWidth: 1,
                          borderColor: file.label === option.value ? "#0066FF" : "#D1D5DB",
                          backgroundColor: file.label === option.value ? "#0066FF12" : "transparent",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                        }}
                      >
                        <Text style={{ color: file.label === option.value ? "#0066FF" : "#6B7280", fontSize: 11 }}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    className="mt-3 self-end"
                    disabled={Boolean(file.uploaded) || submitting}
                    onPress={() => setSelectedEvidence((current) => current.filter((item) => item.localId !== file.localId))}
                  >
                    <Text className={`text-xs font-semibold ${file.uploaded ? "text-muted" : "text-error"}`}>
                      {file.uploaded ? "Stored for this submission" : "Remove"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text className="text-sm font-medium text-foreground mb-2">Additional Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
              style={{ textAlignVertical: "top", minHeight: 80 }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={resetForm} disabled={submitting} className="flex-1 bg-background border border-border rounded-lg py-3 items-center">
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !licenseNumber.trim() || selectedEvidence.length === 0}
                className={`flex-1 rounded-lg py-3 items-center ${submitting || !licenseNumber.trim() || selectedEvidence.length === 0 ? "bg-muted" : "bg-primary"}`}
              >
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-background font-semibold">Submit All</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text className="text-lg font-bold text-foreground mb-3">Submitted Documents</Text>
        {verifications.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center border border-border">
            <Text className="text-muted text-center">No documents submitted yet.</Text>
          </View>
        ) : (
          verifications.map((verification) => {
            const lifecycle = deriveVerificationLifecycle(verification);
            const color = lifecycleColor(lifecycle.state);
            const expiry = formatExpiry(lifecycle.expiryDate);
            return (
              <View key={verification.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-start justify-between gap-3 mb-2">
                  <Text className="font-semibold text-foreground flex-1">{formatDocType(verification.documentType)}</Text>
                  <View style={{ backgroundColor: color + "15", borderColor: color, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{lifecycle.label}</Text>
                  </View>
                </View>
                {verification.licenseNumber ? <Text className="text-sm text-muted mb-1">Number: {verification.licenseNumber}</Text> : null}
                {verification.vehicleType ? <Text className="text-sm text-muted mb-1">Vehicle: {formatDocType(verification.vehicleType)}</Text> : null}
                {expiry ? <Text className="text-sm text-muted mb-1">Expiry: {expiry}</Text> : null}
                <Text className="text-sm text-muted mb-1">
                  Evidence: {verification.attachmentCount || 0} attachment{verification.attachmentCount === 1 ? "" : "s"}
                  {verification.evidenceModel === "legacy_single_url" ? " · legacy record" : ""}
                </Text>
                {verification.status === "rejected" && verification.rejectionReason ? (
                  <View className="mt-2 bg-red-50 rounded-lg p-3">
                    <Text className="text-sm text-red-700 font-medium">Rejection Reason</Text>
                    <Text className="text-sm text-red-600 mt-1">{verification.rejectionReason}</Text>
                  </View>
                ) : null}
                <Text className="text-xs text-muted mt-2">Submitted: {new Date(verification.createdAt).toLocaleDateString()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
