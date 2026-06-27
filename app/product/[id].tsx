import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  MOCK_PRODUCTS,
  MOCK_MERCHANTS,
  DELIVERY_MODE_INFO,
  PRODUCT_CATEGORIES,
  type DeliveryMode,
  type DeliveryBadge,
} from "@/lib/marketplace-data";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<DeliveryMode | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [droneAccepted, setDroneAccepted] = useState(false);
  const [showDroneConditions, setShowDroneConditions] = useState(false);

  const product = MOCK_PRODUCTS.find((p) => p.id === Number(id));
  const merchant = product ? MOCK_MERCHANTS.find((m) => m.id === product.merchantId) : null;
  const category = product ? PRODUCT_CATEGORIES.find((c) => c.id === product.category) : null;

  if (!product || !merchant) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const availableBadges = product.deliveryBadges.filter((b) => b.available);
  const selectedBadge = availableBadges.find((b) => b.mode === selectedMode);
  const totalPrice = product.price * quantity + (selectedBadge?.estimatedCost || 0);

  function handleSelectDrone() {
    setShowDroneConditions(true);
  }

  function handleAcceptDroneConditions() {
    setDroneAccepted(true);
    setSelectedMode("drone");
    setShowDroneConditions(false);
  }

  function handleAddToCart() {
    if (!selectedMode) {
      Alert.alert("Select delivery mode", "Please choose a delivery mode before continuing.");
      return;
    }
    if (selectedMode === "drone" && !droneAccepted) {
      handleSelectDrone();
      return;
    }
    Alert.alert(
      "Added to cart ✓",
      `${product!.name} x${quantity}\nLivrare: ${DELIVERY_MODE_INFO[selectedMode].label}\nTotal: ₱${totalPrice}`,
      [
        { text: "Continue shopping", onPress: () => router.back() },
        { text: "View cart", onPress: () => router.push("/cart" as any) },
      ]
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 20, paddingTop: 12 }}
        >
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>

        {/* Product Image */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            height: 150,
            backgroundColor: colors.surface,
            marginHorizontal: 20,
            marginTop: 12,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 64 }}>{product.image}</Text>
        </View>

        {/* Product Info */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
            {product.name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>
            {product.description}
          </Text>

          {/* Merchant Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>{merchant.image}</Text>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                {merchant.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {merchant.type === "authorized" ? "✓ Comerciant Autorizat" :
                 merchant.type === "artisan" ? "🎨 Artizan" :
                 merchant.type === "community_seller" ? "🤝 Seller Comunitar" : "👤 P2P"}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>
                ⭐ {merchant.rating}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>{merchant.totalOrders} comenzi</Text>
            </View>
          </View>

          {/* Product Specs */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Weight</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{product.weight} kg</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Category</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{category?.icon} {category?.name}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Zone</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{product.zone}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary }}>
              {product.price > 0 ? `₱${product.price}` : "GRATUIT"}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginRight: 12 }}>
              Quantity:
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
                borderWidth: 0.5, borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, color: colors.foreground }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginHorizontal: 16 }}>
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
                borderWidth: 0.5, borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, color: colors.foreground }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Mode Selection */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              Select delivery mode
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>
              Badges indicate possible modes. Final method is decided by the platform.
            </Text>

            {product.deliveryBadges.map((badge) => {
              const modeInfo = DELIVERY_MODE_INFO[badge.mode];
              const isSelected = selectedMode === badge.mode;
              const isAvailable = badge.available;

              return (
                <TouchableOpacity
                  key={badge.mode}
                  onPress={() => {
                    if (!isAvailable) return;
                    if (badge.mode === "drone" && !droneAccepted) {
                      handleSelectDrone();
                    } else {
                      setSelectedMode(badge.mode);
                    }
                  }}
                  disabled={!isAvailable}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isSelected ? modeInfo.color + "15" : colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: isSelected ? 2 : 0.5,
                    borderColor: isSelected ? modeInfo.color : colors.border,
                    opacity: isAvailable ? 1 : 0.4,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 24 }}>{modeInfo.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: isAvailable ? colors.foreground : colors.muted }}>
                      {modeInfo.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {isAvailable ? modeInfo.description : "Unavailable pentru acest produs"}
                    </Text>
                  </View>
                  {isAvailable && (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: modeInfo.color }}>
                        {badge.estimatedTime}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        +₱{badge.estimatedCost}
                      </Text>
                    </View>
                  )}
                  {!isAvailable && (
                    <Text style={{ fontSize: 11, color: colors.error, fontWeight: "600" }}>✗</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Drone Conditions Modal */}
          {showDroneConditions && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                marginTop: 16,
                borderWidth: 2,
                borderColor: "#0066FF",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 12 }}>
                🚁 Drone Delivery Conditions
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 20, marginBottom: 8 }}>
                By selecting drone delivery, I accept the following conditions:
              </Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • The drone does NOT wait for the client at the reception point
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • The drone does NOT negotiate the delivery location
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • The drone does NOT repeat delivery if reception fails
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • Failed reception triggers fallback (ground delivery)
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • The reception point must be valid and accessible
                </Text>
                <Text style={{ fontSize: 12, color: colors.foreground }}>
                  • Final method may be changed by platform (weather, capacity)
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowDroneConditions(false)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 10,
                    backgroundColor: colors.background, alignItems: "center",
                    borderWidth: 0.5, borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAcceptDroneConditions}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 10,
                    backgroundColor: "#0066FF", alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Accept Conditionsle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingHorizontal: 20,
          paddingVertical: 16,
          paddingBottom: 34,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Total estimat</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>
            ₱{totalPrice}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingHorizontal: 24,
            paddingVertical: 14,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
            Add to cart
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
