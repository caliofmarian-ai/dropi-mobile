/**
 * New Product Screen
 * 
 * Allows merchants to create a new product with all required fields per
 * DROPi marketplace regulations.
 * 
 * API contract (product.create):
 * - name: string (2-300)
 * - description?: string
 * - price: number (positive)
 * - currency?: string (3 chars, default "RON")
 * - images?: string[]
 * - category: string (1-100)
 * - subcategory?: string
 * - weight: number (grams, positive)
 * - dimensions?: { l, w, h } (cm)
 * - stock?: number (int >= 0)
 * - zone: string (1-100)
 * - isFragile?: boolean
 * - requiresSpecialPackaging?: boolean
 * - cancellationPolicy?: any
 * 
 * Delivery modes are auto-calculated server-side from weight/dimensions.
 * Product is created as "draft" — must be submitted separately via product.submitForReview.
 */
import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";
import { MARKETPLACE_CATEGORY_POLICIES } from "@/shared/marketplace-policy";

// Drone eligibility thresholds (from canonical docs)
const DRONE_MAX_WEIGHT_G = 2000; // grams
const DRONE_MAX_DIM_CM = 30; // cm per side

export default function ProductNewScreen() {
  const router = useRouter();
  const createMutation = trpc.product.create.useMutation();
  const submitMutation = trpc.product.submitForReview.useMutation();
  const storeQuery = trpc.store.getMyStore.useQuery();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState(""); // grams
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [stock, setStock] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [requiresSpecialPackaging, setRequiresSpecialPackaging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-calculate drone eligibility preview (informational only)
  const weightNum = parseFloat(weight) || 0;
  const lNum = parseFloat(dimL) || 0;
  const wNum = parseFloat(dimW) || 0;
  const hNum = parseFloat(dimH) || 0;
  const hasDims = lNum > 0 && wNum > 0 && hNum > 0;
  const isDroneEligible = weightNum > 0 && weightNum <= DRONE_MAX_WEIGHT_G &&
    hasDims && lNum <= DRONE_MAX_DIM_CM && wNum <= DRONE_MAX_DIM_CM && hNum <= DRONE_MAX_DIM_CM;

  const handleSubmit = async (submitForReview: boolean) => {
    // Validation
    if (!name.trim()) { Alert.alert("Error", "Product name is required"); return; }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { Alert.alert("Error", "Valid price is required"); return; }
    if (!category) { Alert.alert("Error", "Please select a category"); return; }
    if (!weight.trim() || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) { Alert.alert("Error", "Weight (grams) is required"); return; }

    setSaving(true);
    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category,
        subcategory: subcategory.trim() || undefined,
        weight: parseFloat(weight),
        dimensions: hasDims ? { l: lNum, w: wNum, h: hNum } : undefined,
        stock: stock ? parseInt(stock) : undefined,
        isFragile,
        requiresSpecialPackaging,
      });

      // If user wants to submit for review immediately
      if (submitForReview && result.productId) {
        const modResult = await submitMutation.mutateAsync({ productId: result.productId });

        // Show auto-moderation feedback
        if (modResult.autoModerated && modResult.action === "approved") {
          Alert.alert(
            "✓ Auto-Approved!",
            "Your product passed all checks and has been automatically approved. It is now live in the marketplace.",
            [{ text: "Great!", onPress: () => safeGoBack(router) }]
          );
        } else if (modResult.autoModerated && modResult.action === "rejected") {
          Alert.alert(
            "⚠️ Auto-Rejected",
            `Your product was automatically rejected:\n\n${modResult.reason}\n\nPlease fix the issues and resubmit.`,
            [{ text: "OK", onPress: () => safeGoBack(router) }]
          );
        } else {
          // Pending manual review
          const warnings = modResult.violations?.length || 0;
          Alert.alert(
            "Submitted for Review",
            warnings > 0
              ? `Product submitted. ${warnings} warning(s) detected — our team will review within 24h.`
              : "Product submitted for review! Our team will check it within 24h.",
            [{ text: "OK", onPress: () => safeGoBack(router) }]
          );
        }
      } else {
        Alert.alert(
          "Saved",
          "Product saved as draft. You can edit and submit it for review later.",
          [{ text: "OK", onPress: () => safeGoBack(router) }]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">New Product</Text>
        </View>

        {/* Product Name */}
        <Text className="text-sm font-semibold text-foreground mb-2">Product Name *</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Organic Honey 500g"
          placeholderTextColor="#9BA1A6"
          returnKeyType="next"
        />

        {/* Description */}
        <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={description}
          onChangeText={setDescription}
          placeholder="Detailed product description..."
          placeholderTextColor="#9BA1A6"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />

        {/* Category */}
        <Text className="text-sm font-semibold text-foreground mb-2">Category *</Text>
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl px-4 py-3 mb-1"
          activeOpacity={0.7}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text className={category ? "text-foreground" : "text-muted"}>
            {category || "Select a category..."}
          </Text>
        </TouchableOpacity>
        {showCategories && (
          <View className="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
            {MARKETPLACE_CATEGORY_POLICIES.map((policy) => (
              <TouchableOpacity
                key={policy.id}
                className={`px-4 py-3 border-b border-border ${category === policy.label ? "bg-primary/10" : ""}`}
                onPress={() => { setCategory(policy.label); setShowCategories(false); }}
              >
                <Text className={`text-sm ${category === policy.label ? "text-primary font-semibold" : "text-foreground"}`}>{policy.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!showCategories && <View className="mb-3" />}

        {/* Subcategory */}
        <Text className="text-sm font-semibold text-foreground mb-2">Subcategory (optional)</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          value={subcategory}
          onChangeText={setSubcategory}
          placeholder="e.g., Organic, Imported"
          placeholderTextColor="#9BA1A6"
        />

        {/* Price, Stock, Zone */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground mb-2">Price (RON) *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground mb-2">Stock (units)</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={stock}
              onChangeText={setStock}
              placeholder="Optional"
              placeholderTextColor="#9BA1A6"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text className="text-sm font-semibold text-foreground mb-2">Listing Zone</Text>
        <View className="bg-surface border border-border rounded-xl px-4 py-3 mb-4">
          <Text className="text-foreground">{storeQuery.data?.zone || "Set the store operating zone first"}</Text>
          <Text className="text-xs text-muted mt-1">Product listings inherit the store zone and cannot override it.</Text>
        </View>

        {/* Weight & Dimensions */}
        <Text className="text-lg font-semibold text-foreground mb-3 mt-2">Physical Properties</Text>
        <Text className="text-xs text-muted mb-3">Required for delivery mode calculation and drone eligibility.</Text>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">Weight (grams) *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              placeholderTextColor="#9BA1A6"
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">Length (cm)</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={dimL}
              onChangeText={setDimL}
              placeholder="0"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">Width (cm)</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={dimW}
              onChangeText={setDimW}
              placeholder="0"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted mb-1">Height (cm)</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={dimH}
              onChangeText={setDimH}
              placeholder="0"
              placeholderTextColor="#9BA1A6"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Special Properties */}
        <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-2">
          <View>
            <Text className="text-sm text-foreground">Fragile Product</Text>
            <Text className="text-xs text-muted">Requires careful handling</Text>
          </View>
          <Switch value={isFragile} onValueChange={setIsFragile} />
        </View>
        <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 mb-4">
          <View>
            <Text className="text-sm text-foreground">Special Packaging</Text>
            <Text className="text-xs text-muted">Requires non-standard packaging</Text>
          </View>
          <Switch value={requiresSpecialPackaging} onValueChange={setRequiresSpecialPackaging} />
        </View>

        {/* Drone Eligibility Info (preview) */}
        <View className={`rounded-xl p-4 mb-6 ${isDroneEligible ? "bg-success/10 border border-success/30" : "bg-surface border border-border"}`}>
          <View className="flex-row items-center mb-1">
            <Text style={{ fontSize: 16, marginRight: 8 }}>{isDroneEligible ? "✅" : "ℹ️"}</Text>
            <Text className={`text-sm font-semibold ${isDroneEligible ? "text-success" : "text-foreground"}`}>
              {isDroneEligible ? "Drone Eligible" : "Drone Eligibility"}
            </Text>
          </View>
          <Text className="text-xs text-muted leading-relaxed">
            {isDroneEligible
              ? "This product meets all requirements for drone delivery: weight ≤ 2000g, all dimensions ≤ 30cm."
              : `Requirements: weight ≤ ${DRONE_MAX_WEIGHT_G}g, each dimension ≤ ${DRONE_MAX_DIM_CM}cm. Delivery modes are calculated automatically by the server.`}
          </Text>
        </View>

        {/* Marketplace Regulations Notice */}
        <View className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <Text className="text-sm font-semibold text-primary mb-1">Publication Rules</Text>
          <Text className="text-xs text-muted leading-relaxed">
            • Product must have accurate description and real photos{"\n"}
            • Price must include all taxes (final consumer price){"\n"}
            • Weight and dimensions must be accurate for delivery calculation{"\n"}
            • Prohibited items: weapons, drugs, counterfeit goods, hazardous materials{"\n"}
            • Products are reviewed within 24h before going live
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center"
            activeOpacity={0.8}
            onPress={() => handleSubmit(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-semibold text-base">Submit for Review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-2xl py-4 items-center"
            activeOpacity={0.7}
            onPress={() => handleSubmit(false)}
            disabled={saving}
          >
            <Text className="text-foreground font-semibold text-base">Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
