import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  MOCK_MERCHANTS,
  MOCK_PRODUCTS,
  DELIVERY_MODE_INFO,
  type Product,
  type DeliveryBadge,
} from "@/lib/marketplace-data";

function DeliveryBadgeChip({ badge }: { badge: DeliveryBadge }) {
  const modeInfo = DELIVERY_MODE_INFO[badge.mode];
  if (!badge.available) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: modeInfo.color + "15",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      <Text style={{ fontSize: 10 }}>{modeInfo.icon}</Text>
      <Text style={{ fontSize: 10, color: modeInfo.color, marginLeft: 3, fontWeight: "600" }}>
        {modeInfo.label}
      </Text>
    </View>
  );
}

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  const merchant = MOCK_MERCHANTS.find((m) => m.id === Number(id));
  const products = MOCK_PRODUCTS.filter((p) => p.merchantId === Number(id));

  if (!merchant) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Store not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const trustBadgeLabel = {
    verified: "✓ Verificat",
    trusted: "★ Trusted",
    new: "🆕 Nou",
    community: "🤝 Comunitar",
  };

  return (
    <ScreenContainer>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <View>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 20, paddingTop: 12 }}
            >
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back la Marketplace</Text>
            </TouchableOpacity>

            {/* Merchant Header */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 12,
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 48 }}>{merchant.image}</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 10 }}>
                {merchant.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                {merchant.description}
              </Text>

              {/* Trust Badge */}
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: colors.primary + "15",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                  {trustBadgeLabel[merchant.trustBadge]}
                </Text>
              </View>

              {/* Stats */}
              <View style={{ flexDirection: "row", marginTop: 14, gap: 20 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>⭐ {merchant.rating}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Rating</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{merchant.totalOrders}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Comenzi</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: merchant.isOpen ? "#10B981" : colors.error }}>
                    {merchant.isOpen ? "OPEN" : "CLOSED"}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Status</Text>
                </View>
              </View>

              {/* Delivery Modes */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
                {merchant.deliveryModes.map((mode) => {
                  const info = DELIVERY_MODE_INFO[mode];
                  return (
                    <View
                      key={mode}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: info.color + "15",
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        margin: 3,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{info.icon}</Text>
                      <Text style={{ fontSize: 11, color: info.color, fontWeight: "600", marginLeft: 4 }}>
                        {info.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Merchant Type */}
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 10 }}>
                Tip: {merchant.type === "authorized" ? "Comerciant Autorizat B2C" :
                      merchant.type === "artisan" ? "Artizan Independent" :
                      merchant.type === "community_seller" ? "Seller Comunitar (Neautorizat)" : "P2P"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                Zone: {merchant.zone}
              </Text>
            </View>

            {/* Products Header */}
            <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                Products ({products.length})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }: { item: Product }) => (
          <TouchableOpacity
            onPress={() => router.push(`/product/${item.id}` as any)}
            style={{
              marginHorizontal: 20,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row" }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.image}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginTop: 4 }}>
                  {item.price > 0 ? `₱${item.price}` : "GRATUIT"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
              {item.deliveryBadges.filter((b) => b.available).map((badge) => (
                <DeliveryBadgeChip key={badge.mode} badge={badge} />
              ))}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
              Niciun produs disponibil momentan
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
