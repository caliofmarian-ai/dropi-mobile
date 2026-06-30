import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useDropiAuth } from "@/lib/auth-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useWSNotifications } from "@/hooks/use-ws-notifications";
import { useNotificationSound } from "@/lib/notification-sound";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Registers push notification token when user is authenticated (non-demo).
 * Must be rendered inside AuthProvider + trpc.Provider.
 */
function PushNotificationRegistrar() {
  const { user, isDemo } = useDropiAuth();
  usePushNotifications(!!user, isDemo);
  return null;
}

/**
 * Manages WebSocket notification connection and invalidates tRPC cache on new notifications.
 * Must be rendered inside AuthProvider + trpc.Provider + QueryClientProvider.
 */
function WSNotificationManager({ queryClient }: { queryClient: QueryClient }) {
  const { user, isDemo, token } = useDropiAuth();
  const { playNotificationSound } = useNotificationSound();

  const handleNewNotification = useCallback(() => {
    // Play DROPi notification chime
    playNotificationSound();
    // Invalidate the unread count query so badge updates instantly
    queryClient.invalidateQueries({ queryKey: [["notifications", "getUnreadCount"]] });
    // Also invalidate the notification list if it's open
    queryClient.invalidateQueries({ queryKey: [["notifications", "getNotifications"]] });
  }, [queryClient, playNotificationSound]);

  const handleUnreadCountUpdate = useCallback((_count: number) => {
    // Force refetch unread count for badge
    queryClient.invalidateQueries({ queryKey: [["notifications", "getUnreadCount"]] });
  }, [queryClient]);

  useWSNotifications({
    userId: user?.id ?? null,
    token: token,
    isDemo,
    onNewNotification: handleNewNotification,
    onUnreadCountUpdate: handleUnreadCountUpdate,
  });

  return null;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="merchant-order/[id]" />
              <Stack.Screen name="mission/[id]" />
              <Stack.Screen name="oauth/callback" />
            </Stack>
            <PushNotificationRegistrar />
            <WSNotificationManager queryClient={queryClient} />
            <StatusBar style="auto" />
          </QueryClientProvider>
        </trpc.Provider>
      </AuthProvider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
