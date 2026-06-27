import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DropiRole, Channel } from "@/shared/types";

interface DropiUserState {
  id: number;
  name: string;
  email: string;
  dropiRole: DropiRole;
  channel: Channel;
  zone: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: DropiUserState | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectRole: (role: DropiRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@dropi_user";

// Demo users for each role (for development/demo purposes)
const DEMO_USERS: Record<string, DropiUserState> = {
  "client@dropi.app": {
    id: 1,
    name: "Maria Santos",
    email: "client@dropi.app",
    dropiRole: "client",
    channel: "C1",
    zone: "Manila-Central",
    isAuthenticated: true,
  },
  "merchant@dropi.app": {
    id: 2,
    name: "Juan's Kitchen",
    email: "merchant@dropi.app",
    dropiRole: "merchant",
    channel: "C1",
    zone: "Manila-Central",
    isAuthenticated: true,
  },
  "pilot@dropi.app": {
    id: 3,
    name: "Carlos Reyes",
    email: "pilot@dropi.app",
    dropiRole: "pilot",
    channel: "C1",
    zone: "Manila-Central",
    isAuthenticated: true,
  },
  "operator@dropi.app": {
    id: 4,
    name: "Ana Operator",
    email: "operator@dropi.app",
    dropiRole: "operator",
    channel: "C1",
    zone: "Manila-Central",
    isAuthenticated: true,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DropiUserState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted user on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setUser(JSON.parse(stored));
        }
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

    // Default: create a client user for any email
    const newUser: DropiUserState = {
      id: Date.now(),
      name: email.split("@")[0] || "User",
      email: normalizedEmail,
      dropiRole: "client",
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

  const selectRole = useCallback(async (role: DropiRole) => {
    if (user) {
      const updated = { ...user, dropiRole: role };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, selectRole }}>
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
