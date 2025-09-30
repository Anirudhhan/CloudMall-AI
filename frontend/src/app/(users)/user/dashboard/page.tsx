"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profileImage: string;
  role: string;
}

interface DashboardData {
  authenticated: boolean;
  user: User;
  cartCount: number;
  categories: any[];
}

interface RecentOrder {
  id: number;
  orderId: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

export default function UserDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/user/dashboard`, {
          withCredentials: true,
        });
        
        if (!response.data.authenticated) {
          router.push("/login");
          return;
        }

        setDashboardData(response.data);
        
        // Fetch recent orders
        try {
          const ordersResponse = await axios.get(`${API_BASE}/api/user/orders`, {
            withCredentials: true,
          });
          
          if (ordersResponse.data.success) {
            // Get only the 5 most recent orders
            setRecentOrders(ordersResponse.data.orders.slice(0, 5));
          }
        } catch (orderError) {
          console.error("Error fetching orders:", orderError);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Please login to access your dashboard");
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
      localStorage.removeItem("user");
      localStorage.removeItem("cartCount");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) return "bg-green-100 text-green-800";
    if (statusLower.includes("cancelled")) return "bg-red-100 text-red-800";
    if (statusLower.includes("progress") || statusLower.includes("packed")) return "bg-blue-100 text-blue-800";
    if (statusLower.includes("delivery")) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                CloudMall
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {dashboardData?.user?.name}
              </span>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Continue Shopping
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {dashboardData?.user?.profileImage && dashboardData.user.profileImage !== "default.jpg" ? (
                  <img
                    src={`${API_BASE}/img/profile_img/${dashboardData.user.profileImage}`}
                    alt={dashboardData?.user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-blue-600">👤</span>
                )}
              </div>
              <h3 className="font-semibold text-lg">{dashboardData?.user?.name}</h3>
              <p className="text-sm text-gray-500">{dashboardData?.user?.email}</p>
            </div>

            <nav className="space-y-2">
              <Link
                href="/user/dashboard"
                className="block px-4 py-2 bg-blue-50 text-blue-600 rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/user/orders"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                My Orders
              </Link>
              <Link
                href="/user/cart"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded flex justify-between items-center"
              >
                <span>Shopping Cart</span>
                {dashboardData && dashboardData.cartCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {dashboardData.cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/user/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Profile Settings
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Cart Items</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.cartCount || 0}
                    </p>
                  </div>
                </div>
                <Link
                  href="/user/cart"
                  className="mt-4 block text-center text-blue-600 text-sm hover:underline"
                >
                  View Cart
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {recentOrders.length}
                    </p>
                  </div>
                </div>
                <Link
                  href="/user/orders"
                  className="mt-4 block text-center text-blue-600 text-sm hover:underline"
                >
                  View All Orders
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="text-lg font-bold text-gray-900">
                      2024
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
                    href="/products"
                    className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition duration-200"
                  >
                    <span className="mr-2">🛍️</span>
                    Browse Products
                  </Link>
                  <Link
                    href="/user/cart"
                    className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition duration-200"
                  >
                    <span className="mr-2">🛒</span>
                    View Cart
                  </Link>
                  <Link
                    href="/user/orders"
                    className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition duration-200"
                  >
                    <span className="mr-2">📦</span>
                    Track Orders
                  </Link>
                  <Link
                    href="/user/profile"
                    className="flex items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition duration-200"
                  >
                    <span className="mr-2">⚙️</span>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                  <Link
                    href="/user/orders"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View All
                  </Link>
                </div>
                
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link
                      href="/products"
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="mb-2 md:mb-0">
                            <h3 className="font-semibold text-gray-800">
                              Order #{order.orderId}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">
                                ${order.totalAmount?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.itemCount} item(s)
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            <Link
                              href={`/user/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{dashboardData?.user?.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500 mb-1">Mobile Number</p>
                    <p className="font-medium">{dashboardData?.user?.mobileNumber}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-medium">
                      {dashboardData?.user?.address}, {dashboardData?.user?.city}, {dashboardData?.user?.state} - {dashboardData?.user?.pincode}
                    </p>
                  </div>
                </div>
                <Link
                  href="/user/profile"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit Information →
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}