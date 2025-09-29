"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface DashboardData {
  user: AdminUser;
  countCart: number;
  categories: any[];
  stats: DashboardStats;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/admin/dashboard`, {
          withCredentials: true,
        });
        
        setDashboardData(response.data);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Access denied. Admin privileges required.");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [API_BASE, router]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/logout`, {}, { withCredentials: true });
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/sign-in");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-2 border-gray-300 border-t-gray-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border border-gray-300 text-gray-700 px-6 py-4 bg-white">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-medium text-black">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              Welcome, {dashboardData?.user?.name}
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-300 min-h-screen">
          <nav className="pt-6">
            <div className="px-6 pb-4">
              <h2 className="text-lg font-medium text-black">MANAGEMENT</h2>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-r-2 border-gray-700"
                >
                  <span className="mr-3 text-gray-600">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/categories"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">📂</span>
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">📦</span>
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/orders"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">🛒</span>
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">👥</span>
                  Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/admins"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">👨‍💼</span>
                  Admins
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/profile"
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-3 text-gray-600">⚙️</span>
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="border border-gray-300 p-6">
              <div className="flex items-center">
                <div className="p-3 border border-gray-300">
                  <span className="text-2xl text-gray-600">📦</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">TOTAL PRODUCTS</h3>
                  <p className="text-2xl font-medium text-black">
                    {dashboardData?.stats?.totalProducts || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 p-6">
              <div className="flex items-center">
                <div className="p-3 border border-gray-300">
                  <span className="text-2xl text-gray-600">📂</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">TOTAL CATEGORIES</h3>
                  <p className="text-2xl font-medium text-black">
                    {dashboardData?.stats?.totalCategories || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 p-6">
              <div className="flex items-center">
                <div className="p-3 border border-gray-300">
                  <span className="text-2xl text-gray-600">🛒</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">TOTAL ORDERS</h3>
                  <p className="text-2xl font-medium text-black">
                    {dashboardData?.stats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-gray-300 mb-10">
            <div className="p-6">
              <h2 className="text-xl font-medium text-black mb-6">QUICK ACTIONS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/categories?action=add"
                  className="flex items-center justify-center p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <span className="mr-2">➕</span>
                  Add Category
                </Link>
                <Link
                  href="/admin/products?action=add"
                  className="flex items-center justify-center p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <span className="mr-2">📦</span>
                  Add Product
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-center p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <span className="mr-2">📋</span>
                  Manage Orders
                </Link>
                <Link
                  href="/admin/admins?action=add"
                  className="flex items-center justify-center p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <span className="mr-2">👨‍💼</span>
                  Add Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-300">
              <div className="p-6">
                <h3 className="text-lg font-medium text-black mb-6">SYSTEM OVERVIEW</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Active Categories</span>
                    <span className="font-medium text-black">
                      {dashboardData?.categories?.filter(c => c.isActive)?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Total Categories</span>
                    <span className="font-medium text-black">
                      {dashboardData?.categories?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-600">Admin Role</span>
                    <span className="font-medium text-gray-700">
                      {dashboardData?.user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-300">
              <div className="p-6">
                <h3 className="text-lg font-medium text-black mb-6">QUICK LINKS</h3>
                <div className="space-y-3">
                  <Link
                    href="/admin/categories"
                    className="block p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-gray-600">📂</span>
                      <span className="font-light">Manage Categories</span>
                    </div>
                  </Link>
                  <Link
                    href="/admin/products"
                    className="block p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-gray-600">📦</span>
                      <span className="font-light">Manage Products</span>
                    </div>
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="block p-4 border border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-gray-600">🛒</span>
                      <span className="font-light">Process Orders</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}