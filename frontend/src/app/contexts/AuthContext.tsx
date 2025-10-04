"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
}
//TODO: FIX THE CART MAKE IT LIVE
interface AuthContextType {
  user: User | null;
  cartCount: number;  
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateCartCount: (count: number) => void;  
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);  
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user-info`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCartCount(data.countCart || 0);  
        
        // Sync with localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("cartCount", (data.countCart || 0).toString());
        }
      } else {
        setUser(null);
        setCartCount(0);
      }
    } catch (error) {
      console.log("User not logged in");
      setUser(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    await fetchUserData();
  };

  const updateCartCount = (count: number) => {
    setCartCount(count);
    if (typeof window !== 'undefined') {
      localStorage.setItem("cartCount", count.toString());
    }
  };

  const logout = () => {
    setUser(null);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, cartCount, loading, refreshUser, updateCartCount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}