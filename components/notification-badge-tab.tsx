/**
 * NotificationBadgeTab — Bell icon with unread count badge for tab bar.
 * Uses tRPC to fetch unread count and displays a red badge when > 0.
 */
import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useDropiAuth } from "@/lib/auth-context";

interface NotificationBadgeTabProps {
  color: string;
  size?: number;
}

export function NotificationBadgeTab({ color, size = 28 }: NotificationBadgeTabProps) {
  const { user, isDemo } = useDropiAuth();

  // Only fetch unread count if user is authenticated (not demo mode without server session)
  const { data } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: !!user && !isDemo,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = data?.count ?? 0;

  return (
    <View style={{ width: size + 8, height: size + 4, alignItems: "center", justifyContent: "center" }}>
      <IconSymbol name="bell.fill" size={size} color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            backgroundColor: "#EF4444",
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}
