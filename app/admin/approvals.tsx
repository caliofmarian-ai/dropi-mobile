import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/constants/oauth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@dropi_token";

// API helper
async function apiCall(path: string, input: any, method: "POST" | "GET" = "POST") {
  const base = getApiBaseUrl();
  const url = `${base}/api/trpc/${path}`;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

type Tab = "verifications" | "roles";

interface VerificationItem {
  verification: {
    id: number;
    userId: number;
    documentType: string;
    licenseNumber: string | null;
    vehicleType: string | null;
    status: string;
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

export default function AdminApprovalsScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();

  const [activeTab, setActiveTab] = useState<Tab>("verifications");
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [roleApps, setRoleApps] = useState<RoleApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
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
  }, [loadVerifications, loadRoleApplications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approve/Reject verification
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
      await loadVerifications();
      Alert.alert("Done", `Verification ${decision}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to process");
    } finally {
      setProcessing(null);
    }
  };

  // Approve/Reject role application
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

  const formatDocType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Approval Panel</Text>
        </View>

        {/* Tab Selector */}
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

        {/* Verifications Tab */}
        {activeTab === "verifications" && (
          <>
            {verifications.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-muted text-center">No pending verifications</Text>
              </View>
            ) : (
              verifications.map((item) => (
                <View key={item.verification.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                  {/* User Info */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View>
                      <Text className="font-bold text-foreground">{item.userName || "Unknown"}</Text>
                      <Text className="text-xs text-muted">{item.userEmail}</Text>
                    </View>
                    <View className="bg-amber-100 px-3 py-1 rounded-full">
                      <Text className="text-amber-700 text-xs font-semibold">Pending</Text>
                    </View>
                  </View>

                  {/* Document Details */}
                  <View className="bg-background rounded-lg p-3 mb-3">
                    <Text className="text-sm text-foreground font-medium">
                      {formatDocType(item.verification.documentType)}
                    </Text>
                    {item.verification.licenseNumber && (
                      <Text className="text-sm text-muted mt-1">Number: {item.verification.licenseNumber}</Text>
                    )}
                    {item.verification.vehicleType && (
                      <Text className="text-sm text-muted mt-1">Vehicle: {formatDocType(item.verification.vehicleType)}</Text>
                    )}
                    {item.verification.notes && (
                      <Text className="text-sm text-muted mt-1">Notes: {item.verification.notes}</Text>
                    )}
                    <Text className="text-xs text-muted mt-2">
                      Submitted: {new Date(item.verification.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Rejection Reason Input */}
                  {showRejectId === item.verification.id && (
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
                  )}

                  {/* Action Buttons */}
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
                          {processing === item.verification.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text className="text-background font-semibold">Confirm Reject</Text>
                          )}
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
                          {processing === item.verification.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text className="text-background font-semibold">Approve</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Role Applications Tab */}
        {activeTab === "roles" && (
          <>
            {roleApps.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 items-center border border-border">
                <Text className="text-muted text-center">No pending role applications</Text>
              </View>
            ) : (
              roleApps.map((item) => (
                <View key={item.application.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                  {/* User Info */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View>
                      <Text className="font-bold text-foreground">{item.userName || "Unknown"}</Text>
                      <Text className="text-xs text-muted">{item.userEmail}</Text>
                    </View>
                    <View className="bg-amber-100 px-3 py-1 rounded-full">
                      <Text className="text-amber-700 text-xs font-semibold">Pending</Text>
                    </View>
                  </View>

                  {/* Current Role */}
                  <View className="flex-row gap-2 mb-2">
                    <View className="bg-background rounded-lg px-3 py-1">
                      <Text className="text-xs text-muted">Current: {formatDocType(item.currentRole || "none")} ({item.currentChannel})</Text>
                    </View>
                  </View>

                  {/* Requested Role */}
                  <View className="bg-background rounded-lg p-3 mb-3">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Text className="text-sm font-bold text-primary">
                        Requesting: {formatDocType(item.application.requestedRole)}
                      </Text>
                      <View className="bg-primary/10 px-2 py-0.5 rounded">
                        <Text className="text-xs text-primary font-medium">{item.application.requestedChannel}</Text>
                      </View>
                    </View>

                    {item.application.motivation && (
                      <View className="mb-2">
                        <Text className="text-xs font-medium text-foreground">Motivation:</Text>
                        <Text className="text-sm text-muted mt-1">{item.application.motivation}</Text>
                      </View>
                    )}

                    {item.application.qualifications && (
                      <View>
                        <Text className="text-xs font-medium text-foreground">Qualifications:</Text>
                        <Text className="text-sm text-muted mt-1">{item.application.qualifications}</Text>
                      </View>
                    )}

                    <Text className="text-xs text-muted mt-2">
                      Applied: {new Date(item.application.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Rejection Reason Input */}
                  {showRejectId === item.application.id + 10000 && (
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
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    {showRejectId === item.application.id + 10000 ? (
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
                          {processing === item.application.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text className="text-background font-semibold">Confirm Reject</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => setShowRejectId(item.application.id + 10000)}
                          className="flex-1 bg-background border border-error rounded-lg py-3 items-center"
                        >
                          <Text className="text-error font-medium">Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRoleDecision(item.application.id, "approved")}
                          disabled={processing === item.application.id}
                          className="flex-1 bg-success rounded-lg py-3 items-center"
                        >
                          {processing === item.application.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text className="text-background font-semibold">Approve</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
