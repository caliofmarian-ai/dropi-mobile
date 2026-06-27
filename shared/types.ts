// DROPi Canonical Shared Types — All 29 Agent Roles + 4 Channels

// ===== CHANNELS =====
export type Channel = "C1" | "C2" | "C3" | "ADMIN";

// ===== ROLES PER CHANNEL =====
// C1 Marketplace (9 roles)
export type C1Role =
  | "customer"
  | "merchant"
  | "delivery_partner"
  | "support_agent"
  | "analyst"
  | "compliance_officer"
  | "fraud_detection"
  | "performance_monitor"
  | "incident_responder";

// C2 COS (8 roles)
export type C2Role =
  | "operations_manager"
  | "logistics_coordinator"
  | "fleet_manager"
  | "c2_compliance_officer"
  | "c2_performance_monitor"
  | "c2_incident_responder"
  | "data_analyst"
  | "quality_assurance";

// C3 EOC (6 roles)
export type C3Role =
  | "emergency_coordinator"
  | "dispatch_manager"
  | "resource_allocator"
  | "communication_officer"
  | "c3_data_analyst"
  | "incident_commander";

// Admin (6 roles)
export type AdminRole =
  | "system_administrator"
  | "security_officer"
  | "audit_manager"
  | "configuration_manager"
  | "analytics_manager"
  | "support_coordinator";

// Union of all roles
export type DropiRole = C1Role | C2Role | C3Role | AdminRole;

// ===== ORDER LIFECYCLE =====
export type OrderStatus =
  | "initiated"
  | "validated"
  | "preparing"
  | "ready"
  | "accepted"
  | "in_execution"
  | "completed"
  | "cancelled"
  | "fallback";

export type DeliveryStatus =
  | "pre_flight"
  | "in_flight"
  | "completed"
  | "fallback"
  | "stopped";

export type AuditSeverity = "info" | "warning" | "critical";

// ===== DATA INTERFACES =====
export interface OrderItem {
  name: string;
  quantity: number;
  weight?: number;
}

export interface PreFlightCheck {
  battery: boolean;
  weather: boolean;
  connection: boolean;
  cargo: boolean;
  route: boolean;
  timestamp: string;
}

export interface DropiUser {
  id: number;
  name: string;
  email: string;
  dropiRole: DropiRole;
  channel: Channel;
  zone: string | null;
  isAuthenticated: boolean;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string | null;
  createdAt: string;
}

export interface DronePort {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  status: "active" | "maintenance" | "offline";
  dronesAvailable: number;
  batterySlots: number;
}

