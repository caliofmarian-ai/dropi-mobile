import { Text, View, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

interface RegulatoryPermit {
  id: string;
  type: "flight_zone" | "altitude" | "night_ops" | "cargo" | "emergency";
  authority: string;
  status: "approved" | "pending" | "expired" | "rejected";
  zone: string;
  validFrom: string;
  validUntil: string;
  conditions: string[];
}

interface ComplianceReport {
  id: string;
  title: string;
  authority: string;
  dueDate: string;
  status: "submitted" | "pending" | "overdue" | "approved";
  type: "monthly" | "quarterly" | "incident" | "annual";
}

interface AirspaceRestriction {
  id: string;
  zone: string;
  type: "no_fly" | "restricted" | "controlled" | "temporary";
  reason: string;
  activeFrom: string;
  activeUntil: string;
  maxAltitude: number | null;
}

const PERMITS: RegulatoryPermit[] = [
  { id: "PRM-001", type: "flight_zone", authority: "CAAP", status: "approved", zone: "Manila-Central", validFrom: "2024-01-01", validUntil: "2024-06-30", conditions: ["Max altitude 120m", "Daylight only", "Visual line of sight"] },
  { id: "PRM-002", type: "night_ops", authority: "CAAP", status: "pending", zone: "Makati-CBD", validFrom: "2024-02-01", validUntil: "2024-07-31", conditions: ["Anti-collision lights required", "Reduced speed 30km/h"] },
  { id: "PRM-003", type: "cargo", authority: "DOTr", status: "approved", zone: "All Zones", validFrom: "2024-01-01", validUntil: "2024-12-31", conditions: ["Max payload 5kg", "Hazmat excluded", "Insurance required"] },
  { id: "PRM-004", type: "emergency", authority: "NDRRMC", status: "approved", zone: "National", validFrom: "2024-01-01", validUntil: "2025-01-01", conditions: ["Priority airspace access", "No altitude limit during emergency", "Real-time reporting required"] },
  { id: "PRM-005", type: "altitude", authority: "CAAP", status: "expired", zone: "Taguig-BGC", validFrom: "2023-06-01", validUntil: "2023-12-31", conditions: ["Max altitude 150m", "Restricted hours 06:00-22:00"] },
];

const REPORTS: ComplianceReport[] = [
  { id: "RPT-001", title: "Monthly Flight Operations Report", authority: "CAAP", dueDate: "2024-02-05", status: "pending", type: "monthly" },
  { id: "RPT-002", title: "Q4 Safety Compliance Report", authority: "CAAP", dueDate: "2024-01-31", status: "submitted", type: "quarterly" },
  { id: "RPT-003", title: "Incident Report — Near-miss DRN-023", authority: "CAAP", dueDate: "2024-01-20", status: "approved", type: "incident" },
  { id: "RPT-004", title: "Annual Environmental Impact", authority: "DENR", dueDate: "2024-03-31", status: "pending", type: "annual" },
];

const RESTRICTIONS: AirspaceRestriction[] = [
  { id: "RST-001", zone: "NAIA Approach", type: "no_fly", reason: "Airport proximity", activeFrom: "Permanent", activeUntil: "Permanent", maxAltitude: null },
  { id: "RST-002", zone: "Malacañang", type: "no_fly", reason: "Security zone", activeFrom: "Permanent", activeUntil: "Permanent", maxAltitude: null },
  { id: "RST-003", zone: "BGC Events Area", type: "temporary", reason: "Public event — Concert", activeFrom: "2024-01-20 18:00", activeUntil: "2024-01-20 23:00", maxAltitude: null },
  { id: "RST-004", zone: "Manila Bay", type: "restricted", reason: "Military exercises", activeFrom: "2024-01-22", activeUntil: "2024-01-24", maxAltitude: 50 },
];

function PermitCard({ permit }: { permit: RegulatoryPermit }) {
  const statusColors = { approved: "#10B981", pending: "#F59E0B", expired: "#6B7280", rejected: "#EF4444" };
  const typeLabels = { flight_zone: "Flight Zone", altitude: "Altitude", night_ops: "Night Ops", cargo: "Cargo", emergency: "Emergency" };

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{typeLabels[permit.type]}</Text>
          <Text className="text-xs text-muted">{permit.id} • {permit.authority}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[permit.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[permit.status], fontSize: 10, fontWeight: "700" }}>{permit.status.toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-muted">Zone: {permit.zone}</Text>
        <Text className="text-xs text-muted">Until: {permit.validUntil}</Text>
      </View>
    </View>
  );
}

function ReportCard({ report }: { report: ComplianceReport }) {
  const statusColors = { submitted: "#0066FF", pending: "#F59E0B", overdue: "#EF4444", approved: "#10B981" };

  return (
    <View className="bg-surface border border-border rounded-xl p-3 mb-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-medium text-foreground">{report.title}</Text>
          <Text className="text-xs text-muted mt-0.5">{report.authority} • Due: {report.dueDate}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[report.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[report.status], fontSize: 10, fontWeight: "700" }}>{report.status.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

function RestrictionCard({ restriction }: { restriction: AirspaceRestriction }) {
  const typeColors = { no_fly: "#EF4444", restricted: "#F59E0B", controlled: "#0066FF", temporary: "#8B5CF6" };
  const typeLabels = { no_fly: "NO-FLY", restricted: "RESTRICTED", controlled: "CONTROLLED", temporary: "TEMPORARY" };

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
    </View>
  );
}

export default function AuthoritiesScreen() {
  const [activeTab, setActiveTab] = useState<"permits" | "reports" | "airspace">("permits");

  const tabs = [
    { key: "permits" as const, label: "Permits", count: PERMITS.length },
    { key: "reports" as const, label: "Reports", count: REPORTS.length },
    { key: "airspace" as const, label: "Airspace", count: RESTRICTIONS.length },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Authorities</Text>
      <Text className="text-sm text-muted mb-4">Regulatory Compliance & Airspace</Text>

      {/* Tab Selector */}
      <View className="flex-row bg-surface rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.key ? "bg-primary" : ""}`}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab.key)}
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

      {activeTab === "airspace" && (
        <FlatList
          data={RESTRICTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestrictionCard restriction={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="bg-error/10 border border-error/20 rounded-xl p-3 mb-3">
              <Text className="text-error text-xs font-bold">ACTIVE RESTRICTIONS: {RESTRICTIONS.filter(r => r.type === "no_fly").length} No-Fly Zones</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
