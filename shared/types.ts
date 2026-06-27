// DROPi Shared Types

export type DropiRole = "client" | "merchant" | "pilot" | "operator";
export type Channel = "C1" | "C2" | "C3" | "admin";

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
  name: string | null;
  email: string | null;
  dropiRole: DropiRole;
  channel: Channel;
  zone: string | null;
}

// Order status display helpers
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
