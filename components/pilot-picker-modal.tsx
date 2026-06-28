/**
 * PilotPickerModal
 * 
 * Modal for C2/C3 operators to manually select a pilot for B2B delivery assignment.
 * Canonical: "COS oferă entității control asupra fluxului" — Cap. 6, §6.4.4.A
 * 
 * Features:
 * - Displays eligible pilots (rating >= 4.00, cosEligible = TRUE)
 * - Shows pilot stats: rating, total deliveries, completion rate, availability
 * - Filters by zone, vehicle type (optional)
 * - Assigns pilot with server-side validation
 * - Audit log entry + webhook trigger
 * 
 * Access: C2/C3 roles only (OperationsManager, LogisticsCoordinator, etc.)
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export interface PilotPickerModalProps {
  visible: boolean;
  onClose: () => void;
  deliveryId: number;
  pickupLat?: number;
  pickupLng?: number;
  vehicleType?: string;
  zone?: string;
  onPilotSelected?: (pilotId: number, pilotName: string) => void;
}

interface EligiblePilot {
  userId: number;
  name: string;
  profileId?: number;
  rating: number;
  totalDeliveries: number;
  completionRate: number;
  isAvailable: boolean;
  currentLat?: string;
  currentLng?: string;
  zone?: string;
}

export function PilotPickerModal({
  visible,
  onClose,
  deliveryId,
  pickupLat,
  pickupLng,
  vehicleType,
  zone,
  onPilotSelected,
}: PilotPickerModalProps) {
  const colors = useColors();
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch eligible pilots
  const { data: eligibleData, isLoading } = trpc.pilotSelection.getEligiblePilots.useQuery(
    {
      pickupLat,
      pickupLng,
      vehicleType,
      zone,
    },
    { enabled: visible }
  );

  const pilots = eligibleData?.pilots || [];
  const error = eligibleData?.error;

  // Assign pilot mutation
  const assignMutation = trpc.pilotSelection.assignPilotManual.useMutation({
    onSuccess: (result) => {
      setIsAssigning(false);
      if (result.success) {
        const selectedPilot = pilots.find((p) => p.userId === selectedPilotId);
        Alert.alert("Success", `Pilot ${selectedPilot?.name} assigned to delivery.`);
        onPilotSelected?.(selectedPilotId!, selectedPilot?.name || "");
        onClose();
      } else {
        Alert.alert("Error", result.error || "Failed to assign pilot.");
      }
    },
    onError: (err) => {
      setIsAssigning(false);
      Alert.alert("Error", err.message || "Failed to assign pilot.");
    },
  });

  const handleAssign = () => {
    if (!selectedPilotId) {
      Alert.alert("Select a Pilot", "Please select a pilot before assigning.");
      return;
    }

    setIsAssigning(true);
    assignMutation.mutate({
      deliveryId,
      pilotUserId: selectedPilotId,
    });
  };

  const PilotCard = ({ pilot }: { pilot: EligiblePilot }) => {
    const isSelected = selectedPilotId === pilot.userId;
    return (
      <Pressable
        onPress={() => setSelectedPilotId(pilot.userId)}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View
          className={cn(
            "p-4 rounded-lg mb-3 border-2",
            isSelected
              ? "bg-primary/10 border-primary"
              : "bg-surface border-border"
          )}
        >
          {/* Pilot Name & Rating */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-foreground flex-1">
              {pilot.name}
            </Text>
            <View className="bg-yellow-400 px-3 py-1 rounded-full">
              <Text className="text-sm font-bold text-black">
                ⭐ {pilot.rating.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="grid grid-cols-2 gap-2">
            <View className="bg-background/50 p-2 rounded">
              <Text className="text-xs text-muted">Deliveries</Text>
              <Text className="text-base font-semibold text-foreground">
                {pilot.totalDeliveries}
              </Text>
            </View>
            <View className="bg-background/50 p-2 rounded">
              <Text className="text-xs text-muted">Completion</Text>
              <Text className="text-base font-semibold text-foreground">
                {(pilot.completionRate * 100).toFixed(0)}%
              </Text>
            </View>

            <View className="bg-background/50 p-2 rounded">
              <Text className="text-xs text-muted">Status</Text>
              <Text
                className={cn(
                  "text-base font-semibold",
                  pilot.isAvailable ? "text-success" : "text-warning"
                )}
              >
                {pilot.isAvailable ? "Available" : "Busy"}
              </Text>
            </View>
          </View>

          {/* Zone Info */}
          {pilot.zone && (
            <Text className="text-xs text-muted mt-2">Zone: {pilot.zone}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View className="px-4 py-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">
              Select Pilot
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text className="text-lg text-primary font-semibold">✕</Text>
            </Pressable>
          </View>
          <Text className="text-sm text-muted mt-1">
            Choose an eligible pilot for this delivery
          </Text>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-4">
          {/* Error State */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
              <Text className="text-sm text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-2">Loading eligible pilots...</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && pilots.length === 0 && !error && (
            <View className="items-center justify-center py-8">
              <Text className="text-lg text-muted font-semibold">
                No eligible pilots available
              </Text>
              <Text className="text-sm text-muted mt-2">
                Pilots must have a rating of 4.0+ to be eligible for manual assignment.
              </Text>
            </View>
          )}

          {/* Pilot List */}
          {!isLoading && pilots.length > 0 && (
            <FlatList
              data={pilots}
              keyExtractor={(item) => String(item.userId)}
              renderItem={({ item }) => <PilotCard pilot={item} />}
              scrollEnabled={false}
            />
          )}
        </ScrollView>

        {/* Footer */}
        <View className="px-4 py-4 border-t border-border flex-row gap-3">
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-1"
          >
            <View className="bg-surface border border-border rounded-lg py-3 items-center">
              <Text className="text-foreground font-semibold">Cancel</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleAssign}
            disabled={!selectedPilotId || isAssigning}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-1"
          >
            <View
              className={cn(
                "rounded-lg py-3 items-center",
                selectedPilotId && !isAssigning
                  ? "bg-primary"
                  : "bg-muted opacity-50"
              )}
            >
              {isAssigning ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text className="text-background font-semibold">
                  Assign Pilot
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
