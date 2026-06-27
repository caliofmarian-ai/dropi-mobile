import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  PRODUCT_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_MERCHANTS,
  DELIVERY_MODE_INFO,
  type Product,
  type DeliveryBadge,
} from "@/lib/marketplace-data";

function DeliveryBadgeChip({ badge }: { badge: DeliveryBadge }) {
  const colors = useColors();
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

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const colors = useColors();
  const availableBadges = product.deliveryBadges.filter((b) => b.available);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 12,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 28 }}>{product.image}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
            {product.merchantName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
              {product.price > 0 ? `₱${product.price}` : "FREE"}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>
              {product.weight}kg
            </Text>
          </View>
        </View>
      </View>
      {/* Delivery Badges */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        {availableBadges.map((badge) => (
          <DeliveryBadgeChip key={badge.mode} badge={badge} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

function CategoryChip({ category, selected, onPress }: { category: typeof PRODUCT_CATEGORIES[0]; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: selected ? colors.primary : colors.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 0.5,
        borderColor: selected ? colors.primary : colors.border,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 14 }}>{category.icon}</Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: selected ? "#FFFFFF" : colors.foreground,
          marginLeft: 6,
        }}
      >
        {category.name}
      </Text>
      {category.droneEligible && (
        <Text style={{ fontSize: 10, marginLeft: 4 }}>🚁</Text>
      )}
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return p.inStock;
  });

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
            Marketplace
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            DROPi controlled Marketplace — Multimodal Delivery
          </Text>
        </View>

        {/* Zone Indicator */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.primary + "10",
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginLeft: 6 }}>
              Manila-Central Zone
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>
              • {MOCK_MERCHANTS.filter((m) => m.isOpen).length} merchants activi
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <CategoryChip
              category={{ id: "all", name: "All", icon: "🏪", droneEligible: false, maxWeightDrone: 0, description: "" }}
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {PRODUCT_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Delivery Mode Legend */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 10,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600", width: "100%", marginBottom: 4 }}>
              MODURI DE LIVRARE DISPONIBILE:
            </Text>
            {Object.entries(DELIVERY_MODE_INFO).map(([key, info]) => (
              <View key={key} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 2 }}>
                <Text style={{ fontSize: 11 }}>{info.icon}</Text>
                <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 3 }}>{info.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
                No products found in this category
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
