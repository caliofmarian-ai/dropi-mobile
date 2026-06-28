/**
 * Store Setup Screen
 * 
 * Allows merchants to create or edit their store.
 * Two modes: internal (products hosted in DROPi) or external (redirect + API key).
 */
import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

type StoreType = "internal" | "external";

export default function StoreSetupScreen() {
  const router = useRouter();
  const { user } = useDropiAuth();

  // Fetch existing store (if editing)
  const storeQuery = trpc.store.getMyStore.useQuery();
  const createMutation = trpc.store.create.useMutation();
  const updateMutation = trpc.store.update.useMutation();

  const isEditing = !!storeQuery.data;
  const store = storeQuery.data;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [storeType, setStoreType] = useState<StoreType>("internal");
  const [externalUrl, setExternalUrl] = useState("");
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setDescription(store.description || "");
      setStoreType(store.type as StoreType || "internal");
      setExternalUrl(store.externalUrl || "");
      setZone(store.zone || "");
      setCategory(store.category || "");
      setPhone(store.contactPhone || "");
      setAddress(store.physicalAddress || "");
    }
  }, [store]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Store name is required");
      return;
    }
    if (storeType === "external" && !externalUrl.trim()) {
      Alert.alert("Error", "External URL is required for external stores");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type: storeType,
        externalUrl: storeType === "external" ? externalUrl.trim() : undefined,
        zone: zone.trim() || "default",
        category: category.trim() || "general",
        contactPhone: phone.trim() || undefined,
        physicalAddress: address.trim() || undefined,
      };

      if (isEditing && store) {
        // update identifies store from ctx.user, no storeId needed
        const { type: _type, ...updatePayload } = payload;
        await updateMutation.mutateAsync(updatePayload);
      } else {
        await createMutation.mutateAsync(payload as any);
      }

      Alert.alert("Success", isEditing ? "Store updated!" : "Store created! It will be reviewed by our team.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save store");
    } finally {
      setSaving(false);
    }
  };

  if (storeQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">{isEditing ? "Edit Store" : "Create Store"}</Text>
        </View>

        {/* Store Type Selection */}
        <Text className="text-sm font-semibold text-foreground mb-2">Store Type</Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className={`flex-1 border rounded-xl p-4 ${storeType === "internal" ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
            activeOpacity={0.7}
            onPress={() => setStoreType("internal")}
            disabled={isEditing}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🏪</Text>
            <Text className={`text-sm font-semibold ${storeType === "internal" ? "text-primary" : "text-foreground"}`}>Internal Store</Text>
            <Text className="text-xs text-muted mt-1">Publish products directly in DROPi marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 border rounded-xl p-4 ${storeType === "external" ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
            activeOpacity={0.7}
            onPress={() => setStoreType("external")}
            disabled={isEditing}
          >
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🌐</Text>
            <Text className={`text-sm font-semibold ${storeType === "external" ? "text-primary" : "text-foreground"}`}>External Store</Text>
            <Text className="text-xs text-muted mt-1">Link your existing shop + use DROPi Logistic API</Text>
          </TouchableOpacity>
        </View>
        {isEditing && (
          <Text className="text-xs text-muted mb-4 -mt-4">Store type cannot be changed after creation.</Text>
        )}

        {/* Store Name */}
        <Text className="text-sm font-semibold text-foreground mb-2">Store Name *</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Fresh Market Romania"
          placeholderTextColor="#9BA1A6"
          returnKeyType="next"
        />

        {/* Description */}
        <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell customers what you offer..."
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {/* External URL (only for external stores) */}
        {storeType === "external" && (
          <>
            <Text className="text-sm font-semibold text-foreground mb-2">External Store URL *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              value={externalUrl}
              onChangeText={setExternalUrl}
              placeholder="https://your-store.com"
              placeholderTextColor="#9BA1A6"
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </>
        )}

        {/* Zone */}
        <Text className="text-sm font-semibold text-foreground mb-2">Operating Zone</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={zone}
          onChangeText={setZone}
          placeholder="e.g., Bucharest, Cluj-Napoca"
          placeholderTextColor="#9BA1A6"
          returnKeyType="next"
        />

        {/* Category */}
        <Text className="text-sm font-semibold text-foreground mb-2">Store Category</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={category}
          onChangeText={setCategory}
          placeholder="e.g., Food & Groceries, Electronics"
          placeholderTextColor="#9BA1A6"
          returnKeyType="next"
        />

        {/* Phone */}
        <Text className="text-sm font-semibold text-foreground mb-2">Contact Phone</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={phone}
          onChangeText={setPhone}
          placeholder="+40 7XX XXX XXX"
          placeholderTextColor="#9BA1A6"
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        {/* Address */}
        <Text className="text-sm font-semibold text-foreground mb-2">Store Address</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={address}
          onChangeText={setAddress}
          placeholder="Physical address (for pickup)"
          placeholderTextColor="#9BA1A6"
          returnKeyType="done"
        />

        {/* Info Box */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <Text className="text-sm font-semibold text-primary mb-1">
            {storeType === "internal" ? "How Internal Stores Work" : "How External Stores Work"}
          </Text>
          <Text className="text-xs text-muted leading-relaxed">
            {storeType === "internal"
              ? "You publish products directly in the DROPi marketplace. Customers order through DROPi, and deliveries are handled by our fleet. You manage inventory, pricing, and product descriptions from your dashboard."
              : "Your store page in DROPi links to your external website. Customers on your site can choose 'Deliver with DROPi' at checkout via our Logistic API widget. You'll receive an API key after approval to integrate delivery requests."}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-background font-semibold text-base">
              {isEditing ? "Save Changes" : "Create Store"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Regulations Notice */}
        <View className="mt-4 p-3 bg-surface rounded-xl">
          <Text className="text-xs text-muted text-center leading-relaxed">
            By creating a store, you agree to the DROPi Marketplace Regulations including product quality standards, delivery compatibility requirements, and the controlled marketplace policies.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
