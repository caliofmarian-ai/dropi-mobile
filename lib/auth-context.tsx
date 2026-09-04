import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { DropiRole, Channel, DropiUser } from "@/shared/types";
import { TEST_ROLE_IDENTITIES } from "@/shared/test-role-accounts";
import { getApiBaseUrl, getRequiredApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

type AuthActionResult = { success: boolean; error?: string };

// ===== AUTH CONTEXT TYPE =====
interface AuthContextType {
  user: DropiUser | null;
  loading: boolean;
  isDemo: boolean;
  isPhantom: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (data: RegisterData) => Promise<AuthActionResult & { accountPendingApproval?: boolean }>;
  logout: () => Promise<void>;
  switchRole: (role: DropiRole, channel: Channel) => Promise<void>;
  enterDemoMode: (email: string) => Promise<void>;
  enterPhantomSession: (targetUserId: number) => Promise<AuthActionResult>;
  exitPhantomSession: () => Promise<AuthActionResult>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthActionResult>;
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
const PHANTOM_KEY = "@dropi_phantom";

function getApiTrpcUrl(): string {
  if (Platform.OS === "web") {
    const base = getApiBaseUrl();
    return base ? `${base}/api/trpc` : "/api/trpc";
  }
  return `${getRequiredApiBaseUrl("auth tRPC")}/api/trpc`;
}

// Visual demo identities are derived from the same canonical role registry as
// real IMPL-008 test accounts. They deliberately have negative local IDs and no
// server token so they cannot be mistaken for persisted accounts.
const DEMO_USERS: Record<string, DropiUser> = Object.fromEntries(
  TEST_ROLE_IDENTITIES.map((identity, index) => [
    identity.humanEmail,
    {
      id: -(index + 1),
      name: `Demo ${identity.label}`,
      email: identity.humanEmail,
      dropiRole: identity.role,
      channel: identity.channel,
      zone: identity.channel === "ADMIN" ? null : "Demo Zone",
      isAuthenticated: true,
    },
  ]),
);

async function apiCall(path: string, input: any, token?: string | null) {
  const url = `${getApiTrpcUrl()}/${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ json: input }),
    credentials: "include",
  });

  const data = await response.json();
  if (data.error) {
    const msg = data.error?.json?.message || data.error?.message || "API error";
    throw new Error(msg);
  }
  return data.result?.data?.json ?? data.result?.data;
}

function toDropiUser(dbUser: any, fallbackName = "DROPi User"): DropiUser {
  return {
    id: dbUser.id,
    name: dbUser.name || fallbackName,
    email: dbUser.email,
    dropiRole: dbUser.dropiRole,
    channel: dbUser.channel,
    zone: dbUser.zone,
    isAuthenticated: true,
    emailVerified: dbUser.emailVerified,
    isVerified: dbUser.isVerified,
    profilePhotoUrl: dbUser.profilePhotoUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DropiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [isPhantom, setIsPhantom] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const applyAuthenticatedSession = useCallback(async (
    nextUser: DropiUser,
    nextToken: string,
    phantom: boolean,
  ) => {
    setUser(nextUser);
    setToken(nextToken);
    setIsDemo(false);
    setIsPhantom(phantom);
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(nextUser)],
      [TOKEN_KEY, nextToken],
      [DEMO_KEY, "false"],
      [PHANTOM_KEY, phantom ? "true" : "false"],
    ]);
    await Auth.setSessionToken(nextToken);
  }, []);

  const clearLocalSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    setIsDemo(false);
    setIsPhantom(false);
    await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_KEY, DEMO_KEY, PHANTOM_KEY]);
    await Auth.removeSessionToken();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken, storedDemo, storedPhantom] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(DEMO_KEY),
          AsyncStorage.getItem(PHANTOM_KEY),
        ]);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
          const demo = storedDemo === "true";
          const phantom = storedPhantom === "true";
          setIsDemo(demo);
          setIsPhantom(!demo && phantom);
          setToken(demo ? null : storedToken);
          if (storedToken && !demo) {
            await Auth.setSessionToken(storedToken);
          } else if (demo) {
            await Auth.removeSessionToken();
          }
        }
      } catch {
        // Corrupt local auth state must not block app startup.
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const result = await apiCall("dropiAuth.login", { email: normalizedEmail, password });
      if (!result?.token || !result?.user) throw new Error("Login response did not contain a valid session");
      await applyAuthenticatedSession(
        toDropiUser(result.user, normalizedEmail.split("@")[0]),
        result.token,
        false,
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  }, [applyAuthenticatedSession]);

  const register = useCallback(async (
    data: RegisterData,
  ): Promise<AuthActionResult & { accountPendingApproval?: boolean }> => {
    try {
      const result = await apiCall("dropiAuth.register", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name,
        dropiRole: data.dropiRole || "customer",
        channel: data.channel || "C1",
        zone: data.zone,
      });

      if (!result.token) {
        await clearLocalSession();
        return {
          success: true,
          accountPendingApproval: Boolean(result.accountPendingApproval),
        };
      }

      await applyAuthenticatedSession(toDropiUser(result.user, data.name), result.token, false);
      return { success: true, accountPendingApproval: false };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  }, [applyAuthenticatedSession, clearLocalSession]);

  const enterDemoMode = useCallback(async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const demoUser = DEMO_USERS[normalizedEmail];
    if (!demoUser) return;

    setUser(demoUser);
    setIsDemo(true);
    setIsPhantom(false);
    setToken(null);
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(demoUser)],
      [DEMO_KEY, "true"],
      [PHANTOM_KEY, "false"],
    ]);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await Auth.removeSessionToken();
  }, []);

  const enterPhantomSession = useCallback(async (targetUserId: number): Promise<AuthActionResult> => {
    if (!token || isDemo || isPhantom || user?.dropiRole !== "system_administrator" || user.channel !== "ADMIN") {
      return { success: false, error: "Phantom mode requires an active System Administrator session." };
    }

    try {
      const result = await apiCall("phantomConsole.enter", { targetUserId }, token);
      if (!result?.token || !result?.user) throw new Error("Phantom login did not return a valid session");
      await applyAuthenticatedSession(toDropiUser(result.user), result.token, true);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Unable to enter phantom mode" };
    }
  }, [applyAuthenticatedSession, isDemo, isPhantom, token, user]);

  const exitPhantomSession = useCallback(async (): Promise<AuthActionResult> => {
    if (!isPhantom || !token) {
      return { success: false, error: "No active phantom session." };
    }

    try {
      const result = await apiCall("adminAuth.exitPhantom", {}, token);
      if (!result?.token || !result?.user) throw new Error("Phantom exit did not return the administrator session");
      await applyAuthenticatedSession(toDropiUser(result.user), result.token, false);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Unable to exit phantom mode" };
    }
  }, [applyAuthenticatedSession, isPhantom, token]);

  const logout = useCallback(async () => {
    if (!isDemo && token) {
      if (!isPhantom) {
        try {
          const storedPushToken = await AsyncStorage.getItem("@dropi_push_token");
          if (storedPushToken) {
            await apiCall("notifications.unregisterPushToken", { token: storedPushToken }, token);
            await AsyncStorage.removeItem("@dropi_push_token");
          }
        } catch {
          // Push cleanup is best-effort and must not block logout.
        }
      }
      try {
        await apiCall("dropiAuth.logout", {}, token);
      } catch {
        // Server revocation failure must not trap the user in local auth state.
      }
    }
    await clearLocalSession();
  }, [clearLocalSession, isDemo, isPhantom, token]);

  const switchRole = useCallback(async (role: DropiRole, channel: Channel) => {
    // Real and phantom sessions are bound to persisted RBAC. Only visual demo
    // mode may switch local roles without creating a server-side mismatch.
    if (!isDemo || !user) return;
    const updated = { ...user, dropiRole: role, channel };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [isDemo, user]);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await apiCall("dropiAuth.forgotPassword", { email: email.toLowerCase().trim() });
      return { success: true, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to send reset code" };
    }
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string): Promise<AuthActionResult> => {
    try {
      await apiCall("dropiAuth.resetPassword", { token: resetToken, newPassword });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Password reset failed" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo,
      isPhantom,
      token,
      login,
      register,
      logout,
      switchRole,
      enterDemoMode,
      enterPhantomSession,
      exitPhantomSession,
      forgotPassword,
      resetPassword,
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

export const DEMO_ACCOUNTS = DEMO_USERS;
