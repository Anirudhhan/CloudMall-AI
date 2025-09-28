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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {dashboardData?.user?.name}
            </span>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-6">
            <div className="px-4 py-2">
              <h2 className="text-lg font-semibold text-gray-800">Management</h2>
            </div>
            <ul className="mt-4">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-2 border-blue-600"
                >
                  <span className="mr-3">📊</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/categories"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">📂</span>
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">📦</span>
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/orders"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">🛒</span>
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">👥</span>
                  Users
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/admins"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">👨‍💼</span>
                  Admins
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/profile"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="mr-3">⚙️</span>
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats?.totalProducts || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">📂</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Categories</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats?.totalCategories || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.stats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/categories?action=add"
                  className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition duration-200"
                >
                  <span className="mr-2">➕</span>
                  Add Category
                </Link>
                <Link
                  href="/admin/products?action=add"
                  className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition duration-200"
                >
                  <span className="mr-2">📦</span>
                  Add Product
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition duration-200"
                >
                  <span className="mr-2">📋</span>
                  Manage Orders
                </Link>
                <Link
                  href="/admin/admins?action=add"
                  className="flex items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition duration-200"
                >
                  <span className="mr-2">👨‍💼</span>
                  Add Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">System Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Active Categories</span>
                    <span className="font-semibold">
                      {dashboardData?.categories?.filter(c => c.isActive)?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Total Categories</span>
                    <span className="font-semibold">
                      {dashboardData?.categories?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Admin Role</span>
                    <span className="font-semibold text-blue-600">
                      {dashboardData?.user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link
                    href="/admin/categories"
                    className="block p-3 bg-blue-50 rounded hover:bg-blue-100 transition duration-200"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">📂</span>
                      <span className="font-medium">Manage Categories</span>
                    </div>
                  </Link>
                  <Link
                    href="/admin/products"
                    className="block p-3 bg-green-50 rounded hover:bg-green-100 transition duration-200"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">📦</span>
                      <span className="font-medium">Manage Products</span>
                    </div>
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="block p-3 bg-yellow-50 rounded hover:bg-yellow-100 transition duration-200"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">🛒</span>
                      <span className="font-medium">Process Orders</span>
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