/**
 * Push Notification Hook — Sprint 6A+
 * Registers for push notifications and sends the token to the server.
 * Handles permission requests and notification listeners.
 * 
 * NOTE: Remote push notifications are unavailable in Expo Go on Android from SDK 53+.
 * A development build is required for full push notification testing on Android.
 * 
 * The expo-notifications module is lazy-loaded to prevent the Expo Go warning
 * from appearing on import. The warning "Android Push notifications... was removed
 * from Expo Go" is suppressed by deferring the import until actually needed.
 */
import { useEffect, useRef } from "react";
import { Platform, LogBox } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

// Suppress the known Expo Go push notification warning
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "expo-notifications:",
]);

// Lazy reference to the notifications module
let Notifications: typeof import("expo-notifications") | null = null;
let notificationsConfigured = false;

async function getNotificationsModule() {
  if (!Notifications) {
    Notifications = await import("expo-notifications");
  }
  return Notifications;
}

async function configureNotificationHandler() {
  if (notificationsConfigured) return;
  try {
    const N = await getNotificationsModule();
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationsConfigured = true;
  } catch {
    // Silently fail in Expo Go
  }
}

/**
 * Register for push notifications and send token to server.
 * Call this hook in the main layout after user is authenticated.
 * Skips registration for demo mode users (no valid server session).
 */
export function usePushNotifications(isAuthenticated: boolean, isDemo?: boolean) {
  const tokenRef = useRef<string | null>(null);
  const registerMutation = trpc.notifications.registerPushToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated || isDemo) return;
    if (Platform.OS === "web") return; // Push not supported on web

    // Check if we're in Expo Go (no projectId = no push support)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      // Silently skip — Expo Go doesn't support remote push from SDK 53+
      return;
    }

    configureNotificationHandler();

    registerForPushNotifications().then((token) => {
      if (token && token !== tokenRef.current) {
        tokenRef.current = token;
        const platform: "ios" | "android" | "web" = Platform.OS === "ios" ? "ios" : "android";
        registerMutation.mutate({ token, platform });
        // Store token locally for cleanup on logout
        AsyncStorage.setItem("@dropi_push_token", token).catch(() => {});
      }
    });
  }, [isAuthenticated, isDemo]);

  // Listen for incoming notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    // Skip listeners in Expo Go
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    let notificationListener: any;
    let responseListener: any;

    (async () => {
      const N = await getNotificationsModule();

      notificationListener = N.addNotificationReceivedListener((notification) => {
        console.log("[PUSH] Notification received:", notification.request.content.title);
      });

      responseListener = N.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("[PUSH] Notification tapped, data:", data);
      });
    })();

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, [isAuthenticated]);

  return { token: tokenRef.current };
}

async function registerForPushNotifications(): Promise<string | null> {
  try {
    const N = await getNotificationsModule();

    // Set up Android notification channels first
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("default", {
        name: "Default",
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0a7ea4",
      });

      await N.setNotificationChannelAsync("verification", {
        name: "Verification Updates",
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22C55E",
      });
    }

    // Check/request permissions
    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PUSH] Permission not granted");
      return null;
    }

    // Get Expo push token — requires a valid projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      return null;
    }

    const tokenData = await N.getExpoPushTokenAsync({ projectId });

    console.log("[PUSH] Token obtained:", tokenData.data.substring(0, 30) + "...");
    return tokenData.data;
  } catch (error: any) {
    // Suppress known Expo Go limitation errors silently
    if (error?.message?.includes("projectId") || error?.message?.includes("remote notifications")) {
      return null;
    }
    console.warn("[PUSH] Registration warning:", error?.message || error);
    return null;
  }
}
