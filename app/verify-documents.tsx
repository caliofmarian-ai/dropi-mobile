import { useState, useEffect, useCallback } from "react";
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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const TOKEN_KEY = "@dropi_token";

// Document type options
const DOCUMENT_TYPES = [
  { value: "driving_license", label: "Driving License" },
  { value: "drone_license", label: "Drone Pilot License" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "background_check", label: "Background Check" },
  { value: "other", label: "Other Document" },
] as const;

// Vehicle type options
const VEHICLE_TYPES = [
  { value: "drone", label: "Drone" },
  { value: "car", label: "Car" },
  { value: "van", label: "Van" },
  { value: "ebike", label: "E-Bike" },
  { value: "motorcycle", label: "Motorcycle" },
] as const;

type VerificationStatus = "pending" | "approved" | "rejected";

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
}

interface StatusSummary {
  isVerified: boolean;
  hasPending: boolean;
  totalSubmitted: number;
  approved: number;
  rejected: number;
  pending: number;
}

// API helper
async function apiCall(path: string, input: any, method: "POST" | "GET" = "POST") {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

export default function VerifyDocumentsScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [status, setStatus] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [documentType, setDocumentType] = useState<string>("driving_license");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

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

  const handlePickDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload documents.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `document_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";
        setSelectedFile({ uri: asset.uri, name: fileName, type: mimeType });
        setUploadedUrl(null);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to pick document: " + (err.message || "Unknown error"));
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access to photograph documents.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";
        setSelectedFile({ uri: asset.uri, name: fileName, type: mimeType });
        setUploadedUrl(null);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to take photo: " + (err.message || "Unknown error"));
    }
  };

  const handleUploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await apiCall("verification.uploadDocument", {
        fileName: selectedFile.name,
        fileBase64: base64,
        contentType: selectedFile.type,
      });

      setUploadedUrl(result.url);
      return result.url;
    } catch (err: any) {
      Alert.alert("Upload Error", err.message || "Failed to upload document");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert("Error", "License/Document number is required");
      return;
    }

    setSubmitting(true);
    try {
      // Upload file first if selected
      let documentUrl = uploadedUrl;
      if (selectedFile && !uploadedUrl) {
        documentUrl = await handleUploadFile();
      }

      const input: any = {
        documentType,
        licenseNumber: licenseNumber.trim(),
      };
      if (documentUrl) input.documentUrl = documentUrl;
      if (vehicleType) input.vehicleType = vehicleType;
      if (expiryDate) input.expiryDate = expiryDate;
      if (notes.trim()) input.notes = notes.trim();

      await apiCall("verification.submit", input);

      // Reset form
      setLicenseNumber("");
      setVehicleType("");
      setExpiryDate("");
      setNotes("");
      setSelectedFile(null);
      setUploadedUrl(null);
      setShowForm(false);

      // Reload data
      await loadData();

      Alert.alert("Success", "Document submitted for verification. An admin will review it shortly.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (s: VerificationStatus) => {
    switch (s) {
      case "approved": return "#22C55E";
      case "rejected": return "#EF4444";
      case "pending": return "#F59E0B";
    }
  };

  const getStatusLabel = (s: VerificationStatus) => {
    switch (s) {
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "pending": return "Pending Review";
    }
  };

  const formatDocType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Document Verification</Text>
        </View>

        {/* Status Banner */}
        <View className={`rounded-xl p-4 mb-6 border ${status?.isVerified ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">{status?.isVerified ? "✓" : "!"}</Text>
            <View className="flex-1">
              <Text className={`font-bold text-base ${status?.isVerified ? "text-green-800" : "text-amber-800"}`}>
                {status?.isVerified ? "Verified — Ready for Missions" : "Unverified — Cannot Receive Missions"}
              </Text>
              <Text className={`text-sm mt-1 ${status?.isVerified ? "text-green-600" : "text-amber-600"}`}>
                {status?.isVerified
                  ? "Your documents have been approved. You can now accept delivery missions."
                  : "Submit at least one document for admin approval to start receiving missions."}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        {status && status.totalSubmitted > 0 && (
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-surface rounded-lg p-3 items-center border border-border">
              <Text className="text-2xl font-bold text-foreground">{status.approved}</Text>
              <Text className="text-xs text-muted">Approved</Text>
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

        {/* Submit New Document Button */}
        {!showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            className="bg-primary rounded-xl p-4 mb-6 items-center"
          >
            <Text className="text-background font-semibold text-base">+ Submit New Document</Text>
          </TouchableOpacity>
        )}

        {/* Submission Form */}
        {showForm && (
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Submit Document</Text>

            {/* Document Type Selector */}
            <Text className="text-sm font-medium text-foreground mb-2">Document Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {DOCUMENT_TYPES.map((dt) => (
                <TouchableOpacity
                  key={dt.value}
                  onPress={() => setDocumentType(dt.value)}
                  className={`px-3 py-2 rounded-lg border ${documentType === dt.value ? "bg-primary border-primary" : "bg-background border-border"}`}
                >
                  <Text className={`text-sm ${documentType === dt.value ? "text-background font-semibold" : "text-foreground"}`}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* License Number */}
            <Text className="text-sm font-medium text-foreground mb-2">License / Document Number *</Text>
            <TextInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Enter document number"
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
            />

            {/* Vehicle Type */}
            <Text className="text-sm font-medium text-foreground mb-2">Vehicle Type (optional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {VEHICLE_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt.value}
                  onPress={() => setVehicleType(vehicleType === vt.value ? "" : vt.value)}
                  className={`px-3 py-2 rounded-lg border ${vehicleType === vt.value ? "bg-primary border-primary" : "bg-background border-border"}`}
                >
                  <Text className={`text-sm ${vehicleType === vt.value ? "text-background font-semibold" : "text-foreground"}`}>
                    {vt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expiry Date */}
            <Text className="text-sm font-medium text-foreground mb-2">Expiry Date (optional, YYYY-MM-DD)</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2027-12-31"
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
            />

            {/* Document Upload */}
            <Text className="text-sm font-medium text-foreground mb-2">Upload Document (Photo/Scan)</Text>
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                onPress={handlePickDocument}
                className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground text-sm">📁 From Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground text-sm">📷 Take Photo</Text>
              </TouchableOpacity>
            </View>
            {selectedFile && (
              <View className="mb-4 rounded-lg overflow-hidden border border-border">
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={{ width: "100%", height: 180 }}
                  resizeMode="cover"
                />
                <View className="flex-row items-center justify-between p-2 bg-surface">
                  <Text className="text-xs text-muted flex-1" numberOfLines={1}>{selectedFile.name}</Text>
                  {uploadedUrl ? (
                    <Text className="text-xs text-green-600 font-medium">✓ Uploaded</Text>
                  ) : uploading ? (
                    <ActivityIndicator size="small" color="#0a7ea4" />
                  ) : (
                    <TouchableOpacity onPress={() => { setSelectedFile(null); setUploadedUrl(null); }}>
                      <Text className="text-xs text-error font-medium">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Notes */}
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

            {/* Submit / Cancel */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !licenseNumber.trim()}
                className={`flex-1 rounded-lg py-3 items-center ${submitting || !licenseNumber.trim() ? "bg-muted" : "bg-primary"}`}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-background font-semibold">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Submitted Documents List */}
        <Text className="text-lg font-bold text-foreground mb-3">Submitted Documents</Text>
        {verifications.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center border border-border">
            <Text className="text-muted text-center">No documents submitted yet. Submit your first document to get verified.</Text>
          </View>
        ) : (
          verifications.map((v) => (
            <View key={v.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-foreground">{formatDocType(v.documentType)}</Text>
                <View style={{ backgroundColor: getStatusColor(v.status) + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: getStatusColor(v.status), fontSize: 12, fontWeight: "600" }}>
                    {getStatusLabel(v.status)}
                  </Text>
                </View>
              </View>

              {v.licenseNumber && (
                <Text className="text-sm text-muted mb-1">Number: {v.licenseNumber}</Text>
              )}
              {v.vehicleType && (
                <Text className="text-sm text-muted mb-1">Vehicle: {formatDocType(v.vehicleType)}</Text>
              )}
              {v.expiryDate && (
                <Text className="text-sm text-muted mb-1">Expires: {new Date(v.expiryDate).toLocaleDateString()}</Text>
              )}
              {v.status === "rejected" && v.rejectionReason && (
                <View className="mt-2 bg-red-50 rounded-lg p-3">
                  <Text className="text-sm text-red-700 font-medium">Rejection Reason:</Text>
                  <Text className="text-sm text-red-600 mt-1">{v.rejectionReason}</Text>
                </View>
              )}
              <Text className="text-xs text-muted mt-2">
                Submitted: {new Date(v.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
