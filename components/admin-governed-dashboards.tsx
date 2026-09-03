import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

export type GovernedAdminRole =
  | "system_administrator"
  | "security_officer"
  | "audit_manager"
  | "configuration_manager"
  | "analytics_manager"
  | "support_coordinator";

type AdminLink = {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
};

const ADMIN_LINKS: Partial<Record<GovernedAdminRole, AdminLink[]>> = {
  system_administrator: [
    { icon: "🏪", title: "Marketplace Overview", subtitle: "Stores, products, trust scores", route: "/admin/marketplace-overview" },
    { icon: "📋", title: "Product Moderation", subtitle: "Pending reviews and governed moderation", route: "/admin/moderation" },
    { icon: "📜", title: "Audit Logs", subtitle: "Persisted activity trail and investigator access", route: "/admin/audit-logs" },
  ],
  security_officer: [
    { icon: "📜", title: "Security Audit Logs", subtitle: "Persisted critical events and access evidence", route: "/admin/audit-logs" },
    { icon: "🔐", title: "Identity Verification", subtitle: "Document and operational-role approvals", route: "/admin/approvals" },
    { icon: "🔔", title: "FCM Push Config", subtitle: "Firebase Cloud Messaging configuration", route: "/admin/fcm-config" },
    { icon: "📊", title: "System Monitoring", subtitle: "Available live transport and push monitoring", route: "/admin/monitoring" },
  ],
  audit_manager: [
    { icon: "📜", title: "Full Audit Log Viewer", subtitle: "Filters, export, phantom mode and actor markers", route: "/admin/audit-logs" },
    { icon: "📑", title: "Authority Evidence Packs", subtitle: "Internal regulator-adaptation evidence packages", route: "/admin/authority-reports" },
    { icon: "🏪", title: "Marketplace Compliance", subtitle: "Store health and governed Marketplace review", route: "/admin/marketplace-overview" },
    { icon: "📦", title: "Product Moderation Audit", subtitle: "Review moderation decisions and evidence", route: "/admin/moderation" },
  ],
};

const ADMIN_COPY: Record<GovernedAdminRole, { title: string; subtitle: string; unavailable?: string }> = {
  system_administrator: {
    title: "System Admin",
    subtitle: "Governed platform administration",
    unavailable: "No certified platform-wide uptime, active-user, or system-health aggregate is currently exposed to this dashboard. Those values are not fabricated.",
  },
  security_officer: {
    title: "Security",
    subtitle: "Governed security operations",
    unavailable: "No certified live threat-level, failed-login, blocked-IP, or active-session aggregate is currently exposed to this dashboard. Security state is not inferred from demo values.",
  },
  audit_manager: {
    title: "Audit",
    subtitle: "Persisted evidence and compliance operations",
    unavailable: "Audit investigation and authority evidence remain available through the governed tools below; no synthetic compliance score or review count is shown.",
  },
  configuration_manager: {
    title: "Configuration",
    subtitle: "Platform configuration governance",
    unavailable: "A governed release/configuration registry with active version, pending-change, deployment-age, and rollback state is not active yet. No version or deployment status is fabricated.",
  },
  analytics_manager: {
    title: "Platform Analytics",
    subtitle: "Cross-channel business intelligence",
    unavailable: "A governed cross-channel analytics read model is not active yet. Revenue, order totals, active-user counts, NPS, and growth metrics are not fabricated from partial channel data.",
  },
  support_coordinator: {
    title: "Support Ops",
    subtitle: "Support team coordination",
    unavailable: "A governed Support ticket and workforce persistence model is not active yet. Ticket counts, online-agent counts, resolution time, escalations, and CSAT are not fabricated.",
  },
};

function AdminLinkCard({ link }: { link: AdminLink }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-xl p-3 mb-2 flex-row items-center"
      activeOpacity={0.7}
      onPress={() => router.push(link.route as any)}
    >
      <Text style={{ fontSize: 16, marginRight: 8 }}>{link.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-medium text-foreground">{link.title}</Text>
        <Text className="text-xs text-muted">{link.subtitle}</Text>
      </View>
      <Text className="text-muted">→</Text>
    </TouchableOpacity>
  );
}

export function AdminGovernedDashboard({ role }: { role: GovernedAdminRole }) {
  const copy = ADMIN_COPY[role];
  const links = ADMIN_LINKS[role] ?? [];

  return (
    <ScreenContainer className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-2xl font-bold text-foreground mb-1">{copy.title}</Text>
        <Text className="text-sm text-muted mb-4">{copy.subtitle}</Text>

        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground">Governed data boundary</Text>
          <Text className="text-sm text-muted mt-2 leading-5">{copy.unavailable}</Text>
        </View>

        {links.length > 0 ? (
          <>
            <Text className="text-base font-semibold text-foreground mb-2">Available governed tools</Text>
            {links.map((link) => <AdminLinkCard key={link.route} link={link} />)}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
