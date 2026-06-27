import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

type PermitType = "flight_zone" | "altitude" | "night_ops" | "cargo" | "emergency" | "vehicle_ops" | "multimodal_route" | "hazmat_transport";

interface RegulatoryPermit {
  id: string;
  type: PermitType;
  authority: string;
  status: "approved" | "pending" | "expired" | "rejected";
  zone: string;
  validFrom: string;
  validUntil: string;
  conditions: string[];
  deliveryModes: ("drone" | "auto" | "van" | "ebike")[];
}

interface ComplianceReport {
  id: string;
  title: string;
  authority: string;
  dueDate: string;
  status: "submitted" | "pending" | "overdue" | "approved";
  type: "monthly" | "quarterly" | "incident" | "annual";
  category: "aerial" | "terrestrial" | "multimodal" | "general";
}

interface AirspaceRestriction {
  id: string;
  zone: string;
  type: "no_fly" | "restricted" | "controlled" | "temporary" | "road_closure" | "weight_limit";
  reason: string;
  activeFrom: string;
  activeUntil: string;
  maxAltitude: number | null;
  affectsMode: ("drone" | "auto" | "van" | "ebike")[];
}

const PERMITS: RegulatoryPermit[] = [
  { id: "PRM-001", type: "flight_zone", authority: "CAAP", status: "approved", zone: "Manila-Central", validFrom: "2026-01-01", validUntil: "2026-06-30", conditions: ["Max altitude 120m", "Daytime only", "Direct line of sight"], deliveryModes: ["drone"] },
  { id: "PRM-002", type: "night_ops", authority: "CAAP", status: "pending", zone: "Makati-CBD", validFrom: "2026-07-01", validUntil: "2026-12-31", conditions: ["Anti-collision lights mandatory", "Reduced speed 30km/h"], deliveryModes: ["drone"] },
  { id: "PRM-003", type: "cargo", authority: "DOTr", status: "approved", zone: "All Zones", validFrom: "2026-01-01", validUntil: "2026-12-31", conditions: ["Max payload 5kg drone", "Max payload 50kg van", "Hazmat excluded", "Insurance mandatory"], deliveryModes: ["drone", "auto", "van", "ebike"] },
  { id: "PRM-004", type: "emergency", authority: "NDRRMC", status: "approved", zone: "National", validFrom: "2026-01-01", validUntil: "2027-01-01", conditions: ["Priority airspace access", "No altitude limit in emergency", "Real-time reporting"], deliveryModes: ["drone", "auto", "van"] },
  { id: "PRM-005", type: "vehicle_ops", authority: "LTO", status: "approved", zone: "Metro Manila", validFrom: "2026-01-01", validUntil: "2026-12-31", conditions: ["Registered vehicles", "Licensed drivers", "Mandatory GPS tracking", "Up-to-date technical inspection"], deliveryModes: ["auto", "van"] },
  { id: "PRM-006", type: "multimodal_route", authority: "DOTr + CAAP", status: "approved", zone: "Manila-Makati-BGC", validFrom: "2026-03-01", validUntil: "2026-09-01", conditions: ["Authorized transfer hub", "Max transfer time 5 min", "Continuous tracking", "Complete audit trail"], deliveryModes: ["drone", "auto", "van", "ebike"] },
  { id: "PRM-007", type: "vehicle_ops", authority: "LTO", status: "expired", zone: "Quezon City", validFrom: "2025-06-01", validUntil: "2025-12-31", conditions: ["Registered e-bikes", "Max speed 25km/h", "Dedicated lane"], deliveryModes: ["ebike"] },
];

const REPORTS: ComplianceReport[] = [
  { id: "RPT-001", title: "Monthly Aerial Operations Report", authority: "CAAP", dueDate: "2026-07-05", status: "pending", type: "monthly", category: "aerial" },
  { id: "RPT-002", title: "Q2 Ground Fleet Safety Report", authority: "LTO", dueDate: "2026-07-15", status: "pending", type: "quarterly", category: "terrestrial" },
  { id: "RPT-003", title: "Incident — Near-miss DRN-023", authority: "CAAP", dueDate: "2026-06-20", status: "approved", type: "incident", category: "aerial" },
  { id: "RPT-004", title: "Audit Anual Impact Mediu", authority: "DENR", dueDate: "2026-09-30", status: "pending", type: "annual", category: "general" },
  { id: "RPT-005", title: "Monthly Multimodal Routes Report", authority: "DOTr", dueDate: "2026-07-05", status: "pending", type: "monthly", category: "multimodal" },
  { id: "RPT-006", title: "Vehicle Accident Report VAN-008", authority: "LTO", dueDate: "2026-06-25", status: "submitted", type: "incident", category: "terrestrial" },
];

