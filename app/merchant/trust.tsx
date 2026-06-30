/**
 * Merchant Trust Dashboard — Sprint C
 * 
 * Displays:
 * - Trust Score gauge (0-100) with color coding
 * - Component breakdown (5 weighted factors)
 * - Current badge with explanation
 * - Elimination status/warning if applicable
 * - Badge history timeline
 * - Improvement tips (actionable)
 */

import { useState } from "react";
import { Text, View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { safeGoBack } from "@/lib/safe-back";

// Trust Score types (mirroring server)
interface TrustScoreComponents {
  postDeliveryRating: number;
  qualityVsDescription: number;
  orderCompletionRate: number;
  ruleCompliance: number;
  absenceOfComplaints: number;
}

interface TrustScoreResult {
  score: number;
  components: TrustScoreComponents;
  isValid: boolean;
  totalOrders: number;
  completedOrders: number;
  badge: "high_trust" | "new_activity" | "high_risk" | "restricted";
  eliminationLevel: 0 | 1 | 2 | 3 | 4;
  eliminationReason?: string;
}

interface BadgeHistoryItem {
  id: number;
  storeId: number;
  type: "high_trust" | "new_activity" | "high_risk" | "restricted";
  reason: string;
  isActive: boolean;
  issuedAt: Date;
  expiresAt: Date | null;
  overriddenBy: number | null;
  overrideReason: string | null;
}

interface ImprovementTip {
  priority: number;
  area: string;
  tip: string;
  impact: string;
}

const BADGE_CONFIG = {
  high_trust: { label: "Încredere Ridicată", color: "#22C55E", icon: "✓", bgColor: "#DCFCE7" },
  new_activity: { label: "Activitate Nouă", color: "#3B82F6", icon: "★", bgColor: "#DBEAFE" },
  high_risk: { label: "Risc Crescut", color: "#F59E0B", icon: "⚠", bgColor: "#FEF3C7" },
  restricted: { label: "Restricționat", color: "#EF4444", icon: "✕", bgColor: "#FEE2E2" },
};

const COMPONENT_LABELS: Record<keyof TrustScoreComponents, { label: string; weight: string }> = {
  postDeliveryRating: { label: "Evaluări post-livrare", weight: "35%" },
  qualityVsDescription: { label: "Calitate vs. Descriere", weight: "20%" },
  orderCompletionRate: { label: "Rata comenzi finalizate", weight: "20%" },
  ruleCompliance: { label: "Conformitate reguli", weight: "15%" },
  absenceOfComplaints: { label: "Absența reclamațiilor", weight: "10%" },
};

export default function MerchantTrustScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const trustQuery = trpc.trust.getMyTrustScore.useQuery();
  const historyQuery = trpc.trust.getMyBadgeHistory.useQuery();
  const tipsQuery = trpc.trust.getImprovementTips.useQuery();

  const trustData = (trustQuery.data as TrustScoreResult | null) ?? null;
  const badgeHistory = (historyQuery.data as BadgeHistoryItem[]) ?? [];
  const tips = (tipsQuery.data as ImprovementTip[]) ?? [];
  const loading = trustQuery.isLoading;

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([trustQuery.refetch(), historyQuery.refetch(), tipsQuery.refetch()])
      .finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading trust data...</Text>
      </ScreenContainer>
    );
  }

  const scoreColor = !trustData?.isValid ? colors.muted
    : trustData.score >= 80 ? "#22C55E"
    : trustData.score >= 60 ? "#3B82F6"
    : trustData.score >= 40 ? "#F59E0B"
    : "#EF4444";

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => safeGoBack(router)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
            <Text className="text-primary text-lg">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Trust Score</Text>
        </View>

        {/* Elimination Warning Banner */}
        {trustData && trustData.eliminationLevel > 0 && (
          <View className="bg-error/10 border border-error rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Text className="text-lg mr-2">⚠️</Text>
              <Text className="text-error font-bold text-base">
                {trustData.eliminationLevel === 1 && "Nivel 1 — Avertisment"}
                {trustData.eliminationLevel === 2 && "Nivel 2 — Vizibilitate Redusă"}
                {trustData.eliminationLevel === 3 && "Nivel 3 — Suspendare"}
                {trustData.eliminationLevel === 4 && "Nivel 4 — Eliminare"}
              </Text>
            </View>
            <Text className="text-error/80 text-sm">{trustData.eliminationReason}</Text>
            {trustData.eliminationLevel <= 2 && (
              <Text className="text-muted text-xs mt-2">
                Îmbunătățiți scorul de încredere pentru a reveni la normal. Consultați sfaturile de mai jos.
              </Text>
            )}
          </View>
        )}

        {/* Trust Score Gauge */}
        <View className="bg-surface rounded-2xl p-6 items-center mb-6 border border-border">
          <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: scoreColor, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 36, fontWeight: "bold", color: scoreColor }}>
              {trustData?.isValid ? trustData.score : "—"}
            </Text>
            <Text className="text-muted text-xs">/ 100</Text>
          </View>

          {!trustData?.isValid ? (
            <Text className="text-muted text-center text-sm">
              Scor inactiv — necesare minimum 3 comenzi completate
            </Text>
          ) : (
            <Text className="text-muted text-center text-sm">
              {trustData.completedOrders} comenzi completate din {trustData.totalOrders} total
            </Text>
          )}
        </View>

        {/* Current Badge */}
        {trustData && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-foreground font-semibold text-base mb-3">Badge Actual</Text>
            <View className="flex-row items-center" style={{ backgroundColor: BADGE_CONFIG[trustData.badge].bgColor, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{BADGE_CONFIG[trustData.badge].icon}</Text>
              <View className="flex-1">
                <Text style={{ color: BADGE_CONFIG[trustData.badge].color, fontWeight: "700", fontSize: 16 }}>
                  {BADGE_CONFIG[trustData.badge].label}
                </Text>
                <Text className="text-muted text-xs mt-1">
                  {trustData.badge === "high_trust" && "Scor ≥ 85, ≥ 20 comenzi, 0 reclamații în 90 zile"}
                  {trustData.badge === "new_activity" && "Mai puțin de 5 comenzi completate"}
                  {trustData.badge === "high_risk" && "Scor < 40 sau ≥ 3 reclamații validate"}
                  {trustData.badge === "restricted" && "Magazin suspendat — produse invizibile"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Component Breakdown */}
        {trustData?.isValid && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-foreground font-semibold text-base mb-4">Componente Scor</Text>
            {(Object.entries(trustData.components) as [keyof TrustScoreComponents, number][]).map(([key, value]) => {
              const config = COMPONENT_LABELS[key];
              const barColor = value >= 80 ? "#22C55E" : value >= 60 ? "#3B82F6" : value >= 40 ? "#F59E0B" : "#EF4444";
              return (
                <View key={key} className="mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-foreground text-sm">{config.label}</Text>
                    <Text className="text-muted text-xs">{value}/100 ({config.weight})</Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View style={{ width: `${value}%`, height: "100%", backgroundColor: barColor, borderRadius: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Improvement Tips */}
        {tips.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-foreground font-semibold text-base mb-3">Sfaturi de Îmbunătățire</Text>
            {tips.map((tip, idx) => (
              <View key={idx} className="flex-row mb-3">
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tip.impact === "high" ? "#FEE2E2" : "#FEF3C7", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: tip.impact === "high" ? "#EF4444" : "#F59E0B" }}>
                    {tip.priority}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm">{tip.tip}</Text>
                  <Text className="text-muted text-xs mt-1">
                    Impact: {tip.impact === "high" ? "Ridicat" : "Mediu"} • Zonă: {tip.area}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Badge History */}
        {badgeHistory.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-foreground font-semibold text-base mb-3">Istoric Badge-uri</Text>
            {badgeHistory.slice(0, 10).map((badge) => (
              <View key={badge.id} className="flex-row items-center py-2 border-b border-border">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BADGE_CONFIG[badge.type].color, marginRight: 10 }} />
                <View className="flex-1">
                  <Text className="text-foreground text-sm">{BADGE_CONFIG[badge.type].label}</Text>
                  <Text className="text-muted text-xs">{badge.reason}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-muted text-xs">
                    {badge.issuedAt instanceof Date ? badge.issuedAt.toLocaleDateString("ro-RO") : new Date(badge.issuedAt).toLocaleDateString("ro-RO")}
                  </Text>
                  {badge.isActive && (
                    <Text style={{ fontSize: 10, color: BADGE_CONFIG[badge.type].color, fontWeight: "600" }}>ACTIV</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-foreground font-semibold text-base mb-2">Despre Sistemul de Încredere</Text>
          <Text className="text-muted text-sm leading-relaxed">
            Scorul de încredere DROPi este un indicator informativ și preventiv, calculat automat pe baza a 5 componente ponderate. 
            Nu poate fi modificat manual și se actualizează la fiecare eveniment relevant (nouă evaluare, comandă completată, reclamație).
          </Text>
          <Text className="text-muted text-sm leading-relaxed mt-2">
            Badge-urile sunt atribuite automat și vizibile public pe cardurile produselor și pagina magazinului. 
            Un singur badge activ la un moment dat (cel cu prioritatea cea mai mare).
          </Text>
          <Text className="text-muted text-sm leading-relaxed mt-2">
            Prioritate: Restricționat {">"} Risc Crescut {">"} Activitate Nouă {">"} Încredere Ridicată
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
