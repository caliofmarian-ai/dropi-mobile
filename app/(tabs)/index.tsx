import { Text, View, FlatList, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";
import { CLIENT_ORDERS, MERCHANT_ORDERS, PILOT_MISSIONS } from "@/lib/mock-data";
import { DELIVERY_MODE_INFO } from "@/lib/marketplace-data";
import type { DeliveryMode } from "@/lib/marketplace-data";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, CHANNEL_INFO, getRoleConfig } from "@/shared/types";
import type { OrderStatus, Channel } from "@/shared/types";
import { OnboardingNudgeBanner } from "@/components/onboarding-nudge-banner";

const VEHICLE_ICONS: Record<string, string> = {
  drone: "🚁",
  auto: "🚗",
  van: "🚐",
  ebike: "🚲",
};

function DeliveryModeBadge({ mode }: { mode: DeliveryMode }) {
  const info = DELIVERY_MODE_INFO[mode];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: info.color + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 }}>
      <Text style={{ fontSize: 12 }}>{info.icon}</Text>
      <Text style={{ fontSize: 10, color: info.color, fontWeight: "600", marginLeft: 3 }}>{info.label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = ORDER_STATUS_COLORS[status];
  return (
    <View style={{ backgroundColor: color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

// ===== C1 DASHBOARDS =====

function CustomerDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const activeOrders = CLIENT_ORDERS.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }, []);

  return (
    <ScreenContainer className="px-4 pt-4">
      <OnboardingNudgeBanner />
      <Text className="text-2xl font-bold text-foreground mb-1">My Deliveries</Text>
      <Text className="text-sm text-muted mb-4">{activeOrders.length} active</Text>
      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-surface border border-border rounded-2xl p-4 mb-3" activeOpacity={0.7} onPress={() => router.push(`/order/${item.id}`)}>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
                <Text className="text-xs text-muted mt-0.5">{item.orderUid}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm text-muted" numberOfLines={1} style={{ flex: 1 }}>{item.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</Text>
              <Text className="text-sm font-medium text-foreground ml-2">₱{item.totalAmount}</Text>
            </View>
            {/* Delivery Mode Badge */}
            <View className="flex-row items-center mt-2">
              <DeliveryModeBadge mode={item.deliveryMode} />
              {item.vehicleType && (
                <Text style={{ fontSize: 10, color: "#6B7280" }}>{VEHICLE_ICONS[item.vehicleType]} {item.vehicleId}</Text>
              )}
            </View>
            {item.status === "in_execution" && (
              <View className="mt-3 bg-primary/10 rounded-lg px-3 py-2">
                <Text className="text-primary text-sm font-medium">
                  {VEHICLE_ICONS[item.vehicleType || "drone"]} Live Tracking — ETA {item.estimatedTime} min
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No active deliveries</Text></View>}
      />
    </ScreenContainer>
  );
}

function MerchantDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const newOrders = MERCHANT_ORDERS.filter((o) => o.status === "validated");
  const preparingOrders = MERCHANT_ORDERS.filter((o) => o.status === "preparing");
  const readyOrders = MERCHANT_ORDERS.filter((o) => o.status === "ready");
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }, []);
  const sections = [
    { title: "New Orders", data: newOrders, color: "#0066FF" },
    { title: "Preparing", data: preparingOrders, color: "#F59E0B" },
    { title: "Ready for Pickup", data: readyOrders, color: "#10B981" },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <OnboardingNudgeBanner />
      <Text className="text-2xl font-bold text-foreground mb-1">Order Queue</Text>
      <Text className="text-sm text-muted mb-4">{MERCHANT_ORDERS.length} orders today</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: section }) => (
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: section.color, marginRight: 8 }} />
              <Text className="text-base font-semibold text-foreground">{section.title}</Text>
              <Text className="text-sm text-muted ml-2">({section.data.length})</Text>
            </View>
            {section.data.map((order) => (
              <TouchableOpacity key={order.id} className="bg-surface border border-border rounded-xl p-4 mb-2" activeOpacity={0.7} onPress={() => router.push(`/merchant-order/${order.id}`)}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{order.orderUid}</Text>
                    <Text className="text-xs text-muted mt-1">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">₱{order.totalAmount}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {section.data.length === 0 && <Text className="text-xs text-muted italic ml-4">No orders</Text>}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

function DeliveryPartnerDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const availableMissions = PILOT_MISSIONS.filter((m) => m.status === "available");
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }, []);

  return (
    <ScreenContainer className="px-4 pt-4">
      <OnboardingNudgeBanner />
      <Text className="text-2xl font-bold text-foreground mb-1">Mission Radar</Text>
      <Text className="text-sm text-muted mb-4">{availableMissions.length} missions available in your area</Text>
      <FlatList
        data={availableMissions}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-surface border border-border rounded-2xl p-4 mb-3" activeOpacity={0.7} onPress={() => router.push(`/mission/${item.id}`)}>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">{item.merchantName}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <DeliveryModeBadge mode={item.deliveryMode} />
                  <Text style={{ fontSize: 14 }}>{VEHICLE_ICONS[item.vehicleType]}</Text>
                  <Text style={{ fontSize: 10, color: "#6B7280", marginLeft: 4 }}>{item.vehicleType.toUpperCase()}</Text>
                </View>
              </View>
              <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
                <Text className="text-primary text-xs font-semibold">{item.estimatedTime} min</Text>
              </View>
            </View>
            <View className="gap-1.5 mt-1">
              <View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-success mr-2" /><Text className="text-sm text-muted">Pickup: {item.pickupZone}</Text></View>
              <View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-error mr-2" /><Text className="text-sm text-muted">Delivery: {item.deliveryZone}</Text></View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted">{item.packageWeight} kg</Text>
              <Text className="text-xs text-muted">{item.distance} km</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View className="items-center py-12"><Text className="text-muted text-base">No missions available</Text></View>}
      />
    </ScreenContainer>
  );
}

function SupportAgentDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Support Queue</Text>
      <Text className="text-sm text-muted mb-4">C1 Marketplace Support</Text>
      <StatCard title="Open Tickets" value="12" color="#F59E0B" />
      <StatCard title="In Progress" value="5" color="#0066FF" />
      <StatCard title="Resolved Today" value="23" color="#10B981" />
      <StatCard title="Avg Resolution" value="14 min" color="#8B5CF6" />
      <TicketList tickets={[
        { id: "TK-001", title: "Delivery delayed 30+ min", priority: "high", time: "5 min ago" },
        { id: "TK-002", title: "Wrong item received", priority: "medium", time: "12 min ago" },
        { id: "TK-003", title: "Cannot track my order", priority: "low", time: "20 min ago" },
      ]} />
    </ScreenContainer>
  );
}

function AnalystDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Analytics</Text>
      <Text className="text-sm text-muted mb-4">C1 Marketplace Insights</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Orders Today" value="156" trend="+12%" />
        <MetricBox label="Revenue" value="₱45.2K" trend="+8%" />
      </View>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Avg Delivery" value="18 min" trend="-3%" />
        <MetricBox label="Success Rate" value="97.2%" trend="+0.5%" />
      </View>
      <ChartPlaceholder title="Orders by Hour" />
      <ChartPlaceholder title="Revenue Trend (7 days)" />
    </ScreenContainer>
  );
}

function ComplianceDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Compliance</Text>
      <Text className="text-sm text-muted mb-4">Regulatory Oversight</Text>
      <StatCard title="Active Audits" value="3" color="#8B5CF6" />
      <StatCard title="Pending Reviews" value="7" color="#F59E0B" />
      <StatCard title="Violations (30d)" value="2" color="#EF4444" />
      <StatCard title="Compliance Score" value="94%" color="#10B981" />
      <AlertList alerts={[
        { title: "Flight altitude violation — DRN-045", severity: "warning", time: "1h ago" },
        { title: "Missing pre-flight checklist — Mission M-234", severity: "critical", time: "3h ago" },
      ]} />
    </ScreenContainer>
  );
}

function FraudDetectionDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Fraud Detection</Text>
      <Text className="text-sm text-muted mb-4">Anomaly Monitoring</Text>
      <StatCard title="Flagged Transactions" value="4" color="#EF4444" />
      <StatCard title="Under Review" value="8" color="#F59E0B" />
      <StatCard title="Blocked Today" value="2" color="#EF4444" />
      <StatCard title="False Positive Rate" value="3.2%" color="#10B981" />
      <AlertList alerts={[
        { title: "Unusual order pattern — User #4521", severity: "critical", time: "15 min ago" },
        { title: "Multiple failed payments — Merchant #89", severity: "warning", time: "45 min ago" },
      ]} />
    </ScreenContainer>
  );
}

function PerformanceMonitorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Performance</Text>
      <Text className="text-sm text-muted mb-4">KPI & SLA Monitoring</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="SLA Compliance" value="96.8%" trend="+1.2%" />
        <MetricBox label="Uptime" value="99.9%" trend="stable" />
      </View>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Avg Response" value="230ms" trend="-15ms" />
        <MetricBox label="Error Rate" value="0.3%" trend="-0.1%" />
      </View>
      <ChartPlaceholder title="Response Time (24h)" />
      <ChartPlaceholder title="SLA Breaches" />
    </ScreenContainer>
  );
}

function IncidentResponderDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Incidents</Text>
      <Text className="text-sm text-muted mb-4">Active Incident Response</Text>
      <StatCard title="Active Incidents" value="2" color="#EF4444" />
      <StatCard title="Investigating" value="1" color="#F59E0B" />
      <StatCard title="Resolved (24h)" value="5" color="#10B981" />
      <AlertList alerts={[
        { title: "Drone communication lost — DRN-023", severity: "critical", time: "2 min ago" },
        { title: "Delivery failure — Order ORD-789", severity: "warning", time: "18 min ago" },
      ]} />
    </ScreenContainer>
  );
}

// ===== C2 DASHBOARDS =====

function OperationsManagerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Operations</Text>
      <Text className="text-sm text-muted mb-4">C2 Contracted Operations</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Active Contracts" value="12" trend="+2" />
        <MetricBox label="Deliveries Today" value="89" trend="+15%" />
      </View>
      <StatCard title="Team Members" value="24" color="#0066FF" />
      <StatCard title="Pending Approvals" value="3" color="#F59E0B" />
      <StatCard title="SLA Compliance" value="98.1%" color="#10B981" />
      <ChartPlaceholder title="Operations Overview" />
    </ScreenContainer>
  );
}

function LogisticsCoordinatorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Logistics</Text>
      <Text className="text-sm text-muted mb-4">Delivery Coordination</Text>
      <StatCard title="Scheduled Today" value="45" color="#0066FF" />
      <StatCard title="In Transit" value="12" color="#8B5CF6" />
      <StatCard title="Delivered" value="33" color="#10B981" />
      <StatCard title="Conflicts" value="1" color="#EF4444" />
      <ChartPlaceholder title="Schedule Timeline" />
    </ScreenContainer>
  );
}

function FleetManagerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-1">Multimodal Fleet</Text>
        <Text className="text-sm text-muted mb-4">Managementul Flotei DROPi</Text>
        {/* Drone fleet */}
        <Text className="text-sm font-semibold text-foreground mb-2">🚁 Drone</Text>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="Total" value="28" trend="" />
          <MetricBox label="Active" value="18" trend="" />
        </View>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="Maintenance" value="4" trend="" />
          <MetricBox label="Grounded" value="6" trend="" />
        </View>
        {/* Terrestrial fleet */}
        <Text className="text-sm font-semibold text-foreground mb-2">🚗 Ground Vehicles</Text>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="Auto" value="12" trend="" />
          <MetricBox label="Van" value="6" trend="" />
        </View>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="E-Bike" value="15" trend="" />
          <MetricBox label="Active" value="24" trend="" />
        </View>
        <StatCard title="Battery Health (Drone)" value="87%" color="#10B981" />
        <StatCard title="Next Maintenance" value="DRN-007 in 2h" color="#F59E0B" />
        <StatCard title="Fuel Status (Auto/Van)" value="78%" color="#10B981" />
        <ChartPlaceholder title="Fleet Utilization by Type" />
      </ScrollView>
    </ScreenContainer>
  );
}

function C2ComplianceDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">COS Compliance</Text>
      <Text className="text-sm text-muted mb-4">Contract Compliance Monitoring</Text>
      <StatCard title="Contracts Audited" value="8" color="#8B5CF6" />
      <StatCard title="Violations" value="1" color="#EF4444" />
      <StatCard title="Compliance Rate" value="96%" color="#10B981" />
      <AlertList alerts={[
        { title: "SLA breach — Contract C-045", severity: "warning", time: "2h ago" },
      ]} />
    </ScreenContainer>
  );
}

