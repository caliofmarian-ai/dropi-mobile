import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { DELIVERY_MODE_INFO, type DeliveryMode } from "@/lib/marketplace-data";

// Simulated cart items (in a real app this would be a global store)
interface CartItemDisplay {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  merchantName: string;
  deliveryMode: DeliveryMode;
  deliveryCost: number;
  estimatedTime: string;
  weight: number;
}

const DEMO_CART: CartItemDisplay[] = [
  {
    id: 1, name: "Chicken Adobo Family Pack", image: "🍗", price: 350, quantity: 1,
    merchantName: "Juan's Kitchen", deliveryMode: "drone", deliveryCost: 85,
    estimatedTime: "8-15 min", weight: 1.2,
  },
  {
    id: 4, name: "Vitamin C 1000mg", image: "💊", price: 180, quantity: 2,
    merchantName: "Fresh Pharmacy", deliveryMode: "ebike", deliveryCost: 45,
    estimatedTime: "15-25 min", weight: 0.1,
  },
  {
    id: 12, name: "Express Document Envelope", image: "📄", price: 95, quantity: 1,
    merchantName: "DocuSend Manila", deliveryMode: "drone", deliveryCost: 85,
    estimatedTime: "8-15 min", weight: 0.1,
  },
];

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const [cart, setCart] = useState(DEMO_CART);
  const [receptionPoint, setReceptionPoint] = useState<string>("personal");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryTotal = cart.reduce((sum, item) => sum + item.deliveryCost, 0);
  const total = subtotal + deliveryTotal;

  const receptionOptions = [
    { id: "personal", label: "Personal handoff", icon: "🤝", description: "Client picks up the package personally" },
    { id: "door", label: "At the door", icon: "🚪", description: "Left at the front door" },
    { id: "gate", label: "At the gate", icon: "🏠", description: "Left at the gate" },
    { id: "yard", label: "In the yard", icon: "🌳", description: "Left in the yard (risk accepted)" },
    { id: "droneport", label: "DronePort Pickup", icon: "🏗️", description: "Ridicare de la DronePort-ul cel mai apropiat" },
  ];

  function handleCheckout() {
    Alert.alert(
      "Confirm Order",
      `Total: ₱${total}\nReception: ${receptionOptions.find(r => r.id === receptionPoint)?.label}\n\nOrder will be validated by the platform. Final delivery method is decided by DROPi.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: () => {
            Alert.alert(
              "Order Placed ✓",
              "Your order has been sent for validation.\n\nFlow: Marketplace → Request → Application → Decision → Delivery\n\nYou will receive notifications about order status.",
              [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
            );
          },
        },
      ]
    );
  }

  function removeItem(itemId: number) {
    setCart(cart.filter((item) => item.id !== itemId));
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginLeft: 16 }}>
            Cart ({cart.length})
          </Text>
        </View>

        {/* Cart Items */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          {cart.map((item) => {
            const modeInfo = DELIVERY_MODE_INFO[item.deliveryMode];
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 28 }}>{item.image}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{item.merchantName}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                        ₱{item.price} × {item.quantity}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Text style={{ fontSize: 18, color: colors.error }}>✕</Text>
                  </TouchableOpacity>
                </View>
                {/* Delivery mode badge */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: modeInfo.color + "15",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>{modeInfo.icon}</Text>
                    <Text style={{ fontSize: 11, color: modeInfo.color, fontWeight: "600", marginLeft: 4 }}>
                      {modeInfo.label}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 8 }}>
                      {item.estimatedTime} • +₱{item.deliveryCost}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Reception Point Selection */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Reception point
          </Text>
          {receptionOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setReceptionPoint(option.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: receptionPoint === option.id ? colors.primary + "10" : colors.surface,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: receptionPoint === option.id ? 1.5 : 0.5,
                borderColor: receptionPoint === option.id ? colors.primary : colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>{option.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                  {option.label}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{option.description}</Text>
              </View>
              {receptionPoint === option.id && (
                <Text style={{ fontSize: 16, color: colors.primary }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Canonical Notice */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#F59E0B",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E", marginBottom: 4 }}>
              ⚠️ Canonical Notice
            </Text>
            <Text style={{ fontSize: 11, color: "#92400E", lineHeight: 18 }}>
              • Delivery badges are informational, not guarantees{"\n"}
              • Final delivery method is decided exclusively by the platform{"\n"}
              • Marketplace initiates the request, app validates and orchestrates{"\n"}
              • Displayed costs are estimates subject to final validation{"\n"}
              • Passive reception options (door/gate/yard) = risk accepted by client
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              Order Summary
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Subtotal produse</Text>
              <Text style={{ fontSize: 13, color: colors.foreground }}>₱{subtotal}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Cost livrare (estimat)</Text>
              <Text style={{ fontSize: 13, color: colors.foreground }}>₱{deliveryTotal}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>Total</Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>₱{total}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
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
        }}
      >
        <TouchableOpacity
          onPress={handleCheckout}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>
            Place Order — ₱{total}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 8 }}>
          Canonical flow: Client → Marketplace → Request → Application → Decision → Delivery
        </Text>
      </View>
    </ScreenContainer>
  );
}
