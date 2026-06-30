import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { DropiRole, Channel, DropiUser } from "@/shared/types";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

// ===== AUTH CONTEXT TYPE =====
interface AuthContextType {
  user: DropiUser | null;
  loading: boolean;
  isDemo: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: DropiRole, channel: Channel) => Promise<void>;
  enterDemoMode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  dropiRole?: string;
  channel?: Channel;
  zone?: string;
  merchantSubType?: string;
  isVerified?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@dropi_user";
const TOKEN_KEY = "@dropi_token";
const DEMO_KEY = "@dropi_demo";

// API base URL — uses the same resolver as tRPC client
// On web: derives from current hostname (8081 → 3000)
// On native via Expo Go: uses EXPO_PUBLIC_API_BASE_URL env var
function getApiTrpcUrl(): string {
  const base = getApiBaseUrl();
  if (base) return `${base}/api/trpc`;
  // Web fallback: relative path
  if (Platform.OS === "web") return "/api/trpc";
  // Native fallback: should not happen if env is set
  return "http://localhost:3000/api/trpc";
}

// ===== DEMO ACCOUNTS (kept for demo mode) =====
const DEMO_USERS: Record<string, DropiUser> = {
  "customer@dropi.app": { id: 1, name: "Maria Santos", email: "customer@dropi.app", dropiRole: "customer", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "merchant@dropi.app": { id: 2, name: "Juan's Kitchen", email: "merchant@dropi.app", dropiRole: "merchant", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "pilot@dropi.app": { id: 3, name: "Carlos Reyes", email: "pilot@dropi.app", dropiRole: "delivery_partner", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "support@dropi.app": { id: 4, name: "Ana Support", email: "support@dropi.app", dropiRole: "support_agent", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "analyst@dropi.app": { id: 5, name: "Rico Analyst", email: "analyst@dropi.app", dropiRole: "analyst", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "compliance@dropi.app": { id: 6, name: "Elena Compliance", email: "compliance@dropi.app", dropiRole: "compliance_officer", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "fraud@dropi.app": { id: 7, name: "Marco Fraud Det.", email: "fraud@dropi.app", dropiRole: "fraud_detection", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "performance@dropi.app": { id: 8, name: "Lisa Performance", email: "performance@dropi.app", dropiRole: "performance_monitor", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "incident@dropi.app": { id: 9, name: "David Incident", email: "incident@dropi.app", dropiRole: "incident_responder", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "ops.manager@dropi.app": { id: 10, name: "Pedro Operations", email: "ops.manager@dropi.app", dropiRole: "operations_manager", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "logistics@dropi.app": { id: 11, name: "Sofia Logistics", email: "logistics@dropi.app", dropiRole: "logistics_coordinator", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "fleet@dropi.app": { id: 12, name: "Miguel Fleet", email: "fleet@dropi.app", dropiRole: "fleet_manager", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.compliance@dropi.app": { id: 13, name: "Rosa Compliance", email: "c2.compliance@dropi.app", dropiRole: "c2_compliance_officer", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.performance@dropi.app": { id: 14, name: "Luis Performance", email: "c2.performance@dropi.app", dropiRole: "c2_performance_monitor", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.incident@dropi.app": { id: 15, name: "Carmen Incident", email: "c2.incident@dropi.app", dropiRole: "c2_incident_responder", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "data.analyst@dropi.app": { id: 16, name: "Jorge Data", email: "data.analyst@dropi.app", dropiRole: "data_analyst", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "qa@dropi.app": { id: 17, name: "Isabel QA", email: "qa@dropi.app", dropiRole: "quality_assurance", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "emergency@dropi.app": { id: 18, name: "Rafael Emergency", email: "emergency@dropi.app", dropiRole: "emergency_coordinator", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "dispatch@dropi.app": { id: 19, name: "Teresa Dispatch", email: "dispatch@dropi.app", dropiRole: "dispatch_manager", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "resources@dropi.app": { id: 20, name: "Antonio Resources", email: "resources@dropi.app", dropiRole: "resource_allocator", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "comms@dropi.app": { id: 21, name: "Patricia Comms", email: "comms@dropi.app", dropiRole: "communication_officer", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "c3.analyst@dropi.app": { id: 22, name: "Fernando Analyst", email: "c3.analyst@dropi.app", dropiRole: "c3_data_analyst", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "commander@dropi.app": { id: 23, name: "Gen. Santos", email: "commander@dropi.app", dropiRole: "incident_commander", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "dropi.deliveries@gmail.com": { id: 24, name: "Super Admin", email: "dropi.deliveries@gmail.com", dropiRole: "system_administrator", channel: "ADMIN", zone: null, isAuthenticated: true },
  "security@dropi.app": { id: 25, name: "Security Officer", email: "security@dropi.app", dropiRole: "security_officer", channel: "ADMIN", zone: null, isAuthenticated: true },
  "audit@dropi.app": { id: 26, name: "Audit Manager", email: "audit@dropi.app", dropiRole: "audit_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "config@dropi.app": { id: 27, name: "Config Manager", email: "config@dropi.app", dropiRole: "configuration_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "analytics@dropi.app": { id: 28, name: "Analytics Manager", email: "analytics@dropi.app", dropiRole: "analytics_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "support.coord@dropi.app": { id: 29, name: "Support Coordinator", email: "support.coord@dropi.app", dropiRole: "support_coordinator", channel: "ADMIN", zone: null, isAuthenticated: true },
};

// ===== API HELPER =====
async function apiCall(path: string, input: any, token?: string | null) {
  const url = `${getApiTrpcUrl()}/${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: input }),
    credentials: "include",
  });

  const data = await response.json();
  if (data.error) {
    // tRPC wraps errors in data.error.json.message
    const msg = data.error?.json?.message || data.error?.message || "API error";
    throw new Error(msg);
  }
  // tRPC with superjson wraps in result.data.json
  return data.result?.data?.json ?? data.result?.data;
}

// ===== AUTH PROVIDER =====
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DropiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken, storedDemo] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(DEMO_KEY),
        ]);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsDemo(storedDemo === "true");
          setToken(storedToken);
          // Bridge existing token to canonical auth store for tRPC
          if (storedToken && storedDemo !== "true") {
            await Auth.setSessionToken(storedToken);
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Real login via API
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiCall("dropiAuth.login", { email: email.toLowerCase().trim(), password });
      const dbUser = result.user;
      const dropiUser: DropiUser = {
        id: dbUser.id,
        name: dbUser.name || email.split("@")[0],
        email: dbUser.email,
        dropiRole: dbUser.dropiRole,
        channel: dbUser.channel,
        zone: dbUser.zone,
        isAuthenticated: true,
      };
      setUser(dropiUser);
      setToken(result.token);
      setIsDemo(false);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dropiUser));
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      await AsyncStorage.setItem(DEMO_KEY, "false");
      // Bridge token to canonical auth store so tRPC client can use it
      await Auth.setSessionToken(result.token);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  }, []);

  // Real register via API
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiCall("dropiAuth.register", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name,
        dropiRole: data.dropiRole || "customer",
        channel: data.channel || "C1",
        zone: data.zone,
      });
      const dbUser = result.user;
      const dropiUser: DropiUser = {
        id: dbUser.id,
        name: dbUser.name || data.name,
        email: dbUser.email,
        dropiRole: dbUser.dropiRole,
        channel: dbUser.channel,
        zone: dbUser.zone,
        isAuthenticated: true,
      };
      setUser(dropiUser);
      setToken(result.token);
      setIsDemo(false);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dropiUser));
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      await AsyncStorage.setItem(DEMO_KEY, "false");
      // Bridge token to canonical auth store so tRPC client can use it
      await Auth.setSessionToken(result.token);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  }, []);

  // Demo mode (local only, no server)
  const enterDemoMode = useCallback(async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const demoUser = DEMO_USERS[normalizedEmail];
    if (demoUser) {
      setUser(demoUser);
      setIsDemo(true);
      setToken(null);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
      await AsyncStorage.setItem(DEMO_KEY, "true");
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isDemo && token) {
      try {
        // Unregister push token before logout to stop receiving notifications on this device
        const storedPushToken = await AsyncStorage.getItem("@dropi_push_token");
        if (storedPushToken) {
          await apiCall("notifications.unregisterPushToken", { token: storedPushToken }, token);
          await AsyncStorage.removeItem("@dropi_push_token");
        }
      } catch { /* silent — don't block logout */ }
      try {
        await apiCall("dropiAuth.logout", {}, token);
      } catch {}
    }
    setUser(null);
    setToken(null);
    setIsDemo(false);
    await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY, DEMO_KEY]);
    // Clear canonical auth store
    await Auth.removeSessionToken();
  }, [isDemo, token]);

  const switchRole = useCallback(async (role: DropiRole, channel: Channel) => {
    if (user) {
      const updated = { ...user, dropiRole: role, channel };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user]);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await apiCall("dropiAuth.forgotPassword", { email: email.toLowerCase().trim() });
      return { success: true, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to send reset code" };
    }
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiCall("dropiAuth.resetPassword", { token: resetToken, newPassword });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Password reset failed" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, isDemo, token,
      login, register, logout, switchRole,
      enterDemoMode, forgotPassword, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useDropiAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useDropiAuth must be used within an AuthProvider");
  }
  return context;
}

// Export demo users for the login screen
export const DEMO_ACCOUNTS = DEMO_USERS;
