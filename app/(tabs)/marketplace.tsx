import { useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getRequiredApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { MARKETPLACE_CATEGORY_POLICIES } from "@/shared/marketplace-policy";

type MarketplaceProduct = {
  id: number;
  storeId: number;
  name: string;
  price: string | number;
  currency: string;
  category: string;
  weight: string | number;
  zone: string;
  deliveryModes: unknown;
};

function storageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRequiredApiBaseUrl("Marketplace media")}${path.startsWith("/") ? path : `/${path}`}`;
}

function ProductCard({ product, onPress }: { product: MarketplaceProduct; onPress: () => void }) {
  const colors = useColors();
  const modes = Array.isArray(product.deliveryModes) ? product.deliveryModes.filter((mode): mode is string => typeof mode === "string") : [];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 24 }}>📦</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>{product.name}</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{product.category}</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary, marginTop: 4 }}>
            {product.currency} {Number(product.price).toFixed(2)}
          </Text>
        </View>
      </View>
      {modes.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {modes.map((mode) => (
            <View key={mode} style={{ backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: colors.muted }}>{mode}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useDropiAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const zone = user?.zone?.trim() || "";

  const productsQuery = trpc.product.listActive.useQuery(
    { zone, category: selectedCategory || undefined, limit: 50, offset: 0 },
    { enabled: Boolean(zone) },
  );
  const communityQuery = trpc.p2p.publicCommunityOffers.useQuery(
    { zone, limit: 10, offset: 0 },
    { enabled: Boolean(zone) },
  );

  const products = (productsQuery.data?.products || []) as MarketplaceProduct[];
  const communityOffers = communityQuery.data?.offers || [];

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>Marketplace</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Controlled C1 public offer layer</Text>
        </View>

        {!zone ? (
          <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>Operating zone required</Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Set a C1 operating zone on your account before browsing Marketplace availability.</Text>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "10", borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 14 }}>📍</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginLeft: 6 }}>{zone}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>• {productsQuery.data?.total || 0} available products</Text>
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  style={{ backgroundColor: selectedCategory === null ? colors.primary : colors.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
                >
                  <Text style={{ color: selectedCategory === null ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>All</Text>
                </TouchableOpacity>
                {MARKETPLACE_CATEGORY_POLICIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(selectedCategory === category.label ? null : category.label)}
                    style={{ backgroundColor: selectedCategory === category.label ? colors.primary : colors.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }}
                  >
                    <Text style={{ color: selectedCategory === category.label ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 12, flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => router.push("/cart" as any)} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 0.5, borderColor: colors.border }}>
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>🛒 Cart</Text>
              </TouchableOpacity>
              {user?.dropiRole === "customer" && (
                <TouchableOpacity onPress={() => router.push("/p2p" as any)} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 0.5, borderColor: colors.border }}>
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>🤝 P2P</Text>
                </TouchableOpacity>
              )}
            </View>

            {communityOffers.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Community offers</Text>
                {communityOffers.map((offer) => (
                  <View key={offer.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: colors.border }}>
                    {offer.imagePaths?.[0] && (
                      <Image
                        source={{ uri: storageUrl(offer.imagePaths[0]) }}
                        style={{ width: "100%", height: 180, borderRadius: 10, backgroundColor: colors.background, marginBottom: 10 }}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={{ color: colors.foreground, fontWeight: "700" }}>{offer.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>
                      {offer.category || "Community"} • {offer.itemCondition || "condition not specified"} • {offer.offerType.replace("_", " ")} • expires {new Date(offer.expiresAt).toLocaleDateString()}
                    </Text>
                    {offer.description ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{offer.description}</Text> : null}
                    {offer.offerType === "fixed_price" && offer.fixedPrice != null && (
                      <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 6 }}>{offer.currency} {Number(offer.fixedPrice).toFixed(2)}</Text>
                    )}
                    {offer.foodSafety && (
                      <View style={{ marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.background }}>
                        <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 12 }}>Food / consumable safety information</Text>
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 5 }}>Ingredients / contents: {offer.foodSafety.ingredients}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Allergens: {offer.foodSafety.allergens}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Storage: {offer.foodSafety.storageInstructions}</Text>
                        {offer.foodSafety.useBy ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>Use by: {new Date(offer.foodSafety.useBy).toLocaleDateString()}</Text> : null}
                        <Text style={{ color: colors.muted, fontSize: 10, marginTop: 6 }}>This information is provided by the person posting the item and remains subject to DROPi moderation; it is not an independent safety certification.</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {productsQuery.isLoading ? (
              <ActivityIndicator style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
                renderItem={({ item }) => <ProductCard product={item} onPress={() => router.push(`/product/${item.id}` as any)} />}
                refreshing={productsQuery.isFetching}
                onRefresh={() => { void productsQuery.refetch(); void communityQuery.refetch(); }}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingTop: 40 }}>
                    <Text style={{ fontSize: 36 }}>🔍</Text>
                    <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>No eligible products are currently available in this zone.</Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