const RESTRICTIONS: AirspaceRestriction[] = [
  { id: "RST-001", zone: "NAIA Approach", type: "no_fly", reason: "Proximitate aeroport", activeFrom: "Permanent", activeUntil: "Permanent", maxAltitude: null, affectsMode: ["drone"] },
  { id: "RST-002", zone: "Malacañang", type: "no_fly", reason: "Security zone", activeFrom: "Permanent", activeUntil: "Permanent", maxAltitude: null, affectsMode: ["drone"] },
  { id: "RST-003", zone: "BGC Events Area", type: "temporary", reason: "Eveniment public — Concert", activeFrom: "2026-06-28 18:00", activeUntil: "2026-06-28 23:00", maxAltitude: null, affectsMode: ["drone", "auto", "van"] },
  { id: "RST-004", zone: "Manila Bay", type: "restricted", reason: "Military exercises", activeFrom: "2026-06-29", activeUntil: "2026-07-01", maxAltitude: 50, affectsMode: ["drone"] },
  { id: "RST-005", zone: "EDSA Highway", type: "road_closure", reason: "Infrastructure works", activeFrom: "2026-06-27 22:00", activeUntil: "2026-06-28 05:00", maxAltitude: null, affectsMode: ["auto", "van"] },
  { id: "RST-006", zone: "Quezon Bridge", type: "weight_limit", reason: "Weight limit 3.5t", activeFrom: "Permanent", activeUntil: "Permanent", maxAltitude: null, affectsMode: ["van"] },
];

const MODE_ICONS: Record<string, string> = { drone: "🚁", auto: "🚗", van: "🚐", ebike: "🚲" };

function PermitCard({ permit }: { permit: RegulatoryPermit }) {
  const statusColors = { approved: "#10B981", pending: "#F59E0B", expired: "#6B7280", rejected: "#EF4444" };
  const statusLabels = { approved: "APPROVED", pending: "PENDING", expired: "EXPIRED", rejected: "REJECTED" };
  const typeLabels: Record<PermitType, string> = {
    flight_zone: "Flight Zone", altitude: "Altitude", night_ops: "Night Operations",
    cargo: "Cargo Transport", emergency: "Emergency", vehicle_ops: "Vehicle Operations",
    multimodal_route: "Multimodal Route", hazmat_transport: "Hazmat Transport",
  };

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{typeLabels[permit.type]}</Text>
          <Text className="text-xs text-muted">{permit.id} • {permit.authority}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[permit.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[permit.status], fontSize: 10, fontWeight: "700" }}>{statusLabels[permit.status]}</Text>
        </View>
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-muted">Zone: {permit.zone}</Text>
        <Text className="text-xs text-muted">Until: {permit.validUntil}</Text>
      </View>
      <View className="flex-row mt-2 gap-1">
        {permit.deliveryModes.map((mode) => (
          <View key={mode} style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 10 }}>{MODE_ICONS[mode]} {mode}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportCard({ report }: { report: ComplianceReport }) {
  const statusColors = { submitted: "#0066FF", pending: "#F59E0B", overdue: "#EF4444", approved: "#10B981" };
  const statusLabels = { submitted: "SUBMITTED", pending: "PENDING", overdue: "OVERDUE", approved: "APPROVED" };
  const categoryIcons = { aerial: "🚁", terrestrial: "🚗", multimodal: "🔄", general: "📋" };

  return (
    <View className="bg-surface border border-border rounded-xl p-3 mb-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1">
            <Text style={{ fontSize: 12 }}>{categoryIcons[report.category]}</Text>
            <Text className="text-sm font-medium text-foreground">{report.title}</Text>
          </View>
          <Text className="text-xs text-muted mt-0.5">{report.authority} • Due: {report.dueDate}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[report.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[report.status], fontSize: 10, fontWeight: "700" }}>{statusLabels[report.status]}</Text>
        </View>
      </View>
    </View>
  );
}

