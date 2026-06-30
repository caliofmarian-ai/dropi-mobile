/**
 * Notification Center — Sprint 6B
 * Shows all in-app notifications for the current user with read/unread state.
 */
import { useCallback, useState } from "react";
import { Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  verification: { icon: "checkmark.shield.fill", color: "#22C55E" },
  mission: { icon: "airplane", color: "#3B82F6" },
  order: { icon: "cart.fill", color: "#8B5CF6" },
  system: { icon: "gear", color: "#6B7280" },
  promotion: { icon: "tag.fill", color: "#F59E0B" },
  security: { icon: "shield.fill", color: "#EF4444" },
  general: { icon: "bell.fill", color: "#0a7ea4" },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Acum";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}z`;
  return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

export default function NotificationCenterScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = trpc.notifications.getNotifications.useQuery(
    { limit: 50, offset: 0 }
  );
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery();
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation();

  const utils = trpc.useUtils();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await utils.notifications.getUnreadCount.invalidate();
    setRefreshing(false);
  }, [refetch, utils]);

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
    await utils.notifications.getNotifications.invalidate();
    await utils.notifications.getUnreadCount.invalidate();
  };

  const handleNotificationPress = async (id: number, isRead: boolean) => {
    if (!isRead) {
      await markAsRead.mutateAsync({ notificationId: id });
      await utils.notifications.getNotifications.invalidate();
      await utils.notifications.getUnreadCount.invalidate();
    }
  };

  const notifications = data?.notifications || [];
  const unreadCount = unreadData?.count || 0;

  const renderNotification = ({ item }: { item: any }) => {
    const categoryInfo = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.general;
    return (
      <Pressable
        onPress={() => handleNotificationPress(item.id, item.isRead)}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            padding: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            backgroundColor: item.isRead ? "transparent" : (colors.primary + "08"),
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: categoryInfo.color + "15",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}>
          <IconSymbol name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text
              className="text-foreground font-semibold text-sm"
              style={{ flex: 1 }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-muted text-xs ml-2">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          <Text className="text-muted text-xs mt-1" numberOfLines={2}>
            {item.body}
          </Text>
          {!item.isRead && (
            <View style={{
              position: "absolute",
              right: 0,
              top: 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
            }} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">Notificări</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={handleMarkAllRead}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-sm text-primary font-medium">Citește tot</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <View className="px-4 py-2 bg-surface">
          <Text className="text-xs text-muted">
            {unreadCount} {unreadCount === 1 ? "notificare necitită" : "notificări necitite"}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <IconSymbol name="bell.fill" size={48} color={colors.muted} />
          <Text className="text-muted text-base mt-4 text-center">
            Nicio notificare încă
          </Text>
          <Text className="text-muted text-sm mt-1 text-center">
            Vei primi notificări despre verificări, misiuni și comenzi aici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </ScreenContainer>
  );
}
