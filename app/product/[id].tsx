import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { addMarketplaceCartItem } from "@/lib/marketplace-cart";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useDropiAuth();
  const [quantity, setQuantity] = useState(1);
  const zone = user?.zone?.trim() || "";
  const productId = Number(id);

  const productQuery = trpc.product.getById.useQuery(
    { id: Number.isSafeInteger(productId) ? productId : 0, zone },
    { enabled: Boolean(zone) && Number.isSafeInteger(productId) && productId > 0 },
  );
  const product = productQuery.data;
  const storeQuery = trpc.store.getById.useQuery(
    { id: product?.storeId || 0, zone },
    { enabled: Boolean(product?.storeId) && Boolean(zone) },
  );
  const store = storeQuery.data;

  const imageUrl = useMemo(() => {
    const images = product?.images;
    return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
  }, [product?.images]);
  const eligibleModes = useMemo(
    () => (product?.deliveryBadges || []).filter((badge) => badge.isEligible).map((badge) => badge.mode),
    [product?.deliveryBadges],
  );

  if (!zone) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Operating zone required</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>Set your C1 operating zone before opening a Marketplace product.</Text>
      </ScreenContainer>
    );
  }

  if (productQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator size="large" /></ScreenContainer>;
  }

  if (!product) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Product is not available in this zone.</Text>
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const unitPrice = Number(product.price);
  const displaySubtotal = unitPrice * quantity;
  const stock = product.stock == null ? null : Number(product.stock);

  async function handleAddToCart() {
    try {
      await addMarketplaceCartItem({
        productId: product!.id,
        storeId: product!.storeId,
        zone: product!.zone,
        name: product!.name,
        unitPriceDisplay: Number(product!.price),
        currency: product!.currency,
        quantity,
        stock,
      });
      Alert.alert("Added to cart", `${product!.name} × ${quantity}`, [
        { text: "Continue shopping", onPress: () => safeGoBack(router) },
        { text: "View cart", onPress: () => router.push("/cart" as any) },
      ]);
    } catch (error) {
      Alert.alert("Cannot add to cart", error instanceof Error ? error.message : "Cart update failed.");
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center", justifyContent: "center", height: 180, backgroundColor: colors.surface, marginHorizontal: 20, marginTop: 12, borderRadius: 20, overflow: "hidden" }}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
          ) : (
            <Text style={{ fontSize: 64 }}>📦</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>{product.name}</Text>
          {product.description ? <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>{product.description}</Text> : null}

          <View style={{ marginTop: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{store?.name || "Marketplace merchant"}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>
              {store ? `Trust score ${store.trustScore} • ${store.totalOrders} orders` : "Verified store information loading…"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Weight</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{(Number(product.weight) / 1000).toFixed(2)} kg</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Category</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>{product.category}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Zone</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>{product.zone}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary, marginTop: 20 }}>
            {product.currency} {unitPrice.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Product subtotal only. Delivery price/time is not promised by Marketplace.</Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginRight: 12 }}>Quantity</Text>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 18, color: colors.foreground }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginHorizontal: 16 }}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity((current) => stock == null ? current + 1 : Math.min(stock, current + 1))}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 18, color: colors.foreground }}>+</Text>
            </TouchableOpacity>
            {stock != null && <Text style={{ marginLeft: 12, color: colors.muted, fontSize: 11 }}>{stock} available</Text>}
          </View>

          <View style={{ marginTop: 22 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>Eligible delivery modes</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4, marginBottom: 8 }}>Informational eligibility only. DROPi decides the final execution method.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {eligibleModes.map((mode) => (
                <View key={mode} style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{mode}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 34, flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted }}>Displayed product subtotal</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{product.currency} {displaySubtotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={() => void handleAddToCart()} style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }} activeOpacity={0.8}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Add to cart</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