function C2PerformanceMonitorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">COS Performance</Text>
      <Text className="text-sm text-muted mb-4">SLA & KPI Tracking</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="On-Time Rate" value="94.5%" trend="+2.1%" />
        <MetricBox label="Client Satisfaction" value="4.7/5" trend="+0.2" />
      </View>
      <ChartPlaceholder title="Delivery Performance (7d)" />
      <ChartPlaceholder title="SLA Compliance Trend" />
    </ScreenContainer>
  );
}

function C2IncidentResponderDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">COS Incidents</Text>
      <Text className="text-sm text-muted mb-4">Operational Incident Response</Text>
      <StatCard title="Open Incidents" value="1" color="#EF4444" />
      <StatCard title="Resolved (7d)" value="4" color="#10B981" />
      <AlertList alerts={[
        { title: "Route deviation — Fleet Unit F-12", severity: "warning", time: "30 min ago" },
      ]} />
    </ScreenContainer>
  );
}

function DataAnalystDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Data Analysis</Text>
      <Text className="text-sm text-muted mb-4">Operational Intelligence</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Reports Generated" value="12" trend="+3" />
        <MetricBox label="Insights" value="8" trend="new" />
      </View>
      <ChartPlaceholder title="Route Optimization Score" />
      <ChartPlaceholder title="Cost per Delivery Trend" />
      <ChartPlaceholder title="Demand Forecast" />
    </ScreenContainer>
  );
}

function QualityAssuranceDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Quality Assurance</Text>
      <Text className="text-sm text-muted mb-4">Delivery Quality Control</Text>
      <StatCard title="Inspections Today" value="18" color="#0066FF" />
      <StatCard title="Issues Found" value="2" color="#F59E0B" />
      <StatCard title="Quality Score" value="98.4%" color="#10B981" />
      <StatCard title="Standards Met" value="15/16" color="#8B5CF6" />
    </ScreenContainer>
  );
}

// ===== C3 DASHBOARDS =====

function EmergencyCoordinatorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Emergency Ops</Text>
      <Text className="text-sm text-muted mb-4">C3 Emergency Operations Center</Text>
      <View className="bg-error/10 border border-error/30 rounded-xl p-4 mb-4">
        <Text className="text-error font-bold text-base">ACTIVE EMERGENCY</Text>
        <Text className="text-sm text-foreground mt-1">Medical supply delivery — Sector 7</Text>
        <Text className="text-xs text-muted mt-1">Deployed 3 min ago • ETA 8 min</Text>
      </View>
      <StatCard title="Active Emergencies" value="1" color="#EF4444" />
      <StatCard title="Drones Deployed" value="2" color="#F59E0B" />
      <StatCard title="Resolved (24h)" value="4" color="#10B981" />
      <StatCard title="Avg Response Time" value="4.2 min" color="#0066FF" />
    </ScreenContainer>
  );
}

function DispatchManagerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Dispatch</Text>
      <Text className="text-sm text-muted mb-4">Emergency Resource Dispatch</Text>
      <StatCard title="Queue" value="3" color="#F59E0B" />
      <StatCard title="Dispatched" value="2" color="#0066FF" />
      <StatCard title="Completed" value="7" color="#10B981" />
      <AlertList alerts={[
        { title: "Priority 1: Medical supply — Hospital Zone", severity: "critical", time: "NOW" },
        { title: "Priority 2: Search equipment — Mountain Sector", severity: "warning", time: "5 min ago" },
      ]} />
    </ScreenContainer>
  );
}

function ResourceAllocatorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Resources</Text>
      <Text className="text-sm text-muted mb-4">Emergency Resource Allocation</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Drones Ready" value="8" trend="" />
        <MetricBox label="Personnel" value="12" trend="" />
      </View>
      <StatCard title="Medical Supplies" value="Full" color="#10B981" />
      <StatCard title="Battery Reserves" value="85%" color="#10B981" />
      <StatCard title="Fuel Status" value="72%" color="#F59E0B" />
    </ScreenContainer>
  );
}

function CommunicationOfficerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Communications</Text>
      <Text className="text-sm text-muted mb-4">Emergency Comms Center</Text>
      <StatCard title="Active Channels" value="4" color="#0066FF" />
      <StatCard title="Broadcasts Sent" value="12" color="#8B5CF6" />
      <StatCard title="Pending Messages" value="3" color="#F59E0B" />
      <AlertList alerts={[
        { title: "Broadcast: Sector 7 restricted airspace", severity: "critical", time: "Active" },
        { title: "Team Alpha: Awaiting confirmation", severity: "warning", time: "2 min ago" },
      ]} />
    </ScreenContainer>
  );
}

function C3DataAnalystDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">EOC Analytics</Text>
      <Text className="text-sm text-muted mb-4">Emergency Response Data</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Avg Response" value="4.2 min" trend="-0.8 min" />
        <MetricBox label="Success Rate" value="98.5%" trend="+1.2%" />
      </View>
      <ChartPlaceholder title="Response Times (30d)" />
      <ChartPlaceholder title="Incident Types Distribution" />
    </ScreenContainer>
  );
}

function IncidentCommanderDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Command Center</Text>
      <Text className="text-sm text-muted mb-4">Incident Command</Text>
      <View className="bg-error/10 border-2 border-error rounded-xl p-4 mb-4">
        <Text className="text-error font-bold text-lg">COMMAND STATUS: ACTIVE</Text>
        <Text className="text-sm text-foreground mt-1">Incident: Medical Emergency — Zone 7</Text>
        <Text className="text-xs text-muted mt-1">Duration: 12 min • Resources: 4 deployed</Text>
      </View>
      <StatCard title="Teams Deployed" value="3" color="#0066FF" />
      <StatCard title="Drones Active" value="2" color="#8B5CF6" />
      <StatCard title="Civilians Affected" value="~50" color="#F59E0B" />
      <TouchableOpacity className="bg-error rounded-xl py-4 items-center mt-4" activeOpacity={0.8}>
        <Text className="text-white font-bold text-base">DECLARE ALL-CLEAR</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

// ===== ADMIN DASHBOARDS =====

function SystemAdminDashboard() {
  const router = useRouter();
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-foreground mb-1">System Admin</Text>
        <Text className="text-sm text-muted mb-4">Platform Administration</Text>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="Users" value="—" trend="" />
          <MetricBox label="Active Now" value="—" trend="" />
        </View>
        <StatCard title="System Health" value="Healthy" color="#10B981" />
        <StatCard title="API Uptime" value="99.97%" color="#10B981" />
        <StatCard title="Pending Actions" value="—" color="#F59E0B" />

        {/* Marketplace Section */}
        <Text className="text-base font-semibold text-foreground mt-4 mb-2">Marketplace</Text>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/marketplace-overview" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Marketplace Overview</Text>
            <Text className="text-xs text-muted">Stores, products, trust scores</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/moderation" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Product Moderation</Text>
            <Text className="text-xs text-muted">Pending reviews & flagged items</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/audit-logs" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Audit Logs</Text>
            <Text className="text-xs text-muted">Full activity trail, phantom mode</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>

        {/* Phantom Mode */}
        <TouchableOpacity className="bg-primary rounded-xl py-3 items-center mt-4" activeOpacity={0.8}>
          <Text className="text-white font-semibold">👻 Phantom Mode — View as User</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function SecurityOfficerDashboard() {
  const router = useRouter();
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-foreground mb-1">Security</Text>
        <Text className="text-sm text-muted mb-4">Platform Security Monitoring</Text>
        <StatCard title="Threat Level" value="LOW" color="#10B981" />
        <StatCard title="Failed Logins (24h)" value="—" color="#F59E0B" />
        <StatCard title="Blocked IPs" value="—" color="#EF4444" />
        <StatCard title="Active Sessions" value="—" color="#0066FF" />

        {/* Marketplace Security */}
        <Text className="text-base font-semibold text-foreground mt-4 mb-2">Marketplace Security</Text>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/audit-logs" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Security Audit Logs</Text>
            <Text className="text-xs text-muted">Critical events, phantom mode tracking</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/approvals" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔐</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Identity Verification</Text>
            <Text className="text-xs text-muted">Document & role verifications</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>

        <AlertList alerts={[
          { title: "Brute force attempt — IP 192.168.x.x", severity: "warning", time: "1h ago" },
          { title: "Unusual API pattern — Service account", severity: "warning", time: "3h ago" },
        ]} />
      </ScrollView>
    </ScreenContainer>
  );
}

