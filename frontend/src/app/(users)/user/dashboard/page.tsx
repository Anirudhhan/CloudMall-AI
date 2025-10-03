"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Package, User, Settings, LogOut, ArrowRight } from "lucide-react";

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
        const response = await fetch(`${API_BASE}/api/user/dashboard`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.authenticated) {
          router.push("/sign-in");
          return;
        }

        setDashboardData(data);
        
        // Fetch recent orders
        try {
          const ordersResponse = await fetch(`${API_BASE}/api/user/orders`, {
            credentials: 'include'
          });
          
          const ordersData = await ordersResponse.json();
          
          if (ordersData.success) {
            setRecentOrders(ordersData.orders.slice(0, 5));
          }
        } catch (orderError) {
          console.error("Error fetching orders:", orderError);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Please login to access your dashboard");
          setTimeout(() => router.push("/sign-in"), 2000);
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
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("cartCount");
      }
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/sign-in");
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) return "bg-black text-white";
    if (statusLower.includes("cancelled")) return "bg-red-600 text-white";
    if (statusLower.includes("progress") || statusLower.includes("packed")) return "bg-gray-800 text-white";
    if (statusLower.includes("delivery")) return "bg-gray-600 text-white";
    return "bg-gray-200 text-black";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-red-50 border-2 border-red-600 text-red-600 px-6 py-4 font-bold uppercase tracking-wider">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-black uppercase tracking-widest">
              CLOUDMALL
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-sm text-black font-bold uppercase tracking-wider">
                {dashboardData?.user?.name}
              </span>
              <Link
                href="/"
                className="text-black hover:underline text-sm font-bold uppercase tracking-wider"
              >
                SHOP
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-black text-white px-6 py-2 font-bold hover:bg-gray-900 uppercase tracking-wider text-sm"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 bg-white border border-gray-200 p-8">
            <div className="text-center mb-8 pb-8 border-b border-gray-200">
              <div className="w-24 h-24 mx-auto bg-black rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {dashboardData?.user?.profileImage && dashboardData.user.profileImage !== "default.jpg" ? (
                  <img
                    src={`${API_BASE}/img/profile_img/${dashboardData.user.profileImage}`}
                    alt={dashboardData?.user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <h3 className="font-bold text-lg text-black uppercase tracking-wider">{dashboardData?.user?.name}</h3>
              <p className="text-sm text-gray-600 mt-1 uppercase tracking-wide">{dashboardData?.user?.email}</p>
            </div>

            <nav className="space-y-2">
              <Link
                href="/user/dashboard"
                className="block px-4 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm"
              >
                DASHBOARD
              </Link>
              <Link
                href="/user/orders"
                className="block px-4 py-3 text-black hover:bg-gray-100 font-bold uppercase tracking-wider text-sm border border-gray-200"
              >
                MY ORDERS
              </Link>
              <Link
                href="/user/cart"
                className="block px-4 py-3 text-black hover:bg-gray-100 font-bold uppercase tracking-wider text-sm border border-gray-200 flex justify-between items-center"
              >
                <span>CART</span>
                {dashboardData && dashboardData.cartCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1">
                    {dashboardData.cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/user/profile"
                className="block px-4 py-3 text-black hover:bg-gray-100 font-bold uppercase tracking-wider text-sm border border-gray-200"
              >
                PROFILE
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="w-8 h-8 text-black" />
                  <p className="text-4xl font-bold text-black">
                    {dashboardData?.cartCount || 0}
                  </p>
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2">CART ITEMS</h3>
                <Link
                  href="/user/cart"
                  className="mt-4 flex items-center gap-2 text-black hover:underline font-bold text-sm uppercase tracking-wider"
                >
                  VIEW CART
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-black" />
                  <p className="text-4xl font-bold text-black">
                    {recentOrders.length}
                  </p>
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2">TOTAL ORDERS</h3>
                <Link
                  href="/user/orders"
                  className="mt-4 flex items-center gap-2 text-black hover:underline font-bold text-sm uppercase tracking-wider"
                >
                  VIEW ALL
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <User className="w-8 h-8 text-black" />
                  <p className="text-4xl font-bold text-black">2024</p>
                </div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2">MEMBER SINCE</h3>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 mb-12">
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-xl font-bold text-black uppercase tracking-widest">QUICK ACTIONS</h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/product"
                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-black hover:bg-black hover:text-white transition-all group"
                  >
                    <ShoppingCart className="w-8 h-8 mb-3 group-hover:text-white" />
                    <span className="font-bold uppercase tracking-wider text-sm">BROWSE</span>
                  </Link>
                  <Link
                    href="/user/cart"
                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-black hover:bg-black hover:text-white transition-all group"
                  >
                    <ShoppingCart className="w-8 h-8 mb-3 group-hover:text-white" />
                    <span className="font-bold uppercase tracking-wider text-sm">VIEW CART</span>
                  </Link>
                  <Link
                    href="/user/orders"
                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-black hover:bg-black hover:text-white transition-all group"
                  >
                    <Package className="w-8 h-8 mb-3 group-hover:text-white" />
                    <span className="font-bold uppercase tracking-wider text-sm">TRACK</span>
                  </Link>
                  <Link
                    href="/user/profile"
                    className="flex flex-col items-center justify-center p-6 bg-white border-2 border-black hover:bg-black hover:text-white transition-all group"
                  >
                    <Settings className="w-8 h-8 mb-3 group-hover:text-white" />
                    <span className="font-bold uppercase tracking-wider text-sm">SETTINGS</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 mb-12">
              <div className="p-8 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-black uppercase tracking-widest">RECENT ORDERS</h2>
                  <Link
                    href="/user/orders"
                    className="text-black hover:underline text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    VIEW ALL
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              <div className="p-8">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-6 uppercase tracking-wider">NO ORDERS YET</p>
                    <Link
                      href="/product"
                      className="inline-block bg-black text-white px-8 py-3 font-bold hover:bg-gray-900 uppercase tracking-widest text-sm"
                    >
                      START SHOPPING
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 p-6 hover:border-black transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-black uppercase tracking-wider mb-1">
                              #{order.orderId}
                            </h3>
                            <p className="text-sm text-gray-600 uppercase tracking-wide">
                              {new Date(order.orderDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-black text-lg">
                                RS.{order.totalAmount?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-sm text-gray-600 uppercase tracking-wide">
                                {order.itemCount} ITEM(S)
                              </p>
                            </div>
                            <span
                              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            <Link
                              href={`/user/orders/${order.id}`}
                              className="text-black hover:underline text-sm font-bold uppercase tracking-wider"
                            >
                              VIEW
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
            <div className="bg-white border border-gray-200">
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-xl font-bold text-black uppercase tracking-widest">ACCOUNT INFORMATION</h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-2 font-bold uppercase tracking-widest">EMAIL</p>
                    <p className="font-medium text-black">{dashboardData?.user?.email}</p>
                  </div>
                  <div className="p-6 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-2 font-bold uppercase tracking-widest">MOBILE</p>
                    <p className="font-medium text-black">{dashboardData?.user?.mobileNumber}</p>
                  </div>
                  <div className="p-6 bg-gray-50 md:col-span-2">
                    <p className="text-xs text-gray-600 mb-2 font-bold uppercase tracking-widest">ADDRESS</p>
                    <p className="font-medium text-black">
                      {dashboardData?.user?.address}, {dashboardData?.user?.city}, {dashboardData?.user?.state} - {dashboardData?.user?.pincode}
                    </p>
                  </div>
                </div>
                <Link
                  href="/user/profile"
                  className="mt-6 inline-flex items-center gap-2 text-black hover:underline text-sm font-bold uppercase tracking-wider"
                >
                  EDIT INFORMATION
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}