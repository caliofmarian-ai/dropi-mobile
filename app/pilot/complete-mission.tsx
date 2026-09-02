import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { RECEPTION_METHODS, type ReceptionMethod } from "@/shared/operational-trace-policy";

const LABELS: Record<ReceptionMethod, string> = {
  personal_handover: "Personal handover",
  leave_at_door: "Leave at door",
  leave_at_gate: "Leave at gate",
  leave_in_yard: "Leave in yard",
  drone_reception: "Drone reception point",
  droneport_pickup: "DronePort pickup",
  fallback_handover: "Fallback handover",
};

export default function CompleteB2bMissionScreen() {
  const { deliveryId: rawDeliveryId } = useLocalSearchParams<{ deliveryId: string }>();
  const router = useRouter();
  const deliveryId = Number(rawDeliveryId);
  const validDeliveryId = useMemo(() => Number.isSafeInteger(deliveryId) && deliveryId > 0, [deliveryId]);
  const [method, setMethod] = useState<ReceptionMethod>("personal_handover");
  const [notes, setNotes] = useState("");
  const transition = trpc.b2bDelivery.pilotUpdateStatus.useMutation();

  const complete = async () => {
    if (!validDeliveryId) return;
    try {
      await transition.mutateAsync({
        deliveryId,
        newStatus: "delivered",
        completionProof: {
          receptionMethod: method,
          notes: notes.trim() || undefined,
        },
      });
      Alert.alert("Delivery completed", "Proof of delivery and custody evidence were recorded.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Completion blocked", error?.message || "Delivery could not be completed.");
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-foreground">B2B Proof of Delivery</Text>
        <Text className="text-sm text-muted mt-1 mb-5">
          Record the actual reception method. This is operational evidence, not a fabricated legal signature.
        </Text>

        <Text className="text-sm font-semibold text-foreground mb-2">Reception method</Text>
        {RECEPTION_METHODS.map((value) => (
          <TouchableOpacity
            key={value}
            className={`border rounded-xl p-3 mb-2 ${method === value ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
            onPress={() => setMethod(value)}
          >
            <Text className={method === value ? "text-primary font-semibold" : "text-foreground"}>{LABELS[value]}</Text>
          </TouchableOpacity>
        ))}

        <Text className="text-sm font-semibold text-foreground mt-3 mb-2">Operational note (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          maxLength={1000}
          multiline
          placeholder="Only factual completion context"
          placeholderTextColor="#9CA3AF"
          className="bg-surface border border-border rounded-xl p-3 text-foreground min-h-[100px]"
        />

        <TouchableOpacity
          className="bg-success rounded-xl py-3 items-center mt-5"
          disabled={!validDeliveryId || transition.isPending}
          onPress={complete}
        >
          <Text className="text-white font-bold">Record proof & complete mission</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
