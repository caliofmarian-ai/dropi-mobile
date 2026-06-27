import { Text, View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useDropiAuth } from "@/lib/auth-context";

interface Transaction {
  id: string;
  type: "order_payment" | "commission" | "pilot_payout" | "refund" | "subscription" | "penalty";
  amount: number;
  currency: string;
  from: string;
  to: string;
  status: "completed" | "pending" | "failed" | "processing";
  timestamp: string;
  orderId?: string;
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

interface FinancialSummary {
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  totalRefunds: number;
  netProfit: number;
  pendingPayouts: number;
}

const SUMMARY: FinancialSummary = {
  totalRevenue: 2145000,
  totalCommissions: 321750,
  totalPayouts: 1501500,
  totalRefunds: 42900,
  netProfit: 278850,
  pendingPayouts: 89400,
};

const TRANSACTIONS: Transaction[] = [
  { id: "TXN-001", type: "order_payment", amount: 450, currency: "PHP", from: "Customer #1247", to: "DROPi Escrow", status: "completed", timestamp: "2024-01-16 14:32", orderId: "ORD-4521" },
  { id: "TXN-002", type: "commission", amount: 67.5, currency: "PHP", from: "DROPi Escrow", to: "DROPi Revenue", status: "completed", timestamp: "2024-01-16 14:32", orderId: "ORD-4521" },
  { id: "TXN-003", type: "pilot_payout", amount: 180, currency: "PHP", from: "DROPi Escrow", to: "Pilot #089", status: "processing", timestamp: "2024-01-16 14:35", orderId: "ORD-4521" },
  { id: "TXN-004", type: "refund", amount: 320, currency: "PHP", from: "DROPi Escrow", to: "Customer #1198", status: "completed", timestamp: "2024-01-16 12:15", orderId: "ORD-4498" },
  { id: "TXN-005", type: "subscription", amount: 4999, currency: "PHP", from: "Merchant #034", to: "DROPi Revenue", status: "completed", timestamp: "2024-01-16 09:00" },
  { id: "TXN-006", type: "penalty", amount: 500, currency: "PHP", from: "Pilot #045", to: "DROPi Penalties", status: "pending", timestamp: "2024-01-16 08:45" },
  { id: "TXN-007", type: "order_payment", amount: 890, currency: "PHP", from: "Customer #1302", to: "DROPi Escrow", status: "completed", timestamp: "2024-01-16 07:22", orderId: "ORD-4520" },
  { id: "TXN-008", type: "pilot_payout", amount: 356, currency: "PHP", from: "DROPi Escrow", to: "Pilot #067", status: "completed", timestamp: "2024-01-15 22:10", orderId: "ORD-4515" },
];

const INVOICES: Invoice[] = [
  { id: "INV-001", client: "Enterprise Corp", amount: 125000, currency: "PHP", status: "paid", issuedDate: "2024-01-01", dueDate: "2024-01-15", items: [{ description: "C2 Monthly Service — 500 deliveries", amount: 100000 }, { description: "Priority support", amount: 25000 }] },
  { id: "INV-002", client: "MedSupply Inc", amount: 89000, currency: "PHP", status: "pending", issuedDate: "2024-01-10", dueDate: "2024-01-25", items: [{ description: "C3 Emergency response — 50 deployments", amount: 75000 }, { description: "Equipment rental", amount: 14000 }] },
  { id: "INV-003", client: "FoodChain PH", amount: 45000, currency: "PHP", status: "overdue", issuedDate: "2023-12-15", dueDate: "2024-01-05", items: [{ description: "C2 Contract — 200 deliveries", amount: 40000 }, { description: "Insurance surcharge", amount: 5000 }] },
  { id: "INV-004", client: "City Government", amount: 200000, currency: "PHP", status: "draft", issuedDate: "2024-01-16", dueDate: "2024-02-15", items: [{ description: "C3 Annual emergency contract", amount: 180000 }, { description: "Training & certification", amount: 20000 }] },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}K`;
  return `₱${amount.toFixed(0)}`;
}

function TransactionCard({ txn }: { txn: Transaction }) {
  const typeLabels: Record<Transaction["type"], string> = {
    order_payment: "Order Payment", commission: "Commission", pilot_payout: "Pilot Payout",
    refund: "Refund", subscription: "Subscription", penalty: "Penalty",
  };
  const typeColors: Record<Transaction["type"], string> = {
    order_payment: "#10B981", commission: "#0066FF", pilot_payout: "#8B5CF6",
    refund: "#F59E0B", subscription: "#10B981", penalty: "#EF4444",
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

  return (
    <View className="bg-surface border border-border rounded-xl p-4 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{invoice.client}</Text>
          <Text className="text-xs text-muted">{invoice.id} • Due: {invoice.dueDate}</Text>
        </View>
        <View style={{ backgroundColor: statusColors[invoice.status] + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ color: statusColors[invoice.status], fontSize: 10, fontWeight: "700" }}>{invoice.status.toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-xs text-muted">{invoice.items.length} line items</Text>
        <Text className="text-base font-bold text-foreground">₱{invoice.amount.toLocaleString()}</Text>
      </View>
    </View>
  );
}

export default function AccountingScreen() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "invoices">("overview");

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "transactions" as const, label: "Transactions" },
    { key: "invoices" as const, label: "Invoices" },
  ];

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Accounting</Text>
      <Text className="text-sm text-muted mb-4">Financial Operations</Text>

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
            <Text className="text-xs text-primary font-medium">Total Revenue (30d)</Text>
            <Text className="text-3xl font-bold text-primary mt-1">{formatCurrency(SUMMARY.totalRevenue)}</Text>
          </View>

          {/* Financial Grid */}
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-xs text-muted">Commissions</Text>
              <Text className="text-lg font-bold text-foreground">{formatCurrency(SUMMARY.totalCommissions)}</Text>
              <Text className="text-[10px] text-success">15% rate</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-xs text-muted">Payouts</Text>
              <Text className="text-lg font-bold text-foreground">{formatCurrency(SUMMARY.totalPayouts)}</Text>
              <Text className="text-[10px] text-muted">To pilots & merchants</Text>
            </View>
          </View>

          <View className="flex-row gap-2 mb-3">
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-xs text-muted">Refunds</Text>
              <Text className="text-lg font-bold text-warning">{formatCurrency(SUMMARY.totalRefunds)}</Text>
              <Text className="text-[10px] text-muted">2% of revenue</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-xl p-3">
              <Text className="text-xs text-muted">Net Profit</Text>
              <Text className="text-lg font-bold text-success">{formatCurrency(SUMMARY.netProfit)}</Text>
              <Text className="text-[10px] text-success">13% margin</Text>
            </View>
          </View>

          {/* Pending Payouts Alert */}
          <View className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-3">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-sm font-medium text-foreground">Pending Payouts</Text>
                <Text className="text-xs text-muted">12 pilots awaiting payment</Text>
              </View>
              <Text className="text-lg font-bold text-warning">{formatCurrency(SUMMARY.pendingPayouts)}</Text>
            </View>
          </View>

          {/* Commission Breakdown */}
          <View className="bg-surface border border-border rounded-xl p-4 mb-3">
            <Text className="text-sm font-semibold text-foreground mb-3">Commission Structure</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">C1 Marketplace (15%)</Text>
              <Text className="text-xs font-medium text-foreground">₱245,200</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">C2 COS (Fixed contract)</Text>
              <Text className="text-xs font-medium text-foreground">₱65,000</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">C3 EOC (Government rate)</Text>
              <Text className="text-xs font-medium text-foreground">₱11,550</Text>
            </View>
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
                <Text className="text-[10px] text-muted">Paid</Text>
              </View>
              <View className="flex-1 bg-warning/10 rounded-lg p-2 items-center">
                <Text className="text-sm font-bold text-warning">{INVOICES.filter(i => i.status === "pending").length}</Text>
                <Text className="text-[10px] text-muted">Pending</Text>
              </View>
              <View className="flex-1 bg-error/10 rounded-lg p-2 items-center">
                <Text className="text-sm font-bold text-error">{INVOICES.filter(i => i.status === "overdue").length}</Text>
                <Text className="text-[10px] text-muted">Overdue</Text>
              </View>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
