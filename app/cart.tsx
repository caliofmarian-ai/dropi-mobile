import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  clearMarketplaceCart,
  removeMarketplaceCartItem,
  setMarketplaceCartQuantity,
  useMarketplaceCart,
} from "@/lib/marketplace-cart";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const cart = useMarketplaceCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const placeOrder = trpc.operations.placeOrder.useMutation();

  const first = cart.items[0];
  const oneCurrency = cart.items.every((item) => item.currency === first?.currency);
  const displaySubtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.unitPriceDisplay * item.quantity, 0),
    [cart.items],
  );

  async function handleCheckout() {
    if (!first || cart.items.length === 0) return;
    if (deliveryAddress.trim().length < 3) {
      Alert.alert("Delivery address required", "Enter the actual delivery address before placing the order.");
      return;
    }
    try {
      const result = await placeOrder.mutateAsync({
        storeId: first.storeId,
        zone: first.zone,
        deliveryAddress: deliveryAddress.trim(),
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      await clearMarketplaceCart();
      Alert.alert("Order placed", "The order is now INITIATED and waiting for merchant validation.", [
        { text: "View order", onPress: () => router.replace(`/order/${result.orderId}` as any) },
      ]);
    } catch (error) {
      Alert.alert("Order could not be placed", error instanceof Error ? error.message : "Checkout failed.");
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => safeGoBack(router)}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginLeft: 16 }}>Cart ({cart.items.length})</Text>
        </View>

        {!cart.hydrated ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : cart.items.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 40 }}>🛒</Text>
            <Text style={{ color: colors.foreground, fontWeight: "700", marginTop: 12 }}>Your cart is empty</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/marketplace" as any)} style={{ marginTop: 16 }}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              {cart.items.map((item) => (
                <View key={item.productId} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 26 }}>📦</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.primary, marginTop: 3 }}>{item.currency} {item.unitPriceDisplay.toFixed(2)} each</Text>
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 3 }}>Displayed price only; server revalidates price and stock at checkout.</Text>
                    </View>
                    <TouchableOpacity onPress={() => void removeMarketplaceCartItem(item.productId)}>
                      <Text style={{ fontSize: 18, color: colors.error }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                    <TouchableOpacity onPress={() => void setMarketplaceCartQuantity(item.productId, Math.max(0, item.quantity - 1))} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: colors.foreground, fontSize: 18 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16, marginHorizontal: 14 }}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => void setMarketplaceCartQuantity(item.productId, item.quantity + 1).catch((error) => Alert.alert("Quantity unavailable", error instanceof Error ? error.message : "Cannot update quantity."))}
                      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 18 }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Delivery address</Text>
              <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Enter the actual delivery address"
                placeholderTextColor={colors.muted}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 0.5, borderColor: colors.border, color: colors.foreground, padding: 14, minHeight: 90, textAlignVertical: "top" }}
              />
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>Marketplace initiates the request. DROPi validates availability and decides the final delivery execution method.</Text>
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Order summary</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Displayed product subtotal</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {oneCurrency && first ? `${first.currency} ${displaySubtotal.toFixed(2)}` : "Revalidated by server"}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 10 }}>No delivery fee or delivery time is invented in the cart. The canonical order service calculates authoritative product totals from current database values.</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cart.hydrated && cart.items.length > 0 && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 34 }}>
          <TouchableOpacity
            onPress={() => void handleCheckout()}
            disabled={placeOrder.isPending || deliveryAddress.trim().length < 3}
            style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: placeOrder.isPending || deliveryAddress.trim().length < 3 ? 0.5 : 1 }}
          >
            {placeOrder.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>Place order</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 8 }}>C1 checkout → canonical `operations.placeOrder`</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
