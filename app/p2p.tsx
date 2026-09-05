import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ScreenContainer } from "@/components/screen-container";
import { getRequiredApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";
import {
  MARKETPLACE_CATEGORY_POLICIES,
  MARKETPLACE_ITEM_CONDITIONS,
  MARKETPLACE_LISTING_POLICY_VERSION,
  MARKETPLACE_POSTING_RULES,
  isMarketplaceFoodCategory,
  type MarketplaceItemCondition,
  type MarketplacePosterAttestation,
} from "@/shared/marketplace-policy";

type OfferType = "donation" | "free_transfer" | "fixed_price";
type UploadedPhoto = { path: string; previewUri: string };

const EMPTY_ATTESTATION: MarketplacePosterAttestation = {
  rulesAccepted: false,
  truthfulListing: false,
  authorizedToOffer: false,
  notProhibitedOrRestricted: false,
  moderationAccepted: false,
};

const ATTESTATION_LABELS: Array<[keyof MarketplacePosterAttestation, string]> = [
  ["rulesAccepted", "I have read and accept the applicable DROPi Marketplace posting rules."],
  ["truthfulListing", "The listing, description and photos are truthful and represent the actual item."],
  ["authorizedToOffer", "I own this item or I am authorized to offer it."],
  ["notProhibitedOrRestricted", "To the best of my knowledge, this item is not prohibited or restricted under the applicable rules."],
  ["moderationAccepted", "I understand DROPi moderation may reject, remove or close this listing."],
];

function absoluteStorageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRequiredApiBaseUrl("P2P media")}${path.startsWith("/") ? path : `/${path}`}`;
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
  const [itemCondition, setItemCondition] = useState<MarketplaceItemCondition | "">("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [attestation, setAttestation] = useState<MarketplacePosterAttestation>({ ...EMPTY_ATTESTATION });
  const [foodIngredients, setFoodIngredients] = useState("");
  const [foodAllergens, setFoodAllergens] = useState("");
  const [foodStorage, setFoodStorage] = useState("");
  const [foodUseBy, setFoodUseBy] = useState("");

  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [weightGrams, setWeightGrams] = useState("");

  const offersQuery = trpc.p2p.myCommunityOffers.useQuery(undefined, { enabled: user?.dropiRole === "customer" });
  const parcelsQuery = trpc.p2p.myPrivateParcels.useQuery(undefined, { enabled: user?.dropiRole === "customer" });
  const requestImageUpload = trpc.p2p.requestCommunityOfferImageUpload.useMutation();
  const createOffer = trpc.p2p.createCommunityOffer.useMutation();
  const closeOffer = trpc.p2p.closeCommunityOffer.useMutation();
  const createParcel = trpc.p2p.createPrivateParcel.useMutation();
  const cancelParcel = trpc.p2p.cancelPrivateParcel.useMutation();

  const isFood = Boolean(category && isMarketplaceFoodCategory(category));
  const allDeclarationsAccepted = Object.values(attestation).every(Boolean);
  const governanceReady = Boolean(category && itemCondition && photos.length > 0 && allDeclarationsAccepted);

  async function processPickedImage(uri: string) {
    if (photos.length >= 5) return Alert.alert("Photo limit", "A community offer may contain up to 5 item photos.");
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );
      const localResponse = await fetch(manipulated.uri);
      const blob = await localResponse.blob();
      if (!blob.size || blob.size > 5 * 1024 * 1024) {
        return Alert.alert("Photo too large", "Please choose a photo smaller than 5 MB after processing.");
      }
      const upload = await requestImageUpload.mutateAsync({
        contentType: "image/jpeg",
        fileSize: blob.size,
      });
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error(`Photo upload failed (${uploadResponse.status}).`);
      setPhotos((current) => [...current, { path: upload.publicPath, previewUri: manipulated.uri }]);
    } catch (error) {
      Alert.alert("Photo could not be added", error instanceof Error ? error.message : "Upload failed.");
    }
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) await processPickedImage(result.assets[0].uri);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to take a real item photo.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) await processPickedImage(result.assets[0].uri);
  }

  function resetOfferForm() {
    setTitle("");
    setDescription("");
    setFixedPrice("");
    setExpiryDate("");
    setOfferType("donation");
    setCategory("");
    setItemCondition("");
    setPhotos([]);
    setAttestation({ ...EMPTY_ATTESTATION });
    setFoodIngredients("");
    setFoodAllergens("");
    setFoodStorage("");
    setFoodUseBy("");
  }

  async function submitOffer() {
    if (!zone) return Alert.alert("Operating zone required");
    if (!governanceReady) return Alert.alert("Listing incomplete", "Add a real item photo, category, condition and accept every required Marketplace declaration.");
    const expiresAt = new Date(`${expiryDate.trim()}T23:59:59`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim()) || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return Alert.alert("Invalid expiry", "Use a future date in YYYY-MM-DD format. A calendar picker will replace this field in the next P2P UX update.");
    }
    const price = offerType === "fixed_price" ? Number(fixedPrice) : undefined;
    if (offerType === "fixed_price" && (!Number.isFinite(price) || price! <= 0)) {
      return Alert.alert("Price required", "Enter a positive fixed price.");
    }

    let foodSafety: { ingredients: string; allergens: string; storageInstructions: string; useBy?: Date } | undefined;
    if (isFood) {
      if (foodIngredients.trim().length < 2 || foodAllergens.trim().length < 2 || foodStorage.trim().length < 2) {
        return Alert.alert("Food safety information required", "Provide ingredients/contents, allergens and storage instructions.");
      }
      let useBy: Date | undefined;
      if (foodUseBy.trim()) {
        useBy = new Date(`${foodUseBy.trim()}T23:59:59`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(foodUseBy.trim()) || Number.isNaN(useBy.getTime()) || useBy <= new Date()) {
          return Alert.alert("Invalid use-by date", "Food use-by date must be a future YYYY-MM-DD date.");
        }
      }
      if (itemCondition === "prepared" && !useBy) {
        return Alert.alert("Use-by date required", "Prepared food must include a future use-by date.");
      }
      foodSafety = {
        ingredients: foodIngredients.trim(),
        allergens: foodAllergens.trim(),
        storageInstructions: foodStorage.trim(),
        useBy,
      };
    }

    try {
      await createOffer.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        itemCondition: itemCondition as MarketplaceItemCondition,
        imagePaths: photos.map((photo) => photo.path),
        policyVersion: MARKETPLACE_LISTING_POLICY_VERSION,
        posterDeclarations: attestation,
        foodSafety,
        offerType,
        fixedPrice: price,
        expiresAt,
        zone,
      });
      resetOfferForm();
      await utils.p2p.myCommunityOffers.invalidate();
      Alert.alert("Submitted for moderation", "The item is not public until a moderator reviews the photos, category and declarations.");
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
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Maximum 3 active offers. A physical item needs real photos, classification, current policy acceptance and moderation before it can become public.</Text>

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 14 }}>Offer type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {(["donation", "free_transfer", "fixed_price"] as OfferType[]).map((type) => (
              <TouchableOpacity key={type} onPress={() => setOfferType(type)} style={{ backgroundColor: offerType === type ? colors.primary : colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, marginBottom: 6 }}>
                <Text style={{ color: offerType === type ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{type.replace("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput value={title} onChangeText={setTitle} placeholder="Offer title" placeholderTextColor={colors.muted} style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8, minHeight: 70, textAlignVertical: "top" }} />

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 14 }}>Marketplace category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {MARKETPLACE_CATEGORY_POLICIES.map((entry) => (
              <TouchableOpacity key={entry.id} onPress={() => setCategory(entry.label)} style={{ backgroundColor: category === entry.label ? colors.primary : colors.background, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, marginRight: 5, marginBottom: 6 }}>
                <Text style={{ color: category === entry.label ? "#fff" : colors.foreground, fontSize: 10, fontWeight: "600" }}>{entry.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 8 }}>Item condition</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {MARKETPLACE_ITEM_CONDITIONS.map((entry) => (
              <TouchableOpacity key={entry.id} onPress={() => setItemCondition(entry.id)} style={{ backgroundColor: itemCondition === entry.id ? colors.primary : colors.background, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, marginRight: 5, marginBottom: 6 }}>
                <Text style={{ color: itemCondition === entry.id ? "#fff" : colors.foreground, fontSize: 10, fontWeight: "600" }}>{entry.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 10 }}>Real item photos · {photos.length}/5</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>At least one photo is required. Images are reprocessed before upload to reduce unnecessary original metadata.</Text>
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity disabled={requestImageUpload.isPending || photos.length >= 5} onPress={() => void takePhoto()} style={{ flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 10, marginRight: 6, opacity: requestImageUpload.isPending || photos.length >= 5 ? 0.5 : 1 }}>
              <Text style={{ color: colors.foreground, textAlign: "center", fontWeight: "600", fontSize: 11 }}>📷 Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={requestImageUpload.isPending || photos.length >= 5} onPress={() => void choosePhoto()} style={{ flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 10, opacity: requestImageUpload.isPending || photos.length >= 5 ? 0.5 : 1 }}>
              <Text style={{ color: colors.foreground, textAlign: "center", fontWeight: "600", fontSize: 11 }}>🖼 Choose from gallery</Text>
            </TouchableOpacity>
          </View>
          {requestImageUpload.isPending && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
          {photos.length > 0 && (
            <ScrollView horizontal style={{ marginTop: 10 }}>
              {photos.map((photo, index) => (
                <View key={photo.path} style={{ marginRight: 8 }}>
                  <Image source={{ uri: photo.previewUri }} style={{ width: 92, height: 92, borderRadius: 10, backgroundColor: colors.background }} />
                  <TouchableOpacity onPress={() => setPhotos((current) => current.filter((_, i) => i !== index))} style={{ marginTop: 4 }}>
                    <Text style={{ color: colors.error, fontSize: 11, textAlign: "center" }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {isFood && (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}>
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>Food / consumable safety information</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>These are your declarations for moderation and for the future recipient. DROPi does not treat completion of this form as independent safety verification.</Text>
              <TextInput value={foodIngredients} onChangeText={setFoodIngredients} placeholder="Ingredients / contents" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 9, padding: 10, marginTop: 8, minHeight: 58 }} />
              <TextInput value={foodAllergens} onChangeText={setFoodAllergens} placeholder='Allergens (or "none known")' placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 9, padding: 10, marginTop: 7, minHeight: 58 }} />
              <TextInput value={foodStorage} onChangeText={setFoodStorage} placeholder="Storage instructions" placeholderTextColor={colors.muted} multiline style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 9, padding: 10, marginTop: 7, minHeight: 58 }} />
              <TextInput value={foodUseBy} onChangeText={setFoodUseBy} placeholder={itemCondition === "prepared" ? "Use-by date YYYY-MM-DD (required)" : "Use-by / best-before YYYY-MM-DD (if applicable)"} placeholderTextColor={colors.muted} autoCapitalize="none" style={{ backgroundColor: colors.surface, color: colors.foreground, borderRadius: 9, padding: 10, marginTop: 7 }} />
            </View>
          )}

          {offerType === "fixed_price" && <TextInput value={fixedPrice} onChangeText={setFixedPrice} placeholder="Fixed price" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 10 }} />}
          <TextInput value={expiryDate} onChangeText={setExpiryDate} placeholder="Expiry date YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={{ backgroundColor: colors.background, color: colors.foreground, borderRadius: 10, padding: 12, marginTop: 8 }} />

          <View style={{ marginTop: 14, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: "800" }}>Marketplace posting rules</Text>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>Policy version {MARKETPLACE_LISTING_POLICY_VERSION}</Text>
            {MARKETPLACE_POSTING_RULES.map((rule) => <Text key={rule} style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>• {rule}</Text>)}
            {ATTESTATION_LABELS.map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setAttestation((current) => ({ ...current, [key]: !current[key] }))} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}>
                <View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: attestation[key] ? colors.primary : colors.border, backgroundColor: attestation[key] ? colors.primary : colors.background, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>{attestation[key] ? "✓" : ""}</Text>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 11, flex: 1 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity disabled={createOffer.isPending || title.trim().length < 2 || !expiryDate.trim() || !governanceReady} onPress={() => void submitOffer()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12, opacity: createOffer.isPending || title.trim().length < 2 || !expiryDate.trim() || !governanceReady ? 0.5 : 1 }}>
            {createOffer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Submit complete listing for moderation</Text>}
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 18, marginBottom: 6 }}>My community offers</Text>
        {offersQuery.data?.map((offer) => (
          <View key={offer.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            {offer.imagePaths?.[0] ? <Image source={{ uri: absoluteStorageUrl(offer.imagePaths[0]) }} style={{ width: "100%", height: 150, borderRadius: 10, backgroundColor: colors.background, marginBottom: 8 }} resizeMode="cover" /> : null}
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{offer.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{offer.status} • {offer.offerType.replace("_", " ")} • {offer.category || "legacy / unclassified"} • expires {new Date(offer.expiresAt).toLocaleDateString()}</Text>
            {!offer.policyVersion && <Text style={{ color: colors.error, fontSize: 10, marginTop: 5 }}>Legacy incomplete listing — cannot be approved under the current Marketplace policy.</Text>}
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
