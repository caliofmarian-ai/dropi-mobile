import { Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export type GovernedUnavailableRole =
  | "logistics_coordinator"
  | "fleet_manager"
  | "c2_compliance_officer"
  | "c2_performance_monitor"
  | "c2_incident_responder"
  | "data_analyst"
  | "quality_assurance"
  | "emergency_coordinator"
  | "dispatch_manager"
  | "resource_allocator"
  | "communication_officer"
  | "c3_data_analyst"
  | "incident_commander";

const C2_COPY: Record<Exclude<GovernedUnavailableRole,
  | "emergency_coordinator"
  | "dispatch_manager"
  | "resource_allocator"
  | "communication_officer"
  | "c3_data_analyst"
  | "incident_commander"
>, { title: string; description: string }> = {
  logistics_coordinator: {
    title: "Logistics",
    description: "The governed COS logistics read model is not active yet. Simulated schedules, delivery totals, and conflict counts are not shown.",
  },
  fleet_manager: {
    title: "Multimodal Fleet",
    description: "The real fleet registry and maintenance model are not active yet. Fleet counts, battery health, fuel state, and maintenance claims are not fabricated.",
  },
  c2_compliance_officer: {
    title: "COS Compliance",
    description: "The governed COS contract and SLA compliance model is not active yet. Contract audits, violations, and compliance percentages are not fabricated.",
  },
  c2_performance_monitor: {
    title: "COS Performance",
    description: "The governed COS SLA/KPI read model is not active yet. On-time and client-satisfaction metrics are not fabricated.",
  },
  c2_incident_responder: {
    title: "COS Incidents",
    description: "The governed COS incident model is not active yet. Incident counts and route-deviation alerts are not fabricated.",
  },
  data_analyst: {
    title: "Data Analysis",
    description: "The governed COS analysis outputs are not active yet. Reports, insights, optimization scores, costs, and forecasts are not fabricated.",
  },
  quality_assurance: {
    title: "Quality Assurance",
    description: "The governed COS quality-assurance evidence model is not active yet. Inspection counts and quality scores are not fabricated.",
  },
};

const C3_ROLES = new Set<GovernedUnavailableRole>([
  "emergency_coordinator",
  "dispatch_manager",
  "resource_allocator",
  "communication_officer",
  "c3_data_analyst",
  "incident_commander",
]);

function UnavailableDashboard({ title, description }: { title: string; description: string }) {
  return (
    <ScreenContainer className="px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-1">{title}</Text>
      <View className="bg-surface border border-border rounded-xl p-4 mt-3">
        <Text className="text-base font-semibold text-foreground">Governed live data unavailable</Text>
        <Text className="text-sm text-muted mt-2 leading-5">{description}</Text>
      </View>
    </ScreenContainer>
  );
}

export function C2C3GovernedDashboard({ role }: { role: GovernedUnavailableRole }) {
  if (C3_ROLES.has(role)) {
    return (
      <UnavailableDashboard
        title="Emergency Operations"
        description="The governed EOC activation and response backend is not active yet. C2/B2B operational data is intentionally not reused as C3 emergency data."
      />
    );
  }

  const copy = C2_COPY[role as keyof typeof C2_COPY];
  return <UnavailableDashboard title={copy.title} description={copy.description} />;
}