function AuditManagerDashboard() {
  const router = useRouter();
  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-foreground mb-1">Audit</Text>
        <Text className="text-sm text-muted mb-4">Platform Audit Trail & Compliance</Text>
        <View className="flex-row gap-3 mb-4">
          <MetricBox label="Logs (24h)" value="—" trend="" />
          <MetricBox label="Flagged" value="—" trend="" />
        </View>
        <StatCard title="Compliance Score" value="—" color="#10B981" />
        <StatCard title="Pending Reviews" value="—" color="#F59E0B" />

        {/* Marketplace Audit */}
        <Text className="text-base font-semibold text-foreground mt-4 mb-2">Marketplace Audit</Text>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/audit-logs" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📜</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Full Audit Log Viewer</Text>
            <Text className="text-xs text-muted">Filters, export, phantom mode, AI markers</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/marketplace-overview" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Marketplace Compliance</Text>
            <Text className="text-xs text-muted">Store health, trust scores, violations</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center" activeOpacity={0.7} onPress={() => router.push("/admin/moderation" as any)}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text className="text-sm font-medium text-foreground">Product Moderation Audit</Text>
            <Text className="text-xs text-muted">Review decisions, auto-moderation logs</Text>
          </View>
          <Text className="text-muted">→</Text>
        </TouchableOpacity>

        <ChartPlaceholder title="Audit Activity (7d)" />
      </ScrollView>
    </ScreenContainer>
  );
}

function ConfigManagerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Configuration</Text>
      <Text className="text-sm text-muted mb-4">Platform Configuration</Text>
      <StatCard title="Active Version" value="v2.4.1" color="#0066FF" />
      <StatCard title="Pending Changes" value="2" color="#F59E0B" />
      <StatCard title="Last Deploy" value="2h ago" color="#10B981" />
      <StatCard title="Rollback Available" value="v2.4.0" color="#8B5CF6" />
    </ScreenContainer>
  );
}

function AnalyticsManagerDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Platform Analytics</Text>
      <Text className="text-sm text-muted mb-4">Business Intelligence</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Total Revenue" value="₱2.1M" trend="+18%" />
        <MetricBox label="Orders (30d)" value="4,521" trend="+12%" />
      </View>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Active Users" value="1,247" trend="+8%" />
        <MetricBox label="NPS Score" value="72" trend="+5" />
      </View>
      <ChartPlaceholder title="Revenue by Channel" />
      <ChartPlaceholder title="Growth Metrics" />
    </ScreenContainer>
  );
}

function SupportCoordinatorDashboard() {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Support Ops</Text>
      <Text className="text-sm text-muted mb-4">Support Team Coordination</Text>
      <View className="flex-row gap-3 mb-4">
        <MetricBox label="Open Tickets" value="34" trend="" />
        <MetricBox label="Agents Online" value="8" trend="" />
      </View>
      <StatCard title="Avg Resolution" value="12 min" color="#10B981" />
      <StatCard title="Escalated" value="3" color="#EF4444" />
      <StatCard title="CSAT Score" value="4.6/5" color="#10B981" />
      <ChartPlaceholder title="Ticket Volume (7d)" />
    </ScreenContainer>
  );
}

// ===== SHARED COMPONENTS =====

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row justify-between items-center">
      <Text className="text-sm text-muted">{title}</Text>
      <Text style={{ color, fontWeight: "700", fontSize: 16 }}>{value}</Text>
    </View>
  );
}

function MetricBox({ label, value, trend }: { label: string; value: string; trend: string }) {
  const trendColor = trend.startsWith("+") ? "#10B981" : trend.startsWith("-") ? "#EF4444" : "#6B7280";
  return (
    <View className="flex-1 bg-surface border border-border rounded-xl p-3">
      <Text className="text-lg font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted mt-0.5">{label}</Text>
      {trend ? <Text style={{ color: trendColor, fontSize: 10, marginTop: 2 }}>{trend}</Text> : null}
    </View>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <View className="bg-surface border border-border rounded-xl h-32 items-center justify-center mb-3">
      <Text className="text-muted text-sm">{title}</Text>
      <Text className="text-xs text-muted mt-1">Chart visualization</Text>
    </View>
  );
}

