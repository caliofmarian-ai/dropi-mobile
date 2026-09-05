import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";
import {
  MARKETPLACE_CATEGORY_POLICIES,
  MARKETPLACE_ITEM_CONDITIONS,
  MARKETPLACE_LISTING_POLICY_VERSION,
  MARKETPLACE_MAX_LISTING_IMAGES,
} from "@/shared/marketplace-policy";

type OfferType = "donation" | "free_transfer" | "fixed_price";
type SelectedImage = { uri: string; fileName: string; contentType: "image/jpeg" | "image/png" | "image/webp" };
type AttestationKey = "rulesAccepted" | "truthfulListing" | "authorizedToOffer" | "notProhibitedRestricted" | "moderationAcknowledged";

const ATTESTATIONS: { key: AttestationKey; label: string }[] = [
  { key: "rulesAccepted", label: "I have read and accept the Marketplace posting rules." },
  { key: "truthfulListing", label: "The listing information and photos are truthful." },
  { key: "authorizedToOffer", label: "I own this item or I am authorized to offer it." },
  { key: "notProhibitedRestricted", label: "This item is not prohibited or restricted by the applicable Marketplace rules." },
  { key: "moderationAcknowledged", label: "I understand DROPi moderation may reject or remove this listing." },
];

function contentTypeForAsset(asset: any): SelectedImage["contentType"] {
  if (asset?.mimeType === "image/png" || /\.png$/i.test(asset?.fileName || "")) return "image/png";
  if (asset?.mimeType === "image/webp" || /\.webp$/i.test(asset?.fileName || "")) return "image/webp";
  return "image/jpeg";
}

