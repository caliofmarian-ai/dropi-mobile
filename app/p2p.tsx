import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

type OfferType = "donation" | "free_transfer" | "fixed_price";

export default function P2pScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useDropiAuth();
  const utils = trpc.useUtils();
  const zone = user?.zone?.trim() || "";

  const [offerType, setOfferType] = useState<OfferType>("donation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fixedPrice, setFixedPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [weightGrams, setWeightGrams] = useState("");

  const offersQuery = trpc.p2p.myCommunityOffers.useQuery(undefined, { enabled: user?.dropiRole === "customer" });
  const parcelsQuery = trpc.p2p.myPrivateParcels.useQuery(undefined, { enabled: user?.dropiRole === "customer" });
  const createOffer = trpc.p2p.createCommunityOffer.useMutation();
  const closeOffer = trpc.p2p.closeCommunityOffer.useMutation();
  const createParcel = trpc.p2p.createPrivateParcel.useMutation();
  const cancelParcel = trpc.p2p.cancelPrivateParcel.useMutation();

  async function submitOffer() {
    if (!zone) return Alert.alert("Operating zone required");
    const expiresAt = new Date(`${expiryDate.trim()}T23:59:59`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim()) || Number.isNaN(expiresAt.getTime())) {
      return Alert.alert("Invalid expiry", "Use YYYY-MM-DD. Community offers must expire.");
    }
    const price = offerType === "fixed_price" ? Number(fixedPrice) : undefined;
    if (offerType === "fixed_price" && (!Number.isFinite(price) || price! <= 0)) {
      return Alert.alert("Price required", "Enter a positive fixed price.");
    }
    try {
      await createOffer.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        offerType,
        fixedPrice: price,
        expiresAt,
        zone,
      });
      setTitle(""); setDescription(""); setFixedPrice(""); setExpiryDate(""); setOfferType("donation");
      await utils.p2p.myCommunityOffers.invalidate();
      Alert.alert("Submitted for moderation", "The community offer is not public until approved.");
    } catch (error) {
      Alert.alert("Offer could not be created", error instanceof Error ? error.message : "Request failed.");
    }
  }

  async function submitParcel() {
    if (!zone) return Alert.alert("Operating zone required");
    const weight = Number(weightGrams);
    if (!Number.isSafeInteger(weight) || weight <= 0) return Alert.alert("Invalid weight", "Enter package weight in whole grams.");
    try {
      await createParcel.mutateAsync({
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: deliveryAddress.trim(),
        packageDescription: packageDescription.trim(),
        weightGrams: weight,
        zone,
      });
      setPickupAddress(""); setDeliveryAddress(""); setPackageDescription(""); setWeightGrams("");
      await utils.p2p.myPrivateParcels.invalidate();
      Alert.alert("Private parcel initiated", "This request is private and is not published in Marketplace discovery.");
    } catch (error) {
      Alert.alert("Parcel could not be initiated", error instanceof Error ? error.message : "Request failed.");
    }
  }

  if (user?.dropiRole !== "customer") {
    return (
      <ScreenContainer className="p-6">
        <TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 18, marginTop: 20 }}>P2P is a customer capability</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>It is intentionally separate from merchant storefronts.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary, fontWeight: "600" }}>← Marketplace</Text></TouchableOpacity>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginTop: 14 }}>P2P — Channel 1</Text>
        <Text style={{ color: colors.muted, marginTop: 5 }}>Private parcels and occasional non-commercial community offers are separate from merchant commerce.</Text>
        <Text style={{ color: colors.primary, marginTop: 8, fontWeight: "600" }}>Zone: {zone || "not configured"}</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 0.5, borderColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Community offer</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Maximum 3 active offers. Every offer expires and requires moderation. No auctions, negotiation, promotion or recurring disguised commerce.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
            {(["donation", "free_transfer", "fixed_price"] as OfferType[]).map((type) => (
              <TouchableOpacity key={type} onPress={() => setOfferType(type)} style={{ backgroundColor: offerType === type ? colors.primary : colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, marginBottom: 6 }}>
                <Text style={{ color: offerType === type ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{type.replace("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput value={title} onChangeText={setTitle} placeholder="Offer title" placeholderTextColor={colors.muted} style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8, minHeight: 70, textAlignVertical: "top" }} />
          {offerType === "fixed_price" && <TextInput value={fixedPrice} onChangeText={setFixedPrice} placeholder="Fixed price" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />}
          <TextInput value={expiryDate} onChangeText={setExpiryDate} placeholder="Expiry date YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />
          <TouchableOpacity disabled={createOffer.isPending || title.trim().length < 2 || !expiryDate.trim()} onPress={() => void submitOffer()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12, opacity: createOffer.isPending || title.trim().length < 2 || !expiryDate.trim() ? 0.5 : 1 }}>
            {createOffer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Submit for moderation</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>My community offers</Text>
        {offersQuery.data?.map((offer) => (
          <View key={offer.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{offer.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{offer.status} • {offer.offerType.replace("_", " ")} • expires {new Date(offer.expiresAt).toLocaleDateString()}</Text>
            {(offer.status === "pending_review" || offer.status === "approved") && (
              <TouchableOpacity onPress={() => void closeOffer.mutateAsync({ listingId: offer.id }).then(() => utils.p2p.myCommunityOffers.invalidate())} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>Close offer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 0.5, borderColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Private parcel</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Addresses stay private. This request never appears in public Marketplace discovery.</Text>
          <TextInput value={pickupAddress} onChangeText={setPickupAddress} placeholder="Pickup address" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 10, minHeight: 60 }} />
          <TextInput value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Delivery address" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8, minHeight: 60 }} />
          <TextInput value={packageDescription} onChangeText={setPackageDescription} placeholder="Package description" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8, minHeight: 60 }} />
          <TextInput value={weightGrams} onChangeText={setWeightGrams} placeholder="Weight in grams" placeholderTextColor={colors.muted} keyboardType="number-pad" style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />
          <TouchableOpacity disabled={createParcel.isPending} onPress={() => void submitParcel()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12, opacity: createParcel.isPending ? 0.5 : 1 }}>
            {createParcel.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Initiate private parcel</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>My private parcels</Text>
        {parcelsQuery.data?.map((parcel) => (
          <View key={parcel.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{parcel.requestUid}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{parcel.status} • {parcel.weightGrams} g • {parcel.zone}</Text>
            {parcel.status === "initiated" && (
              <TouchableOpacity onPress={() => void cancelParcel.mutateAsync({ requestId: parcel.id }).then(() => utils.p2p.myPrivateParcels.invalidate())} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>Cancel request</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