function RestrictionCard({ restriction }: { restriction: AirspaceRestriction }) {
  const typeColors: Record<string, string> = { no_fly: "#EF4444", restricted: "#F59E0B", controlled: "#0066FF", temporary: "#8B5CF6", road_closure: "#EF4444", weight_limit: "#F59E0B" };
  const typeLabels: Record<string, string> = { no_fly: "NO-FLY", restricted: "RESTRICTED", controlled: "CONTROLLED", temporary: "TEMPORARY", road_closure: "ROAD CLOSED", weight_limit: "WEIGHT LIMIT" };

  return (
    <View style={{ borderLeftWidth: 3, borderLeftColor: typeColors[restriction.type] }} className="bg-surface border border-border rounded-r-xl p-3 mb-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">{restriction.zone}</Text>
          <Text className="text-xs text-muted mt-0.5">{restriction.reason}</Text>
        </View>
        <View style={{ backgroundColor: typeColors[restriction.type] + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: typeColors[restriction.type], fontSize: 9, fontWeight: "700" }}>{typeLabels[restriction.type]}</Text>
        </View>
      </View>
      {restriction.maxAltitude && (
        <Text className="text-xs text-warning mt-1">Max altitude: {restriction.maxAltitude}m</Text>
      )}
      <View className="flex-row mt-2 gap-1">
        {restriction.affectsMode.map((mode) => (
          <View key={mode} style={{ backgroundColor: typeColors[restriction.type] + "10", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }}>
            <Text style={{ fontSize: 9 }}>{MODE_ICONS[mode]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AuthoritiesScreen() {
  const [activeTab, setActiveeTab] = useState<"permits" | "reports" | "restrictions">("permits");

  const tabs = [
    { key: "permits" as const, label: "Permits", count: PERMITS.filter(p => p.status === "approved").length },
    { key: "reports" as const, label: "Reports", count: REPORTS.filter(r => r.status === "pending" || r.status === "overdue").length },
    { key: "restrictions" as const, label: "Restrictions", count: RESTRICTIONS.length },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Authorities & Regulation</Text>
      <Text className="text-sm text-muted mb-4">Aerial + Ground Compliance</Text>

      {/* Summary */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-success/10 border border-success/20 rounded-xl p-2 items-center">
          <Text className="text-lg font-bold text-success">{PERMITS.filter(p => p.status === "approved").length}</Text>
          <Text className="text-[9px] text-muted">Permits Activee</Text>
        </View>
        <View className="flex-1 bg-warning/10 border border-warning/20 rounded-xl p-2 items-center">
          <Text className="text-lg font-bold text-warning">{REPORTS.filter(r => r.status === "pending").length}</Text>
          <Text className="text-[9px] text-muted">Reports Duee</Text>
        </View>
        <View className="flex-1 bg-error/10 border border-error/20 rounded-xl p-2 items-center">
          <Text className="text-lg font-bold text-error">{RESTRICTIONS.filter(r => r.type === "no_fly" || r.type === "road_closure").length}</Text>
          <Text className="text-[9px] text-muted">Restricted Zones</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View className="flex-row bg-surface rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.key ? "bg-primary" : ""}`}
            activeOpacity={0.7}
            onPress={() => setActiveeTab(tab.key)}
          >
            <Text className={`text-xs font-semibold ${activeTab === tab.key ? "text-white" : "text-muted"}`}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "permits" && (
        <FlatList
          data={PERMITS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PermitCard permit={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "reports" && (
        <FlatList
          data={REPORTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "restrictions" && (
        <FlatList
          data={RESTRICTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestrictionCard restriction={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="bg-error/10 border border-error/20 rounded-xl p-3 mb-3">
              <Text className="text-error text-xs font-bold">
                ACTIVE RESTRICTIONS: {RESTRICTIONS.filter(r => r.type === "no_fly").length} No-Fly + {RESTRICTIONS.filter(r => r.type === "road_closure").length} Road Closures
              </Text>
              <Text className="text-xs text-muted mt-1">Affects both aerial and ground operations</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
