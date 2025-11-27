// hooks/useAuth.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // load current user on first mount
  useEffect(() => {
    async function loadUser() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("cs_token")
            : null;

        if (!token) {
          setLoading(false);
          return;
        }

        const data = await apiRequest("/api/auth/me");
        setUser(data.user);
      } catch (err) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cs_token");
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function login(token, userData) {
    if (typeof window !== "undefined") {
      localStorage.setItem("cs_token", token);
    }
    setUser(userData);
  }

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cs_token");
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
