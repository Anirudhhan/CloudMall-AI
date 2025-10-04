"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

const AdminNavbar = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("cartCount");
      }
      
      // Update auth context
      logout();
      
      // Redirect to login
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Even if API fails, clear local state and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("cartCount");
      }
      logout();
      router.push("/sign-in");
    }
  };

  // Return null while loading
  if (loading) {
    return null;
  }

  // Return null if user is not an admin
  if (user?.role !== "ROLE_ADMIN") {
    return null;
  }

  return (
    <div className="bg-white">
      <header className="border-b border-gray-300">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-medium text-black">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name || "Admin"}
            </span>
            <Link
              href="/"
              className="text-gray-700 hover:text-black text-sm font-light"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default AdminNavbar;