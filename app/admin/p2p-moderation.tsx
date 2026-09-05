import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { p2pMediaSource } from "@/lib/p2p-media-url";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

const MODERATOR_ROLES = ["system_administrator", "security_officer", "audit_manager", "configuration_manager", "analytics_manager"];

export default function P2pModerationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, token } = useDropiAuth();
  const utils = trpc.useUtils();
  const pending = trpc.p2p.pendingCommunityOffers.useQuery(undefined, { enabled: MODERATOR_ROLES.includes(user?.dropiRole || "") });
  const moderate = trpc.p2p.moderateCommunityOffer.useMutation();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  if (!MODERATOR_ROLES.includes(user?.dropiRole || "")) {
    return <ScreenContainer className="p-6"><TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary }}>← Back</Text></TouchableOpacity><Text style={{ color: colors.error, fontWeight: "800", fontSize: 20, marginTop: 24 }}>Access denied</Text><Text style={{ color: colors.muted, marginTop: 8 }}>P2P Marketplace moderation is restricted to authorized administration roles.</Text></ScreenContainer>;
  }

  async function moderateListing(listingId: number, action: "approve" | "reject") {
    if (action === "reject" && !rejectNote.trim()) return Alert.alert("Rejection reason required");
    try {
      await moderate.mutateAsync({ listingId, action, note: action === "reject" ? rejectNote.trim() : "Approved after governed review" });
      setRejectingId(null);
      setRejectNote("");
      await utils.p2p.pendingCommunityOffers.invalidate();
      Alert.alert(action === "approve" ? "Offer approved" : "Offer rejected");
    } catch (error) {
      Alert.alert("Moderation blocked", error instanceof Error ? error.message : "Request failed.");
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary, fontWeight: "600" }}>← Marketplace moderation</Text></TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 25, fontWeight: "800", marginTop: 14 }}>P2P Community Moderation</Text>
        <Text style={{ color: colors.muted, marginTop: 5 }}>Review item evidence, classification, declarations and category-specific safety information before approval.</Text>

        {pending.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : null}
        {!pending.isLoading && (pending.data?.length || 0) === 0 ? <View style={{ marginTop: 28, alignItems: "center" }}><Text style={{ color: colors.foreground, fontWeight: "700" }}>Queue empty</Text><Text style={{ color: colors.muted, marginTop: 4 }}>No P2P community offers are waiting for review.</Text></View> : null}

        {pending.data?.map((listing) => {
          const images = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
          const governed = Boolean(listing.category && listing.itemCondition && listing.policyVersion && listing.attestedAt && images.length > 0);
          return (
            <View key={listing.id} style={{ backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: 14, padding: 14, marginTop: 14 }}>
              <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 17 }}>{listing.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{listing.offerType.replace("_", " ")} · {listing.category || "LEGACY / UNCLASSIFIED"} · {listing.itemCondition || "condition missing"}</Text>
              {listing.description ? <Text style={{ color: colors.foreground, marginTop: 8 }}>{listing.description}</Text> : null}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {images.map((url, index) => <Image key={`${url}-${index}`} source={p2pMediaSource(url, token)} style={{ width: 130, height: 130, borderRadius: 10, marginRight: 8 }} />)}
              </ScrollView>
              <Text style={{ color: governed ? colors.success : colors.error, fontWeight: "700", fontSize: 12, marginTop: 8 }}>{governed ? `Governed evidence complete · ${listing.policyVersion}` : "Approval blocked: legacy/incomplete governed evidence"}</Text>
              {listing.attestedAt ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Poster attested: {new Date(listing.attestedAt).toLocaleString()}</Text> : null}

              {listing.foodSafety ? <View style={{ backgroundColor: colors.background, borderRadius: 10, padding: 10, marginTop: 10 }}><Text style={{ color: colors.foreground, fontWeight: "700" }}>Food / consumption declarations</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>Ingredients: {listing.foodSafety.ingredients}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>Allergens: {listing.foodSafety.allergens}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>Storage: {listing.foodSafety.storageInstructions}</Text>{listing.foodSafety.useByDate ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>Use-by / consumption: {listing.foodSafety.useByDate}</Text> : null}</View> : null}

              {rejectingId === listing.id ? <View style={{ marginTop: 12 }}><TextInput value={rejectNote} onChangeText={setRejectNote} placeholder="Required rejection reason" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 11, minHeight: 65, textAlignVertical: "top" }} /><View style={{ flexDirection: "row", marginTop: 8 }}><TouchableOpacity onPress={() => { setRejectingId(null); setRejectNote(""); }} style={{ flex: 1, padding: 11, alignItems: "center" }}><Text style={{ color: colors.muted }}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={moderate.isPending} onPress={() => void moderateListing(listing.id, "reject")} style={{ flex: 1, backgroundColor: colors.error, borderRadius: 10, padding: 11, alignItems: "center" }}><Text style={{ color: "#fff", fontWeight: "700" }}>Reject</Text></TouchableOpacity></View></View> : <View style={{ flexDirection: "row", marginTop: 12 }}><TouchableOpacity onPress={() => setRejectingId(listing.id)} style={{ flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: 10, padding: 11, alignItems: "center", marginRight: 8 }}><Text style={{ color: colors.error, fontWeight: "700" }}>Reject</Text></TouchableOpacity><TouchableOpacity disabled={moderate.isPending || !governed} onPress={() => void moderateListing(listing.id, "approve")} style={{ flex: 1, backgroundColor: colors.success, borderRadius: 10, padding: 11, alignItems: "center", opacity: moderate.isPending || !governed ? 0.45 : 1 }}><Text style={{ color: "#fff", fontWeight: "700" }}>Approve</Text></TouchableOpacity></View>}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}
