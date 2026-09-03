import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export type C1LiveDashboardRole =
  | "support_agent"
  | "analyst"
  | "compliance_officer"
  | "fraud_detection"
  | "performance_monitor"
  | "incident_responder";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-xl p-3">
      <Text className="text-lg font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted mt-0.5">{label}</Text>
    </View>
  );
}

function SourceUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">{title}</Text>
      <View className="bg-surface border border-border rounded-xl p-4 mt-3">
        <Text className="text-base font-semibold text-foreground">Live data unavailable</Text>
        <Text className="text-sm text-muted mt-2 leading-5">{description}</Text>
      </View>
    </ScreenContainer>
  );
}

function QueryUnavailable({ title }: { title: string }) {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">{title}</Text>
      <View className="bg-surface border border-border rounded-xl p-4 mt-3">
        <Text className="text-sm text-muted">The persisted data source is temporarily unavailable. No fallback or demo values are shown.</Text>
      </View>
    </ScreenContainer>
  );
}

function AnalystDashboard() {
  const query = trpc.dashboard.c1OperationsSummary.useQuery(undefined, { refetchInterval: 30_000 });
  const data = query.data;
  if (!data || data.availability !== "available") return <QueryUnavailable title="Analytics" />;

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-1">Analytics</Text>
        <Text className="text-sm text-muted mb-4">C1 persisted order evidence</Text>
        <View className="flex-row gap-3 mb-3">
          <Metric label="Total Orders" value={String(data.totalOrders)} />
          <Metric label="Completed" value={String(data.completedOrders)} />
        </View>
        <View className="flex-row gap-3 mb-3">
          <Metric label="Completed Revenue" value={`₱${data.completedRevenue.toFixed(2)}`} />
          <Metric label="Avg Delivery" value={data.averageDeliveryMinutes == null ? "—" : `${data.averageDeliveryMinutes.toFixed(1)} min`} />
        </View>
        <View className="flex-row gap-3 mb-3">
          <Metric label="Completion Rate" value={data.completionRate == null ? "—" : `${data.completionRate.toFixed(1)}%`} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ComplianceDashboard() {
  const query = trpc.dashboard.c1AuditSummary.useQuery(undefined, { refetchInterval: 30_000 });
  const data = query.data;
  if (!data || data.availability !== "available") return <QueryUnavailable title="Compliance" />;

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-1">Compliance</Text>
        <Text className="text-sm text-muted mb-4">C1 Audit Core evidence — last {data.periodDays} days</Text>
        <View className="flex-row gap-3 mb-3">
          <Metric label="Audit Events" value={String(data.totalEvents)} />
          <Metric label="Warnings" value={String(data.warnings)} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <Metric label="Critical" value={String(data.critical)} />
        </View>
        <Text className="text-base font-semibold text-foreground mb-2">Recent warning / critical evidence</Text>
        {data.recentAlerts.length === 0 ? (
          <Text className="text-sm text-muted">No warning or critical C1 audit events in this period.</Text>
        ) : (
          data.recentAlerts.map((event) => (
            <View key={event.id} className="bg-surface border border-border rounded-xl p-3 mb-2">
              <Text className="text-sm font-medium text-foreground">{event.title}</Text>
              <Text className="text-xs text-muted mt-1">{event.severity.toUpperCase()} • {new Date(event.occurredAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function PerformanceDashboard() {
  const query = trpc.dashboard.c1OperationsSummary.useQuery(undefined, { refetchInterval: 30_000 });
  const data = query.data;
  if (!data || data.availability !== "available") return <QueryUnavailable title="Performance" />;

  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Performance</Text>
      <Text className="text-sm text-muted mb-4">C1 metrics derived from persisted order lifecycle data</Text>
      <View className="flex-row gap-3 mb-3">
        <Metric label="Completed Orders" value={String(data.completedOrders)} />
        <Metric label="Completion Rate" value={data.completionRate == null ? "—" : `${data.completionRate.toFixed(1)}%`} />
      </View>
      <View className="flex-row gap-3 mb-3">
        <Metric label="Avg Delivery" value={data.averageDeliveryMinutes == null ? "—" : `${data.averageDeliveryMinutes.toFixed(1)} min`} />
      </View>
    </ScreenContainer>
  );
}

function IncidentDashboard() {
  const query = trpc.dashboard.c1AuditSummary.useQuery(undefined, { refetchInterval: 30_000 });
  const data = query.data;
  if (!data || data.availability !== "available") return <QueryUnavailable title="Incidents" />;

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-1">Incidents</Text>
        <Text className="text-sm text-muted mb-4">C1 warning and critical Audit Core evidence</Text>
        <View className="flex-row gap-3 mb-4">
          <Metric label="Warnings (30d)" value={String(data.warnings)} />
          <Metric label="Critical (30d)" value={String(data.critical)} />
        </View>
        {data.recentAlerts.map((event) => (
          <View key={event.id} className="bg-surface border border-border rounded-xl p-3 mb-2">
            <Text className="text-sm font-medium text-foreground">{event.title}</Text>
            <Text className="text-xs text-muted mt-1">{event.severity.toUpperCase()} • {new Date(event.occurredAt).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

export function C1LiveRoleDashboard({ role }: { role: C1LiveDashboardRole }) {
  switch (role) {
    case "analyst":
      return <AnalystDashboard />;
    case "compliance_officer":
      return <ComplianceDashboard />;
    case "performance_monitor":
      return <PerformanceDashboard />;
    case "incident_responder":
      return <IncidentDashboard />;
    case "support_agent":
      return (
        <SourceUnavailable
          title="Support Queue"
          description="The active backend does not yet contain a governed Support ticket persistence contract. Support counts and tickets are therefore not fabricated."
        />
      );
    case "fraud_detection":
      return (
        <SourceUnavailable
          title="Fraud Detection"
          description="The active backend does not yet contain a governed fraud-case persistence contract. Fraud counts and cases are therefore not fabricated."
        />
      );
  }
}