async function imageToBase64(image: SelectedImage): Promise<string> {
  if (Platform.OS !== "web") {
    const FS = require("expo-file-system/legacy");
    return FS.readAsStringAsync(image.uri, { encoding: FS.EncodingType.Base64 });
  }
  const response = await fetch(image.uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  const [category, setCategory] = useState("");
  const [itemCondition, setItemCondition] = useState<(typeof MARKETPLACE_ITEM_CONDITIONS)[number]>("other");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");
  const [useByDate, setUseByDate] = useState("");
  const [attestation, setAttestation] = useState<Record<AttestationKey, boolean>>({
    rulesAccepted: false,
    truthfulListing: false,
    authorizedToOffer: false,
    notProhibitedRestricted: false,
    moderationAcknowledged: false,
  });

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
  const isFood = category === "Food & Groceries";
  const allAttested = ATTESTATIONS.every(({ key }) => attestation[key]);

  async function addPhoto(source: "gallery" | "camera") {
    if (selectedImages.length >= MARKETPLACE_MAX_LISTING_IMAGES) {
      return Alert.alert("Photo limit", `You can attach up to ${MARKETPLACE_MAX_LISTING_IMAGES} photos.`);
    }
    try {
      const ImagePicker = require("expo-image-picker");
      if (Platform.OS !== "web") {
        const permission = source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") return Alert.alert("Permission required", `Allow ${source === "camera" ? "camera" : "photo library"} access to attach item evidence.`);
      }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: false });
      const asset = !result.canceled ? result.assets?.[0] : null;
      if (!asset?.uri) return;
      setSelectedImages((current) => [...current, {
        uri: asset.uri,
        fileName: asset.fileName || `listing_${Date.now()}.jpg`,
        contentType: contentTypeForAsset(asset),
      }]);
    } catch (error) {
      Alert.alert("Photo could not be added", error instanceof Error ? error.message : "Image selection failed.");
    }
  }

  function resetOfferForm() {
    setTitle(""); setDescription(""); setFixedPrice(""); setExpiryDate(""); setOfferType("donation");
    setCategory(""); setItemCondition("other"); setSelectedImages([]);
    setIngredients(""); setAllergens(""); setStorageInstructions(""); setUseByDate("");
    setAttestation({ rulesAccepted: false, truthfulListing: false, authorizedToOffer: false, notProhibitedRestricted: false, moderationAcknowledged: false });
  }

  async function submitOffer() {
    if (!zone) return Alert.alert("Operating zone required");
    if (!category) return Alert.alert("Category required", "Choose the Marketplace category before submission.");
    if (selectedImages.length < 1) return Alert.alert("Photo required", "Attach at least one real photo of the item before moderation.");
    if (!allAttested) return Alert.alert("Marketplace declarations required", "Confirm every posting declaration before submission.");
    if (isFood && (!ingredients.trim() || !allergens.trim() || !storageInstructions.trim())) {
      return Alert.alert("Food safety information required", "Provide ingredients, allergen information and storage instructions.");
    }
    if (isFood && itemCondition === "prepared" && !useByDate.trim()) {
      return Alert.alert("Use-by information required", "Prepared food needs a use-by or consumption date before moderation.");
    }
    const expiresAt = new Date(`${expiryDate.trim()}T23:59:59`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim()) || Number.isNaN(expiresAt.getTime())) {
      return Alert.alert("Invalid expiry", "Use YYYY-MM-DD. Community offers must expire.");
    }
    if (expiresAt <= new Date()) return Alert.alert("Invalid expiry", "Choose a future expiry date.");
    const price = offerType === "fixed_price" ? Number(fixedPrice) : undefined;
    if (offerType === "fixed_price" && (!Number.isFinite(price) || price! <= 0)) {
      return Alert.alert("Price required", "Enter a positive fixed price.");
    }
    try {
      const images = await Promise.all(selectedImages.map(async (image) => ({
        fileBase64: await imageToBase64(image),
        contentType: image.contentType,
        fileName: image.fileName,
      })));
      await createOffer.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        offerType,
        fixedPrice: price,
        expiresAt,
        zone,
        category,
        itemCondition,
        images,
        foodSafety: isFood ? {
          ingredients: ingredients.trim(),
          allergens: allergens.trim(),
          storageInstructions: storageInstructions.trim(),
          useByDate: useByDate.trim() || undefined,
        } : undefined,
        attestation: {
          rulesAccepted: true,
          truthfulListing: true,
          authorizedToOffer: true,
          notProhibitedRestricted: true,
          moderationAcknowledged: true,
        },
      });
      resetOfferForm();
      await utils.p2p.myCommunityOffers.invalidate();
      Alert.alert("Submitted for moderation", "The item, photos and declarations are now available to moderation. The offer is not public until approved.");
    } catch (error) {
      Alert.alert("Offer could not be created", error instanceof Error ? error.message : "Request failed.");
    }
  }

  async function submitParcel() {
    if (!zone) return Alert.alert("Operating zone required");
    const weight = Number(weightGrams);
    if (!Number.isSafeInteger(weight) || weight <= 0) return Alert.alert("Invalid weight", "Enter package weight in whole grams.");
    try {
      await createParcel.mutateAsync({ pickupAddress: pickupAddress.trim(), deliveryAddress: deliveryAddress.trim(), packageDescription: packageDescription.trim(), weightGrams: weight, zone });
      setPickupAddress(""); setDeliveryAddress(""); setPackageDescription(""); setWeightGrams("");
      await utils.p2p.myPrivateParcels.invalidate();
      Alert.alert("Private parcel initiated", "This request is private and is not published in Marketplace discovery.");
    } catch (error) {
      Alert.alert("Parcel could not be initiated", error instanceof Error ? error.message : "Request failed.");
    }
  }

  if (user?.dropiRole !== "customer") {
    return <ScreenContainer className="p-6"><TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary }}>← Back</Text></TouchableOpacity><Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 18, marginTop: 20 }}>P2P is a customer capability</Text><Text style={{ color: colors.muted, marginTop: 8 }}>It is intentionally separate from merchant storefronts.</Text></ScreenContainer>;
  }

  const inputStyle = { backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 } as const;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <TouchableOpacity onPress={() => safeGoBack(router)}><Text style={{ color: colors.primary, fontWeight: "600" }}>← Marketplace</Text></TouchableOpacity>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.foreground, marginTop: 14 }}>P2P — Channel 1</Text>
        <Text style={{ color: colors.muted, marginTop: 5 }}>Private parcels and occasional non-commercial community offers are separate from merchant commerce.</Text>
        <Text style={{ color: colors.primary, marginTop: 8, fontWeight: "600" }}>Zone: {zone || "not configured"}</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 0.5, borderColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Community offer</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Maximum 3 active offers. Every physical listing requires item evidence, declarations and moderation before it can become public.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
            {(["donation", "free_transfer", "fixed_price"] as OfferType[]).map((type) => <TouchableOpacity key={type} onPress={() => setOfferType(type)} style={{ backgroundColor: offerType === type ? colors.primary : colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, marginBottom: 6 }}><Text style={{ color: offerType === type ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{type.replace("_", " ")}</Text></TouchableOpacity>)}
          </View>
          <TextInput value={title} onChangeText={setTitle} placeholder="Offer title" placeholderTextColor={colors.muted} style={inputStyle} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 70, textAlignVertical: "top" }} />
          {offerType === "fixed_price" && <TextInput value={fixedPrice} onChangeText={setFixedPrice} placeholder="Fixed price" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={inputStyle} />}

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 14 }}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {MARKETPLACE_CATEGORY_POLICIES.map((policy) => <TouchableOpacity key={policy.id} onPress={() => setCategory(policy.label)} style={{ backgroundColor: category === policy.label ? colors.primary : colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginRight: 7 }}><Text style={{ color: category === policy.label ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{policy.label}</Text></TouchableOpacity>)}
          </ScrollView>

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 14 }}>Item condition *</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 7 }}>
            {MARKETPLACE_ITEM_CONDITIONS.map((condition) => <TouchableOpacity key={condition} onPress={() => setItemCondition(condition)} style={{ backgroundColor: itemCondition === condition ? colors.primary : colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginRight: 7, marginBottom: 6 }}><Text style={{ color: itemCondition === condition ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{condition}</Text></TouchableOpacity>)}
          </View>

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 10 }}>Item photos * ({selectedImages.length}/{MARKETPLACE_MAX_LISTING_IMAGES})</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>At least one real item photo is required before moderation.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            {selectedImages.map((image, index) => <View key={`${image.uri}-${index}`} style={{ marginRight: 8, marginBottom: 8 }}><Image source={{ uri: image.uri }} style={{ width: 82, height: 82, borderRadius: 10 }} /><TouchableOpacity onPress={() => setSelectedImages((items) => items.filter((_, i) => i !== index))}><Text style={{ color: colors.error, fontSize: 11, marginTop: 3 }}>Remove</Text></TouchableOpacity></View>)}
          </View>
          {selectedImages.length < MARKETPLACE_MAX_LISTING_IMAGES && <View style={{ flexDirection: "row", marginTop: 4 }}><TouchableOpacity onPress={() => void addPhoto("gallery")} style={{ backgroundColor: colors.background, borderRadius: 10, padding: 10, marginRight: 8 }}><Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>🖼️ Gallery</Text></TouchableOpacity>{Platform.OS !== "web" && <TouchableOpacity onPress={() => void addPhoto("camera")} style={{ backgroundColor: colors.background, borderRadius: 10, padding: 10 }}><Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>📷 Camera</Text></TouchableOpacity>}</View>}

          {isFood && <View style={{ marginTop: 14, borderTopWidth: 0.5, borderColor: colors.border, paddingTop: 12 }}><Text style={{ color: colors.foreground, fontWeight: "700" }}>Food / consumption information *</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>These declarations are shown to moderation and, after approval, to recipients/customers. They are user-provided information, not a DROPi safety certification.</Text><TextInput value={ingredients} onChangeText={setIngredients} placeholder="Ingredients" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 55 }} /><TextInput value={allergens} onChangeText={setAllergens} placeholder="Allergens (write ‘none known’ if applicable)" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 55 }} /><TextInput value={storageInstructions} onChangeText={setStorageInstructions} placeholder="Storage instructions" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 55 }} />{itemCondition === "prepared" && <TextInput value={useByDate} onChangeText={setUseByDate} placeholder="Use-by / consumption date" placeholderTextColor={colors.muted} style={inputStyle} />}</View>}

          <TextInput value={expiryDate} onChangeText={setExpiryDate} placeholder="Offer expiry YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={inputStyle} />

          <View style={{ marginTop: 14, borderTopWidth: 0.5, borderColor: colors.border, paddingTop: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>Marketplace posting declarations *</Text>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>Policy version: {MARKETPLACE_LISTING_POLICY_VERSION}. Acceptance is recorded for audit and does not replace moderation.</Text>
            {ATTESTATIONS.map(({ key, label }) => <TouchableOpacity key={key} onPress={() => setAttestation((current) => ({ ...current, [key]: !current[key] }))} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}><View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: attestation[key] ? colors.primary : colors.border, backgroundColor: attestation[key] ? colors.primary : colors.background, alignItems: "center", justifyContent: "center", marginRight: 9 }}><Text style={{ color: "#fff", fontWeight: "800" }}>{attestation[key] ? "✓" : ""}</Text></View><Text style={{ color: colors.foreground, fontSize: 12, flex: 1 }}>{label}</Text></TouchableOpacity>)}
          </View>

          <TouchableOpacity disabled={createOffer.isPending || title.trim().length < 2 || !expiryDate.trim() || !category || selectedImages.length < 1 || !allAttested} onPress={() => void submitOffer()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 14, opacity: createOffer.isPending || title.trim().length < 2 || !expiryDate.trim() || !category || selectedImages.length < 1 || !allAttested ? 0.5 : 1 }}>{createOffer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Submit complete listing for moderation</Text>}</TouchableOpacity>
        </View>

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>My community offers</Text>
        {offersQuery.data?.map((offer) => <View key={offer.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text style={{ color: colors.foreground, fontWeight: "700" }}>{offer.title}</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{offer.status} • {offer.offerType.replace("_", " ")} • {offer.category || "legacy/unclassified"} • expires {new Date(offer.expiresAt).toLocaleDateString()}</Text>{Array.isArray(offer.imageUrls) && offer.imageUrls[0] ? <Image source={{ uri: offer.imageUrls[0] }} style={{ width: 88, height: 88, borderRadius: 10, marginTop: 8 }} /> : null}{(offer.status === "pending_review" || offer.status === "approved") && <TouchableOpacity onPress={() => void closeOffer.mutateAsync({ listingId: offer.id }).then(() => utils.p2p.myCommunityOffers.invalidate())} style={{ marginTop: 8 }}><Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>Close offer</Text></TouchableOpacity>}</View>)}

        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 0.5, borderColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Private parcel</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Addresses stay private. This request never appears in public Marketplace discovery.</Text>
          <TextInput value={pickupAddress} onChangeText={setPickupAddress} placeholder="Pickup address" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 60 }} />
          <TextInput value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Delivery address" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 60 }} />
          <TextInput value={packageDescription} onChangeText={setPackageDescription} placeholder="Package description" placeholderTextColor={colors.muted} multiline style={{ ...inputStyle, minHeight: 60 }} />
          <TextInput value={weightGrams} onChangeText={setWeightGrams} placeholder="Weight in grams" placeholderTextColor={colors.muted} keyboardType="number-pad" style={inputStyle} />
          <TouchableOpacity disabled={createParcel.isPending} onPress={() => void submitParcel()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12, opacity: createParcel.isPending ? 0.5 : 1 }}>{createParcel.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Initiate private parcel</Text>}</TouchableOpacity>
        </View>

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>My private parcels</Text>
        {parcelsQuery.data?.map((parcel) => <View key={parcel.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text style={{ color: colors.foreground, fontWeight: "700" }}>{parcel.requestUid}</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{parcel.status} • {parcel.weightGrams} g • {parcel.zone}</Text>{parcel.status === "initiated" && <TouchableOpacity onPress={() => void cancelParcel.mutateAsync({ requestId: parcel.id }).then(() => utils.p2p.myPrivateParcels.invalidate())} style={{ marginTop: 8 }}><Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>Cancel request</Text></TouchableOpacity>}</View>)}
      </ScrollView>
    </ScreenContainer>
  );
}
