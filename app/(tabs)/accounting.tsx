import { Text, View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

interface Transaction {
  id: string;
  type: "order_payment" | "commission" | "pilot_payout" | "refund" | "subscription" | "penalty" | "droneport_fee" | "vehicle_rental";
  amount: number;
  currency: string;
  from: string;
  to: string;
  status: "completed" | "pending" | "failed" | "processing";
  timestamp: string;
  orderId?: string;
  deliveryMode?: "drone" | "auto" | "van" | "ebike" | "multimodal";
}

interface Invoice {
  id: string;
  client: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "draft";
  issuedDate: string;
  dueDate: string;
  items: { description: string; amount: number }[];
}

interface DeliveryCostBreakdown {
  mode: "drone" | "auto" | "van" | "ebike" | "multimodal";
  totalDeliveries: number;
  totalRevenue: number;
  avgCostPerDelivery: number;
  avgDistance: number;
  profitMargin: number;
}

const DELIVERY_COSTS: DeliveryCostBreakdown[] = [
  { mode: "drone", totalDeliveries: 1247, totalRevenue: 498800, avgCostPerDelivery: 280, avgDistance: 3.2, profitMargin: 22 },
  { mode: "auto", totalDeliveries: 2890, totalRevenue: 867000, avgCostPerDelivery: 180, avgDistance: 8.5, profitMargin: 18 },
  { mode: "van", totalDeliveries: 1456, totalRevenue: 582400, avgCostPerDelivery: 320, avgDistance: 12.3, profitMargin: 15 },
  { mode: "ebike", totalDeliveries: 3210, totalRevenue: 481500, avgCostPerDelivery: 95, avgDistance: 2.8, profitMargin: 28 },
  { mode: "multimodal", totalDeliveries: 423, totalRevenue: 211500, avgCostPerDelivery: 420, avgDistance: 15.7, profitMargin: 12 },
];

const TRANSACTIONS: Transaction[] = [
  { id: "TXN-001", type: "order_payment", amount: 450, currency: "PHP", from: "Client #1247", to: "DROPi Escrow", status: "completed", timestamp: "2026-06-27 14:32", orderId: "ORD-4521", deliveryMode: "drone" },
  { id: "TXN-002", type: "commission", amount: 67.5, currency: "PHP", from: "DROPi Escrow", to: "DROPi Revenue", status: "completed", timestamp: "2026-06-27 14:32", orderId: "ORD-4521", deliveryMode: "drone" },
  { id: "TXN-003", type: "pilot_payout", amount: 180, currency: "PHP", from: "DROPi Escrow", to: "Drone Pilot #089", status: "processing", timestamp: "2026-06-27 14:35", orderId: "ORD-4521", deliveryMode: "drone" },
  { id: "TXN-004", type: "droneport_fee", amount: 45, currency: "PHP", from: "DROPi Escrow", to: "DronePort Central", status: "completed", timestamp: "2026-06-27 14:33", orderId: "ORD-4521", deliveryMode: "drone" },
  { id: "TXN-005", type: "order_payment", amount: 320, currency: "PHP", from: "Client #1198", to: "DROPi Escrow", status: "completed", timestamp: "2026-06-27 12:15", orderId: "ORD-4498", deliveryMode: "ebike" },
  { id: "TXN-006", type: "pilot_payout", amount: 95, currency: "PHP", from: "DROPi Escrow", to: "E-Bike Courier #045", status: "completed", timestamp: "2026-06-27 12:20", orderId: "ORD-4498", deliveryMode: "ebike" },
  { id: "TXN-007", type: "vehicle_rental", amount: 150, currency: "PHP", from: "DROPi Fleet", to: "Vehicle Depot QC", status: "completed", timestamp: "2026-06-27 11:00", deliveryMode: "van" },
  { id: "TXN-008", type: "order_payment", amount: 890, currency: "PHP", from: "Client #1302", to: "DROPi Escrow", status: "completed", timestamp: "2026-06-27 07:22", orderId: "ORD-4520", deliveryMode: "multimodal" },
  { id: "TXN-009", type: "subscription", amount: 4999, currency: "PHP", from: "Merchant #034", to: "DROPi Revenue", status: "completed", timestamp: "2026-06-27 09:00" },
  { id: "TXN-010", type: "penalty", amount: 500, currency: "PHP", from: "Pilot #045", to: "DROPi Penalties", status: "pending", timestamp: "2026-06-27 08:45" },
  { id: "TXN-011", type: "refund", amount: 280, currency: "PHP", from: "DROPi Escrow", to: "Client #1156", status: "completed", timestamp: "2026-06-26 22:10", orderId: "ORD-4515", deliveryMode: "auto" },
];

const INVOICES: Invoice[] = [
  { id: "INV-001", client: "Enterprise Corp", amount: 125000, currency: "PHP", status: "paid", issuedDate: "2026-06-01", dueDate: "2026-06-15", items: [{ description: "C2 Monthly Service — 500 deliveries (drone/car mix)", amount: 100000 }, { description: "Priority support", amount: 25000 }] },
  { id: "INV-002", client: "MedSupply Inc", amount: 89000, currency: "PHP", status: "pending", issuedDate: "2026-06-10", dueDate: "2026-06-25", items: [{ description: "C3 Emergency response — 50 drone deployments", amount: 75000 }, { description: "Equipment rental", amount: 14000 }] },
  { id: "INV-003", client: "FoodChain PH", amount: 45000, currency: "PHP", status: "overdue", issuedDate: "2026-05-15", dueDate: "2026-06-05", items: [{ description: "C2 Contract — 200 e-bike deliveries", amount: 40000 }, { description: "Insurance surcharge", amount: 5000 }] },
  { id: "INV-004", client: "City Hall", amount: 200000, currency: "PHP", status: "draft", issuedDate: "2026-06-16", dueDate: "2026-07-15", items: [{ description: "C3 Annual emergency contract (drone + van)", amount: 180000 }, { description: "Training & certification", amount: 20000 }] },
];

const MODE_ICONS: Record<string, string> = {
  drone: "🚁", auto: "🚗", van: "🚐", ebike: "🚲", multimodal: "🔄",
};
const MODE_LABELS: Record<string, string> = {
  drone: "Drone", auto: "Car", van: "Van", ebike: "E-Bike", multimodal: "Multimodal",
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}K`;
  return `₱${amount.toFixed(0)}`;
}

function TransactionCard({ txn }: { txn: Transaction }) {
  const typeLabels: Record<Transaction["type"], string> = {
    order_payment: "Order Payment", commission: "Commission", pilot_payout: "Pilot/Courier Payment",
    refund: "Rambursare", subscription: "Abonament", penalty: "Penalitate",
    droneport_fee: "DronePort Fee", vehicle_rental: "Vehicle Rental",
  };
  const typeColors: Record<Transaction["type"], string> = {
    order_payment: "#10B981", commission: "#0066FF", pilot_payout: "#8B5CF6",
    refund: "#F59E0B", subscription: "#10B981", penalty: "#EF4444",
    droneport_fee: "#6366F1", vehicle_rental: "#0891B2",
  };
  const statusColors = { completed: "#10B981", pending: "#F59E0B", failed: "#EF4444", processing: "#0066FF" };
  const isIncome = ["order_payment", "commission", "subscription"].includes(txn.type);

  return (
    <View className="bg-surface border border-border rounded-xl p-3 mb-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: typeColors[txn.type] }} />
            <Text className="text-sm font-medium text-foreground">{typeLabels[txn.type]}</Text>
            {txn.deliveryMode && (
              <Text style={{ fontSize: 12 }}>{MODE_ICONS[txn.deliveryMode]}</Text>
            )}
          </View>
          <Text className="text-xs text-muted mt-0.5">{txn.from} → {txn.to}</Text>
          <Text className="text-[10px] text-muted mt-0.5">{txn.timestamp}{txn.orderId ? ` • ${txn.orderId}` : ""}</Text>
        </View>
        <View className="items-end">
          <Text style={{ color: isIncome ? "#10B981" : "#EF4444", fontWeight: "700", fontSize: 14 }}>
            {isIncome ? "+" : "-"}₱{txn.amount.toFixed(0)}
          </Text>
          <View style={{ backgroundColor: statusColors[txn.status] + "20", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2 }}>
            <Text style={{ color: statusColors[txn.status], fontSize: 9, fontWeight: "600" }}>{txn.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const statusColors = { paid: "#10B981", pending: "#F59E0B", overdue: "#EF4444", draft: "#6B7280" };
  const statusLabels = { paid: "PAID", pending: "PENDING", overdue: "OVERDUE", draft: "DRAFT" };

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{invoice.client}</Text>
          <Text className="text-xs text-muted">{invoice.id} • Scadent: {invoice.dueDate}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[invoice.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[invoice.status], fontSize: 10, fontWeight: "700" }}>{statusLabels[invoice.status]}</Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-xs text-muted">{invoice.items.length} articole</Text>
        <Text className="text-base font-bold text-foreground">₱{invoice.amount.toLocaleString()}</Text>
      </View>
    </View>
  );
}

function DeliveryCostCard({ cost }: { cost: DeliveryCostBreakdown }) {
  const modeColors: Record<string, string> = {
    drone: "#0066FF", auto: "#10B981", van: "#8B5CF6", ebike: "#F59E0B", multimodal: "#6366F1",
  };

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-2">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text style={{ fontSize: 20, marginRight: 8 }}>{MODE_ICONS[cost.mode]}</Text>
          <View>
            <Text className="text-sm font-semibold text-foreground">{MODE_LABELS[cost.mode]}</Text>
            <Text className="text-xs text-muted">{cost.totalDeliveries.toLocaleString()} deliveries</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold text-foreground">{formatCurrency(cost.totalRevenue)}</Text>
          <Text style={{ color: modeColors[cost.mode], fontSize: 10, fontWeight: "600" }}>+{cost.profitMargin}% margin</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Cost mediu/livrare</Text>
          <Text className="text-xs font-semibold text-foreground">₱{cost.avgCostPerDelivery}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Average distance</Text>
          <Text className="text-xs font-semibold text-foreground">{cost.avgDistance} km</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Profit margin</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: cost.profitMargin > 20 ? "#10B981" : cost.profitMargin > 15 ? "#F59E0B" : "#EF4444" }}>{cost.profitMargin}%</Text>
        </View>
      </View>
    </View>
  );
}

export default function AccountingScreen() {
  const [activeTab, setActiveTab] = useState<"overview" | "delivery_costs" | "transactions" | "invoices">("overview");

  const totalRevenue = DELIVERY_COSTS.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalDeliveries = DELIVERY_COSTS.reduce((sum, c) => sum + c.totalDeliveries, 0);

  const tabs = [
    { key: "overview" as const, label: "Summary" },
    { key: "delivery_costs" as const, label: "Costs" },
    { key: "transactions" as const, label: "Transactions" },
    { key: "invoices" as const, label: "Invoices" },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Accounting</Text>
      <Text className="text-sm text-muted mb-4">Financial Operations — Multimodal Delivery</Text>

      {/* Tab Selector */}
      <View className="flex-row bg-surface rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.key ? "bg-primary" : ""}`}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text className={`text-[10px] font-semibold ${activeTab === tab.key ? "text-white" : "text-muted"}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Revenue Card */}
          <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-3">
            <Text className="text-xs text-primary font-medium">Revenue Totale (30 zile)</Text>
            <Text className="text-3xl font-bold text-primary mt-1">{formatCurrency(totalRevenue)}</Text>
            <Text className="text-xs text-muted mt-1">{totalDeliveries.toLocaleString()} deliveries completed</Text>
          </View>

          {/* Mode Breakdown */}
          <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
            <Text className="text-sm font-semibold text-foreground mb-3">Revenue per Delivery Mode</Text>
            {DELIVERY_COSTS.map((cost) => (
              <View key={cost.mode} className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 14, marginRight: 6 }}>{MODE_ICONS[cost.mode]}</Text>
                  <Text className="text-xs text-foreground">{MODE_LABELS[cost.mode]}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 rounded-full bg-background" style={{ width: 80 }}>
                    <View style={{ width: `${(cost.totalRevenue / totalRevenue) * 100}%`, height: "100%", backgroundColor: "#0066FF", borderRadius: 4 }} />
                  </View>
                  <Text className="text-xs font-medium text-foreground">{((cost.totalRevenue / totalRevenue) * 100).toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Commission Structure */}
          <View className="bg-surface border border-border rounded-xl p-4 mb-3">
            <Text className="text-sm font-semibold text-foreground mb-3">Commission Structure per Canal</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">C1 Marketplace (15%)</Text>
              <Text className="text-xs font-medium text-foreground">₱245,200</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">C2 COS (Contract fix)</Text>
              <Text className="text-xs font-medium text-foreground">₱65,000</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">C3 EOC (Tarif guvernamental)</Text>
              <Text className="text-xs font-medium text-foreground">₱11,550</Text>
            </View>
          </View>

          {/* Pending Payouts Alert */}
          <View className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-3">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-sm font-medium text-foreground">Pending Payments</Text>
                <Text className="text-xs text-muted">12 pilots + 5 ground couriers</Text>
              </View>
              <Text className="text-lg font-bold text-warning">₱89.4K</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Delivery Costs Tab */}
      {activeTab === "delivery_costs" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-surface border border-border rounded-xl p-3 mb-4">
            <Text className="text-xs text-muted text-center">Cost comparison per delivery mode — last 30 days</Text>
          </View>
          {DELIVERY_COSTS.map((cost) => (
            <DeliveryCostCard key={cost.mode} cost={cost} />
          ))}
          {/* Cost Comparison Summary */}
          <View className="bg-primary/5 border border-primary/10 rounded-xl p-4 mt-2">
            <Text className="text-sm font-semibold text-foreground mb-2">Concluzii Costs</Text>
            <Text className="text-xs text-muted leading-5">
              • E-Bike offers the best margin (28%) for short distances (&lt;3km){"\n"}
              • Drone is optimal for fast deliveries with 22% margin{"\n"}
              • Multimodal has the highest cost but covers long distances{"\n"}
              • Van-ul este eficient pentru colete grele/voluminoase
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <FlatList
          data={TRANSACTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard txn={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <FlatList
          data={INVOICES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InvoiceCard invoice={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-success/10 rounded-lg p-2 items-center">
                <Text className="text-sm font-bold text-success">{INVOICES.filter(i => i.status === "paid").length}</Text>
                <Text className="text-[10px] text-muted">Paide</Text>
              </View>
              <View className="flex-1 bg-warning/10 rounded-lg p-2 items-center">
                <Text className="text-sm font-bold text-warning">{INVOICES.filter(i => i.status === "pending").length}</Text>
                <Text className="text-[10px] text-muted">Pending</Text>
              </View>
              <View className="flex-1 bg-error/10 rounded-lg p-2 items-center">
                <Text className="text-sm font-bold text-error">{INVOICES.filter(i => i.status === "overdue").length}</Text>
                <Text className="text-[10px] text-muted">Overduee</Text>
              </View>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
