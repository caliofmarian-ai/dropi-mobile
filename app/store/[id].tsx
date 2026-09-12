import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDropiAuth } from "@/lib/auth-context";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import { safeGoBack } from "@/lib/safe-back";
import { trpc } from "@/lib/trpc";

type LiveStoreProduct = {
  id: number;
  storeId: number;
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  images: unknown;
  category: string;
  stock: number | null;
  deliveryModes: unknown;
};

function productModes(product: LiveStoreProduct): string[] {
  return Array.isArray(product.deliveryModes)
    ? product.deliveryModes.filter((mode): mode is string => typeof mode === "string")
    : [];
}

function DeliveryModeChip({ mode }: { mode: string }) {
  const info = DELIVERY_MODE_INFO[mode as keyof typeof DELIVERY_MODE_INFO];
  const label = info?.label || (mode === "terrestrial" ? "Terrestrial" : mode);
  const icon = info?.icon || (mode === "terrestrial" ? "🚚" : "•");
  const color = info?.color || "#6B7280";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: color + "15",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color, marginLeft: 4, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function firstProductImage(images: unknown): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useDropiAuth();
  const storeId = Number(id);
  const validStoreId = Number.isSafeInteger(storeId) && storeId > 0;
  const zone = user?.zone?.trim() || "";

  const storeQuery = trpc.store.getById.useQuery(
    { id: validStoreId ? storeId : 0, zone },
    { enabled: validStoreId && Boolean(zone) },
  );
  const productsQuery = trpc.product.listActive.useQuery(
    { storeId: validStoreId ? storeId : undefined, zone, limit: 50, offset: 0 },
    { enabled: validStoreId && Boolean(zone) },
  );

  const store = storeQuery.data;
  const products = (productsQuery.data?.products || []) as LiveStoreProduct[];
  const catalogModes = Array.from(new Set(products.flatMap(productModes)));

  if (!zone) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Operating zone required</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Set your C1 operating zone before opening a Marketplace store.
        </Text>
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (!validStoreId) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16 }}>Store not found</Text>
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (storeQuery.isLoading || productsQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 10 }}>Loading Marketplace store…</Text>
      </ScreenContainer>
    );
  }

  if (!store) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Store unavailable in this zone</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          This store is not active or is outside your current Marketplace operating zone.
        </Text>
        <TouchableOpacity onPress={() => safeGoBack(router)} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>← Back to Marketplace</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={storeQuery.isFetching || productsQuery.isFetching}
        onRefresh={() => {
          void storeQuery.refetch();
          void productsQuery.refetch();
        }}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => safeGoBack(router)} style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Back to Marketplace</Text>
            </TouchableOpacity>

            {store.coverImageUrl ? (
              <Image
                source={{ uri: store.coverImageUrl }}
                resizeMode="cover"
                style={{ height: 130, marginHorizontal: 20, marginTop: 12, borderRadius: 20, backgroundColor: colors.surface }}
              />
            ) : null}

            <View
              style={{
                marginHorizontal: 20,
                marginTop: 12,
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ fontSize: 30 }}>🏪</Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{store.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>{store.category}</Text>
                  <View style={{ alignSelf: "flex-start", marginTop: 7, backgroundColor: colors.success + "15", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 10, color: colors.success, fontWeight: "700" }}>ACTIVE MARKETPLACE STORE</Text>
                  </View>
                </View>
              </View>

              {store.description ? (
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 14, lineHeight: 19 }}>{store.description}</Text>
              ) : null}

              <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{store.trustScore}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Trust score</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{store.totalOrders}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Orders</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{store.totalReviews}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted }}>Reviews</Text>
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Zone</Text>
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600", marginTop: 2 }}>{store.zone}</Text>
              </View>
              {store.physicalAddress ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Pickup address</Text>
                  <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 2 }}>{store.physicalAddress}</Text>
                </View>
              ) : null}

              {catalogModes.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>Eligible modes across current catalog</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 3 }}>
                    Product eligibility only. DROPi confirms the final operational method later.
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                    {catalogModes.map((mode) => <DeliveryModeChip key={mode} mode={mode} />)}
                  </View>
                </View>
              )}
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                Available products ({productsQuery.data?.total ?? products.length})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const imageUrl = firstProductImage(item.images);
          const modes = productModes(item);
          return (
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
                    width: 54,
                    height: 54,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginTop: 5 }}>
                    {item.currency} {Number(item.price).toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>
                    {item.stock == null ? "Stock available" : `${item.stock} in stock`}
                  </Text>
                </View>
              </View>
              {modes.length > 0 && (
                <View style={{ marginTop: 9 }}>
                  <Text style={{ fontSize: 9, color: colors.muted, marginBottom: 5 }}>Possible delivery modes</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {modes.map((mode) => <DeliveryModeChip key={mode} mode={mode} />)}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center" }}>
              No approved, active products are currently available from this store in your zone.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