export interface AuditEntry {
  id: string;
  userId: number;
  action: string;
  target: string;
  severity: AuditSeverity;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ===== ROLE METADATA =====
export interface RoleConfig {
  role: DropiRole;
  channel: Channel;
  label: string;
  description: string;
  permissions: string[];
}

// Complete role registry
export const ROLE_CONFIGS: RoleConfig[] = [
  // C1 Marketplace
  { role: "customer", channel: "C1", label: "Customer", description: "Order and track deliveries", permissions: ["create_order", "track_order", "view_history", "create_ticket"] },
  { role: "merchant", channel: "C1", label: "Merchant", description: "Manage store and prepare orders", permissions: ["view_orders", "prepare_order", "mark_ready", "report_issue"] },
  { role: "delivery_partner", channel: "C1", label: "Delivery Partner", description: "Execute drone deliveries", permissions: ["accept_mission", "pre_flight_check", "execute_flight", "stop_flight", "fallback", "post_flight_report"] },
  { role: "support_agent", channel: "C1", label: "Support Agent", description: "Handle customer support tickets", permissions: ["view_tickets", "resolve_ticket", "escalate_ticket", "communicate"] },
  { role: "analyst", channel: "C1", label: "Analyst", description: "Analyze marketplace data", permissions: ["view_analytics", "generate_reports", "export_data"] },
  { role: "compliance_officer", channel: "C1", label: "Compliance Officer", description: "Ensure regulatory compliance", permissions: ["audit_operations", "check_regulations", "flag_issues", "approve_policies"] },
  { role: "fraud_detection", channel: "C1", label: "Fraud Detection", description: "Detect and prevent fraud", permissions: ["monitor_transactions", "flag_suspicious", "block_accounts", "generate_alerts"] },
  { role: "performance_monitor", channel: "C1", label: "Performance Monitor", description: "Monitor KPIs and SLAs", permissions: ["view_metrics", "set_alerts", "generate_reports", "track_sla"] },
  { role: "incident_responder", channel: "C1", label: "Incident Responder", description: "Respond to operational incidents", permissions: ["receive_alerts", "assess_incident", "coordinate_response", "resolve_incident"] },
  // C2 COS
  { role: "operations_manager", channel: "C2", label: "Operations Manager", description: "Oversee contracted operations", permissions: ["review_operations", "approve_contracts", "manage_team", "view_analytics"] },
  { role: "logistics_coordinator", channel: "C2", label: "Logistics Coordinator", description: "Coordinate delivery logistics", permissions: ["coordinate_deliveries", "manage_schedules", "communicate_updates", "resolve_conflicts"] },
  { role: "fleet_manager", channel: "C2", label: "Fleet Manager", description: "Manage drone fleet", permissions: ["view_fleet", "schedule_maintenance", "assign_drones", "monitor_status"] },
  { role: "c2_compliance_officer", channel: "C2", label: "Compliance Officer", description: "Ensure COS compliance", permissions: ["audit_operations", "check_regulations", "flag_issues", "approve_policies"] },
  { role: "c2_performance_monitor", channel: "C2", label: "Performance Monitor", description: "Monitor COS performance", permissions: ["view_metrics", "set_alerts", "generate_reports", "track_sla"] },
  { role: "c2_incident_responder", channel: "C2", label: "Incident Responder", description: "Handle COS incidents", permissions: ["receive_alerts", "assess_incident", "coordinate_response", "resolve_incident"] },
  { role: "data_analyst", channel: "C2", label: "Data Analyst", description: "Analyze operational data", permissions: ["view_data", "create_reports", "identify_trends", "optimize_routes"] },
  { role: "quality_assurance", channel: "C2", label: "Quality Assurance", description: "Ensure delivery quality", permissions: ["inspect_deliveries", "report_issues", "track_quality", "approve_standards"] },
  // C3 EOC
  { role: "emergency_coordinator", channel: "C3", label: "Emergency Coordinator", description: "Coordinate emergency response", permissions: ["receive_alert", "assess_situation", "deploy_drone", "provide_support", "log_incident"] },
  { role: "dispatch_manager", channel: "C3", label: "Dispatch Manager", description: "Dispatch emergency resources", permissions: ["dispatch_resources", "manage_queue", "prioritize_emergencies", "track_response"] },
  { role: "resource_allocator", channel: "C3", label: "Resource Allocator", description: "Allocate emergency resources", permissions: ["allocate_drones", "manage_inventory", "track_availability", "optimize_allocation"] },
  { role: "communication_officer", channel: "C3", label: "Communication Officer", description: "Manage emergency communications", permissions: ["broadcast_alerts", "coordinate_teams", "update_status", "manage_channels"] },
  { role: "c3_data_analyst", channel: "C3", label: "Data Analyst", description: "Analyze emergency response data", permissions: ["analyze_response_times", "track_success_rates", "generate_reports", "identify_improvements"] },
  { role: "incident_commander", channel: "C3", label: "Incident Commander", description: "Command emergency operations", permissions: ["command_operations", "make_decisions", "allocate_resources", "declare_status"] },
  // Admin
  { role: "system_administrator", channel: "ADMIN", label: "System Administrator", description: "Manage platform systems", permissions: ["manage_users", "manage_settings", "monitor_system", "handle_support", "phantom_mode"] },
  { role: "security_officer", channel: "ADMIN", label: "Security Officer", description: "Monitor platform security", permissions: ["monitor_security", "manage_access", "investigate_threats", "enforce_policies"] },
  { role: "audit_manager", channel: "ADMIN", label: "Audit Manager", description: "Oversee platform auditing", permissions: ["view_all_logs", "generate_audit_reports", "investigate_actions", "compliance_review"] },
  { role: "configuration_manager", channel: "ADMIN", label: "Configuration Manager", description: "Manage platform configuration", permissions: ["manage_config", "deploy_changes", "version_control", "rollback"] },
  { role: "analytics_manager", channel: "ADMIN", label: "Analytics Manager", description: "Platform-wide analytics", permissions: ["view_all_data", "create_dashboards", "generate_insights", "predict_trends"] },
  { role: "support_coordinator", channel: "ADMIN", label: "Support Coordinator", description: "Coordinate support operations", permissions: ["manage_agents", "view_tickets", "escalate_issues", "generate_reports"] },
];

// Helper functions
export function getRolesForChannel(channel: Channel): RoleConfig[] {
  return ROLE_CONFIGS.filter((r) => r.channel === channel);
}

export function getRoleConfig(role: DropiRole): RoleConfig | undefined {
  return ROLE_CONFIGS.find((r) => r.role === role);
}

// ===== STATUS HELPERS =====
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  initiated: "Initiated",
  validated: "Validated",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  accepted: "Accepted",
  in_execution: "In Flight",
  completed: "Completed",
  cancelled: "Cancelled",
  fallback: "Fallback",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  initiated: "#6B7280",
  validated: "#0066FF",
  preparing: "#F59E0B",
  ready: "#10B981",
  accepted: "#8B5CF6",
  in_execution: "#0066FF",
  completed: "#10B981",
  cancelled: "#EF4444",
  fallback: "#EF4444",
};

export const CHANNEL_INFO: Record<Channel, { label: string; description: string; color: string }> = {
  C1: { label: "Marketplace", description: "Customer-facing delivery operations", color: "#0066FF" },
  C2: { label: "COS", description: "Contracted Operations System", color: "#8B5CF6" },
  C3: { label: "EOC", description: "Emergency Operations Center", color: "#EF4444" },
  ADMIN: { label: "Admin", description: "Platform Administration", color: "#1F2937" },
};