function TicketList({ tickets }: { tickets: { id: string; title: string; priority: string; time: string }[] }) {
  const priorityColors: Record<string, string> = { high: "#EF4444", medium: "#F59E0B", low: "#6B7280", critical: "#EF4444" };
  return (
    <View className="mt-3">
      <Text className="text-base font-semibold text-foreground mb-2">Recent Tickets</Text>
      {tickets.map((t) => (
        <View key={t.id} className="bg-surface border border-border rounded-xl p-3 mb-2">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">{t.title}</Text>
              <Text className="text-xs text-muted mt-0.5">{t.id} • {t.time}</Text>
            </View>
            <View style={{ backgroundColor: (priorityColors[t.priority] || "#6B7280") + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: priorityColors[t.priority] || "#6B7280", fontSize: 10, fontWeight: "600" }}>{t.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function AlertList({ alerts }: { alerts: { title: string; severity: string; time: string }[] }) {
  const severityColors: Record<string, string> = { critical: "#EF4444", warning: "#F59E0B", info: "#0066FF" };
  return (
    <View className="mt-3">
      <Text className="text-base font-semibold text-foreground mb-2">Alerts</Text>
      {alerts.map((a, i) => (
        <View key={i} style={{ backgroundColor: (severityColors[a.severity] || "#6B7280") + "10", borderWidth: 1, borderColor: (severityColors[a.severity] || "#6B7280") + "30", borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <Text className="text-sm font-medium text-foreground">{a.title}</Text>
          <Text className="text-xs text-muted mt-0.5">{a.time}</Text>
        </View>
      ))}
    </View>
  );
}

// ===== MAIN ROUTER =====

export default function HomeScreen() {
  const { user, loading } = useDropiAuth();

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  if (!user?.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Route to the correct dashboard based on role
  switch (user.dropiRole) {
    // C1 Marketplace
    case "customer": return <CustomerDashboard />;
    case "merchant": return <MerchantDashboard />;
    case "delivery_partner": return <DeliveryPartnerDashboard />;
    case "support_agent": return <SupportAgentDashboard />;
    case "analyst": return <AnalystDashboard />;
    case "compliance_officer": return <ComplianceDashboard />;
    case "fraud_detection": return <FraudDetectionDashboard />;
    case "performance_monitor": return <PerformanceMonitorDashboard />;
    case "incident_responder": return <IncidentResponderDashboard />;
    // C2 COS
    case "operations_manager": return <OperationsManagerDashboard />;
    case "logistics_coordinator": return <LogisticsCoordinatorDashboard />;
    case "fleet_manager": return <FleetManagerDashboard />;
    case "c2_compliance_officer": return <C2ComplianceDashboard />;
    case "c2_performance_monitor": return <C2PerformanceMonitorDashboard />;
    case "c2_incident_responder": return <C2IncidentResponderDashboard />;
    case "data_analyst": return <DataAnalystDashboard />;
    case "quality_assurance": return <QualityAssuranceDashboard />;
    // C3 EOC
    case "emergency_coordinator": return <EmergencyCoordinatorDashboard />;
    case "dispatch_manager": return <DispatchManagerDashboard />;
    case "resource_allocator": return <ResourceAllocatorDashboard />;
    case "communication_officer": return <CommunicationOfficerDashboard />;
    case "c3_data_analyst": return <C3DataAnalystDashboard />;
    case "incident_commander": return <IncidentCommanderDashboard />;
    // Admin
    case "system_administrator": return <SystemAdminDashboard />;
    case "security_officer": return <SecurityOfficerDashboard />;
    case "audit_manager": return <AuditManagerDashboard />;
    case "configuration_manager": return <ConfigManagerDashboard />;
    case "analytics_manager": return <AnalyticsManagerDashboard />;
    case "support_coordinator": return <SupportCoordinatorDashboard />;
    // Default
    default: return <CustomerDashboard />;
  }
}
