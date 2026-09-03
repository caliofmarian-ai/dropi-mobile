import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  REFRESH_TOKEN_KEY,
  SESSION_TOKEN_KEY,
  USER_INFO_KEY,
  getRequiredApiBaseUrl,
} from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

type RefreshResponse = {
  app_session_id?: string;
  refresh_token?: string;
};

let refreshPromise: Promise<string | null> | null = null;

function decodeJwtExpirationMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    let decoded: string;
    if (typeof globalThis.atob === "function") {
      decoded = globalThis.atob(padded);
    } else {
      const BufferImpl = (globalThis as Record<string, any>).Buffer;
      if (!BufferImpl) return null;
      decoded = BufferImpl.from(padded, "base64").toString("utf8");
    }
    const payload = JSON.parse(decoded) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function shouldRefreshToken(token: string): boolean {
  const expiresAt = decodeJwtExpirationMs(token);
  if (!expiresAt) return false;
  return expiresAt <= Date.now() + 60_000;
}

async function readNativeToken(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`[Auth] Failed to read secure credential ${key}:`, error);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  return readNativeToken(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(refreshToken: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function setSessionCredentials(
  token: string,
  refreshToken?: string | null,
): Promise<void> {
  await setSessionToken(token);
  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }
}

export async function refreshSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${getRequiredApiBaseUrl("OAuth refresh")}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });
      if (!response.ok) {
        await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        return null;
      }

      const result = (await response.json()) as RefreshResponse;
      if (!result.app_session_id || !result.refresh_token) {
        throw new Error("Refresh response did not contain rotated credentials");
      }
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, result.app_session_id);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refresh_token);
      return result.app_session_id;
    } catch (error) {
      console.error("[Auth] Failed to rotate refresh credential:", error);
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token retrieval");
      return null;
    }

    const token = await readNativeToken(SESSION_TOKEN_KEY);
    if (!token) return null;

    if (shouldRefreshToken(token) && (await getRefreshToken())) {
      const refreshed = await refreshSessionToken();
      return refreshed ?? token;
    }
    return token;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token storage");
      return;
    }

    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Failed to set session token:", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token removal");
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(SESSION_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error("[Auth] Failed to remove session credentials:", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    console.log("[Auth] Getting user info...");

    let info: string | null = null;
    if (Platform.OS === "web") {
      info = window.localStorage.getItem(USER_INFO_KEY);
    } else {
      info = await SecureStore.getItemAsync(USER_INFO_KEY);
    }

    if (!info) {
      console.log("[Auth] No user info found");
      return null;
    }
    const user = JSON.parse(info);
    console.log("[Auth] User info retrieved:", user);
    return user;
  } catch (error) {
    console.error("[Auth] Failed to get user info:", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    console.log("[Auth] Setting user info...", user);

    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      console.log("[Auth] User info stored in localStorage successfully");
      return;
    }

    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
    console.log("[Auth] User info stored in SecureStore successfully");
  } catch (error) {
    console.error("[Auth] Failed to set user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear user info:", error);
  }
}
