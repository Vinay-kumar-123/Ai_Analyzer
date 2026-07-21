"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/api/auth/me");
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const register = async ({ name, email, password, role }) => {
    try {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });

      if (response.data.success) {
        setUser(response.data.user);

        return {
          success: true,
          message: response.data.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        setUser(response.data.user);

        return {
          success: true,
          message: response.data.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const refreshSession = async () => {
    try {
      await api.post("/api/auth/refresh");
      await fetchCurrentUser();
    } catch {
      setUser(null);
    }
  };

  const updateCredits = (newCredits) => {
    setUser((prev) => ({
      ...prev,
      credits: newCredits,
    }));
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        updateCredits,
        refreshSession,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
