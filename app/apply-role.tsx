import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { getApiBaseUrl } from "@/constants/oauth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeGoBack } from "@/lib/safe-back";

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

interface AvailableRole {
  id: string;
  name: string;
  channel: "C1" | "C2" | "C3" | "ADMIN";
}

interface MyApplication {
  id: number;
  requestedRole: string;
  requestedChannel: string;
  motivation: string | null;
  qualifications: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

// Channel descriptions
const CHANNEL_INFO: Record<string, { label: string; description: string; color: string }> = {
  C2: { label: "C2 — Contracted Operations", description: "Operational roles managing daily logistics, fleet, and quality", color: "#3B82F6" },
  C3: { label: "C3 — Emergency Operations", description: "Emergency response, dispatch, and crisis management roles", color: "#EF4444" },
  ADMIN: { label: "Admin", description: "Platform administration, security, and system management", color: "#8B5CF6" },
};

export default function ApplyRoleScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();

  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedRole, setSelectedRole] = useState<AvailableRole | null>(null);
  const [motivation, setMotivation] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roles, apps] = await Promise.all([
        apiCall("roleApplications.availableRoles", undefined, "GET"),
        apiCall("roleApplications.myApplications", undefined, "GET"),
      ]);
      setAvailableRoles(roles || []);
      setMyApplications(apps || []);
    } catch (err: any) {
      console.error("Failed to load role data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRole = (role: AvailableRole) => {
    // Check if already applied for this role
    const existingApp = myApplications.find(
      (a) => a.requestedRole === role.id && (a.status === "pending" || a.status === "under_review")
    );
    if (existingApp) {
      Alert.alert("Already Applied", "You already have a pending application for this role.");
      return;
    }
    setSelectedRole(role);
    setShowForm(true);
    setMotivation("");
    setQualifications("");
  };

  const handleSubmit = async () => {
    if (!selectedRole) return;
    if (motivation.trim().length < 10) {
      Alert.alert("Error", "Motivation must be at least 10 characters");
      return;
    }
    if (qualifications.trim().length < 10) {
      Alert.alert("Error", "Qualifications must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      await apiCall("roleApplications.submitApplication", {
        requestedRole: selectedRole.id,
        requestedChannel: selectedRole.channel,
        motivation: motivation.trim(),
        qualifications: qualifications.trim(),
      });

      setShowForm(false);
      setSelectedRole(null);
      setMotivation("");
      setQualifications("");
      await loadData();

      Alert.alert("Application Submitted", "Your role application has been submitted for admin review. You will be notified by email when a decision is made.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (applicationId: number) => {
    Alert.alert("Withdraw Application", "Are you sure you want to withdraw this application?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: async () => {
          try {
            await apiCall("roleApplications.withdraw", { applicationId });
            await loadData();
            Alert.alert("Withdrawn", "Your application has been withdrawn.");
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to withdraw");
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#22C55E";
      case "rejected": return "#EF4444";
      case "pending": return "#F59E0B";
      case "under_review": return "#3B82F6";
      case "withdrawn": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "pending": return "Pending";
      case "under_review": return "Under Review";
      case "withdrawn": return "Withdrawn";
      default: return status;
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Group roles by channel
  const rolesByChannel = availableRoles.reduce((acc, role) => {
    if (!acc[role.channel]) acc[role.channel] = [];
    acc[role.channel].push(role);
    return acc;
  }, {} as Record<string, AvailableRole[]>);

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted mt-4">Loading available roles...</Text>
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
            onPress={() => safeGoBack(router)}
            style={{ padding: 8, marginRight: 12 }}
          >
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Apply for Role</Text>
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-blue-800 font-medium mb-1">How Role Applications Work</Text>
          <Text className="text-blue-600 text-sm">
            Operational roles (C2, C3, Admin) require admin approval. Submit your motivation and qualifications, and an administrator will review your application. You will be notified by email.
          </Text>
        </View>

        {/* Application Form */}
        {showForm && selectedRole && (
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-1">Apply for: {selectedRole.name}</Text>
            <Text className="text-sm text-muted mb-4">Channel: {selectedRole.channel}</Text>

            <Text className="text-sm font-medium text-foreground mb-2">Motivation *</Text>
            <TextInput
              value={motivation}
              onChangeText={setMotivation}
              placeholder="Why do you want this role? What drives you?"
              multiline
              numberOfLines={4}
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
              style={{ textAlignVertical: "top", minHeight: 100 }}
            />

            <Text className="text-sm font-medium text-foreground mb-2">Qualifications *</Text>
            <TextInput
              value={qualifications}
              onChangeText={setQualifications}
              placeholder="Relevant experience, certifications, skills..."
              multiline
              numberOfLines={4}
              className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholderTextColor="#687076"
              style={{ textAlignVertical: "top", minHeight: 100 }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => { setShowForm(false); setSelectedRole(null); }}
                className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || motivation.trim().length < 10 || qualifications.trim().length < 10}
                className={`flex-1 rounded-lg py-3 items-center ${submitting || motivation.trim().length < 10 || qualifications.trim().length < 10 ? "bg-muted" : "bg-primary"}`}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-background font-semibold">Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Applications */}
        {myApplications.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">My Applications</Text>
            {myApplications.map((app) => (
              <View key={app.id} className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold text-foreground">{formatRole(app.requestedRole)}</Text>
                  <View style={{ backgroundColor: getStatusColor(app.status) + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: getStatusColor(app.status), fontSize: 12, fontWeight: "600" }}>
                      {getStatusLabel(app.status)}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted mb-1">Channel: {app.requestedChannel}</Text>
                <Text className="text-xs text-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</Text>

                {app.status === "rejected" && app.rejectionReason && (
                  <View className="mt-2 bg-red-50 rounded-lg p-3">
                    <Text className="text-sm text-red-700 font-medium">Rejection Reason:</Text>
                    <Text className="text-sm text-red-600 mt-1">{app.rejectionReason}</Text>
                  </View>
                )}

                {(app.status === "pending" || app.status === "under_review") && (
                  <TouchableOpacity
                    onPress={() => handleWithdraw(app.id)}
                    className="mt-3 border border-muted rounded-lg py-2 items-center"
                  >
                    <Text className="text-muted font-medium text-sm">Withdraw Application</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Available Roles by Channel */}
        {!showForm && (
          <>
            <Text className="text-lg font-bold text-foreground mb-3">Available Roles</Text>
            {Object.entries(rolesByChannel).map(([channel, roles]) => {
              const info = CHANNEL_INFO[channel];
              if (!info) return null;
              return (
                <View key={channel} className="mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View style={{ width: 4, height: 20, backgroundColor: info.color, borderRadius: 2 }} />
                    <View>
                      <Text className="font-bold text-foreground">{info.label}</Text>
                      <Text className="text-xs text-muted">{info.description}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    {roles.map((role) => {
                      const hasPending = myApplications.some(
                        (a) => a.requestedRole === role.id && (a.status === "pending" || a.status === "under_review")
                      );
                      return (
                        <TouchableOpacity
                          key={role.id}
                          onPress={() => handleSelectRole(role)}
                          disabled={hasPending}
                          className={`px-3 py-2 rounded-lg border ${hasPending ? "bg-surface border-border opacity-50" : "bg-background border-border"}`}
                        >
                          <Text className={`text-sm ${hasPending ? "text-muted" : "text-foreground"}`}>
                            {role.name}
                            {hasPending ? " (applied)" : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
