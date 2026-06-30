/**
 * Push Notification Hook — Sprint 6A+
 * Registers for push notifications and sends the token to the server.
 * Handles permission requests and notification listeners.
 * 
 * NOTE: Remote push notifications are unavailable in Expo Go on Android from SDK 53+.
 * A development build is required for full push notification testing on Android.
 */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

// Configure notification handler (show notifications when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[PUSH] Notification received:", notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[PUSH] Notification tapped, data:", data);
      // Navigation based on data.screen can be added here
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isAuthenticated]);

  return { token: tokenRef.current };
}

async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Set up Android notification channels first (required for permission prompt)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0a7ea4",
      });

      await Notifications.setNotificationChannelAsync("verification", {
        name: "Verification Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22C55E",
      });
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PUSH] Permission not granted");
      return null;
    }

    // Get Expo push token — requires a valid projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      // In Expo Go (SDK 53+), projectId is not available and remote push
      // notifications are not supported. Silently skip registration.
      console.log("[PUSH] Skipped: No projectId found (Expo Go limitation). Use a development build for push notifications.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    console.log("[PUSH] Token obtained:", tokenData.data.substring(0, 30) + "...");
    return tokenData.data;
  } catch (error: any) {
    // Suppress known Expo Go limitation errors silently
    if (error?.message?.includes("projectId") || error?.message?.includes("remote notifications")) {
      console.log("[PUSH] Skipped: Not supported in current environment.");
      return null;
    }
    console.warn("[PUSH] Registration warning:", error?.message || error);
    return null;
  }
}
