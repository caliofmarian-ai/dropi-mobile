/**
 * AutoAssignBadge
 * 
 * Displays information about automatic pilot selection (C1 Marketplace).
 * Canonical: "Selecția este făcută de sistem" — Delivery_Multimodal §5
 * 
 * Shows:
 * - Pilot name and rating
 * - Selection criteria (proximity, rating, completion rate, rotation)
 * - "System Selected" badge
 * 
 * Used in: C1 dashboards, delivery detail screens
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

export interface AutoAssignBadgeProps {
  pilotName: string;
  pilotRating: number;
  totalDeliveries: number;
  completionRate: number;
  selectionReason?: "proximity" | "rating" | "rotation" | "availability";
  onPress?: () => void;
  size?: "sm" | "md" | "lg";
}

export function AutoAssignBadge({
  pilotName,
  pilotRating,
  totalDeliveries,
  completionRate,
  selectionReason = "proximity",
  onPress,
  size = "md",
}: AutoAssignBadgeProps) {
  const colors = useColors();

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-5 py-4",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const reasonEmoji = {
    proximity: "📍",
    rating: "⭐",
    rotation: "🔄",
    availability: "✓",
  };

  const reasonLabel = {
    proximity: "Nearest pilot",
    rating: "Highest rated",
    rotation: "Fair rotation",
    availability: "Available now",
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className={cn(
        "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg",
        sizeClasses[size]
      )}>
        {/* Header: System Selected Badge */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="bg-blue-500 rounded-full px-2 py-1">
            <Text className={cn("text-white font-bold", textSizes[size])}>
              🤖 System
            </Text>
          </View>
          <Text className={cn("text-blue-600 dark:text-blue-300 font-semibold", textSizes[size])}>
            Auto-Selected
          </Text>
        </View>

        {/* Pilot Info */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className={cn("text-foreground font-semibold flex-1", textSizes[size])}>
            {pilotName}
          </Text>
          <View className="bg-yellow-400 rounded-full px-2 py-1">
            <Text className={cn("text-black font-bold", textSizes[size])}>
              ⭐ {pilotRating.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-2">
          <View>
            <Text className={cn("text-muted", textSizes[size] === "text-xs" ? "text-xs" : "text-xs")}>
              Deliveries
            </Text>
            <Text className={cn("text-foreground font-semibold", textSizes[size])}>
              {totalDeliveries}
            </Text>
          </View>
          <View>
            <Text className={cn("text-muted", textSizes[size] === "text-xs" ? "text-xs" : "text-xs")}>
              Completion
            </Text>
            <Text className={cn("text-foreground font-semibold", textSizes[size])}>
              {(completionRate * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Selection Reason */}
        <View className="bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1">
          <Text className={cn("text-blue-700 dark:text-blue-300 font-medium", textSizes[size])}>
            {reasonEmoji[selectionReason]} {reasonLabel[selectionReason]}
          </Text>
        </View>

        {/* Info Text */}
        <Text className={cn("text-muted mt-2 text-center", textSizes[size] === "text-xs" ? "text-xs" : "text-xs")}>
          Marketplace uses automatic selection based on multiple factors
        </Text>
      </View>
    </Pressable>
  );
}
