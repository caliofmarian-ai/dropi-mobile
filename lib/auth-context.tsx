import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DropiRole, Channel, DropiUser } from "@/shared/types";

interface AuthContextType {
  user: DropiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: DropiRole, channel: Channel) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@dropi_user";

// Demo accounts for ALL 29 agent types + auxiliary
const DEMO_USERS: Record<string, DropiUser> = {
  // C1 Marketplace (9)
  "customer@dropi.app": { id: 1, name: "Maria Santos", email: "customer@dropi.app", dropiRole: "customer", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "merchant@dropi.app": { id: 2, name: "Juan's Kitchen", email: "merchant@dropi.app", dropiRole: "merchant", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "pilot@dropi.app": { id: 3, name: "Carlos Reyes", email: "pilot@dropi.app", dropiRole: "delivery_partner", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "support@dropi.app": { id: 4, name: "Ana Support", email: "support@dropi.app", dropiRole: "support_agent", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "analyst@dropi.app": { id: 5, name: "Rico Analyst", email: "analyst@dropi.app", dropiRole: "analyst", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "compliance@dropi.app": { id: 6, name: "Elena Compliance", email: "compliance@dropi.app", dropiRole: "compliance_officer", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "fraud@dropi.app": { id: 7, name: "Marco Fraud Det.", email: "fraud@dropi.app", dropiRole: "fraud_detection", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "performance@dropi.app": { id: 8, name: "Lisa Performance", email: "performance@dropi.app", dropiRole: "performance_monitor", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  "incident@dropi.app": { id: 9, name: "David Incident", email: "incident@dropi.app", dropiRole: "incident_responder", channel: "C1", zone: "Manila-Central", isAuthenticated: true },
  // C2 COS (8)
  "ops.manager@dropi.app": { id: 10, name: "Pedro Operations", email: "ops.manager@dropi.app", dropiRole: "operations_manager", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "logistics@dropi.app": { id: 11, name: "Sofia Logistics", email: "logistics@dropi.app", dropiRole: "logistics_coordinator", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "fleet@dropi.app": { id: 12, name: "Miguel Fleet", email: "fleet@dropi.app", dropiRole: "fleet_manager", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.compliance@dropi.app": { id: 13, name: "Rosa Compliance", email: "c2.compliance@dropi.app", dropiRole: "c2_compliance_officer", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.performance@dropi.app": { id: 14, name: "Luis Performance", email: "c2.performance@dropi.app", dropiRole: "c2_performance_monitor", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "c2.incident@dropi.app": { id: 15, name: "Carmen Incident", email: "c2.incident@dropi.app", dropiRole: "c2_incident_responder", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "data.analyst@dropi.app": { id: 16, name: "Jorge Data", email: "data.analyst@dropi.app", dropiRole: "data_analyst", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  "qa@dropi.app": { id: 17, name: "Isabel QA", email: "qa@dropi.app", dropiRole: "quality_assurance", channel: "C2", zone: "Manila-Central", isAuthenticated: true },
  // C3 EOC (6)
  "emergency@dropi.app": { id: 18, name: "Rafael Emergency", email: "emergency@dropi.app", dropiRole: "emergency_coordinator", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "dispatch@dropi.app": { id: 19, name: "Teresa Dispatch", email: "dispatch@dropi.app", dropiRole: "dispatch_manager", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "resources@dropi.app": { id: 20, name: "Antonio Resources", email: "resources@dropi.app", dropiRole: "resource_allocator", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "comms@dropi.app": { id: 21, name: "Patricia Comms", email: "comms@dropi.app", dropiRole: "communication_officer", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "c3.analyst@dropi.app": { id: 22, name: "Fernando Analyst", email: "c3.analyst@dropi.app", dropiRole: "c3_data_analyst", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  "commander@dropi.app": { id: 23, name: "Gen. Santos", email: "commander@dropi.app", dropiRole: "incident_commander", channel: "C3", zone: "Manila-Central", isAuthenticated: true },
  // Admin (6)
  "admin@dropi.app": { id: 24, name: "Super Admin", email: "admin@dropi.app", dropiRole: "system_administrator", channel: "ADMIN", zone: null, isAuthenticated: true },
  "security@dropi.app": { id: 25, name: "Security Officer", email: "security@dropi.app", dropiRole: "security_officer", channel: "ADMIN", zone: null, isAuthenticated: true },
  "audit@dropi.app": { id: 26, name: "Audit Manager", email: "audit@dropi.app", dropiRole: "audit_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "config@dropi.app": { id: 27, name: "Config Manager", email: "config@dropi.app", dropiRole: "configuration_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "analytics@dropi.app": { id: 28, name: "Analytics Manager", email: "analytics@dropi.app", dropiRole: "analytics_manager", channel: "ADMIN", zone: null, isAuthenticated: true },
  "support.coord@dropi.app": { id: 29, name: "Support Coordinator", email: "support.coord@dropi.app", dropiRole: "support_coordinator", channel: "ADMIN", zone: null, isAuthenticated: true },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DropiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    const demoUser = DEMO_USERS[normalizedEmail];

    if (demoUser) {
      setUser(demoUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
      return true;
    }

    // Default: create a customer user for any email
    const newUser: DropiUser = {
      id: Date.now(),
      name: email.split("@")[0] || "User",
      email: normalizedEmail,
      dropiRole: "customer",
      channel: "C1",
      zone: "Manila-Central",
      isAuthenticated: true,
    };
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchRole = useCallback(async (role: DropiRole, channel: Channel) => {
    if (user) {
      const updated = { ...user, dropiRole: role, channel };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useDropiAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useDropiAuth must be used within an AuthProvider");
  }
  return context;
}

// Export demo users for the login screen
export const DEMO_ACCOUNTS = DEMO_USERS;
