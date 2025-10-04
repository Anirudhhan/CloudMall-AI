"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  Menu,
  X,
  Heart,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function Navbar() {
  const router = useRouter();
  const { user, cartCount, loading, logout: contextLogout, updateCartCount } = useAuth(); // Added updateCartCount
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/product?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("cartCount");
      }
      
      // Update context - this will set both user and cartCount to null/0
      contextLogout();
      setShowUserMenu(false);
      setShowMobileMenu(false);
      
      router.push("/");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      
      // Even if API fails, clear local state
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("cartCount");
      }
      contextLogout();
      router.push("/");
    }
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-20"></div>
      </nav>
    );
  }

  // Only hide navbar if user is ADMIN
  if (user?.role === "ROLE_ADMIN") {
    return null;
  }

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
        isScrolled ? "shadow-md" : "border-b border-gray-200"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-black font-black text-2xl tracking-tighter">
              CLOUDMALL
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e as any)}
                placeholder="SEARCH FOR PRODUCTS"
                className="w-full px-4 py-2.5 border-2 border-gray-200 text-black placeholder:text-gray-400 placeholder:text-sm placeholder:tracking-wide focus:outline-none focus:border-black transition-colors uppercase text-sm"
              />
              <button
                onClick={handleSearch}
                className="absolute right-0 top-0 h-full px-4 text-black hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="flex items-center gap-2 text-black hover:bg-gray-100 px-4 py-2 transition-colors uppercase text-sm font-bold tracking-wide">
                  <User className="w-5 h-5" />
                  <span>{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full pt-2 w-56">
                    <div className="bg-white border border-gray-200 shadow-lg">
                      <Link
                        href="/user/profile"
                        className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </div>
                      </Link>
                      <Link
                        href="/user/orders"
                        className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4" />
                          <span>Orders</span>
                        </div>
                      </Link>
                      <Link
                        href="/user/wishlist"
                        className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4" />
                          <span>Wishlist</span>
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 hover:text-red-600 cursor-pointer text-black hover:bg-gray-100 transition-colors border-t border-gray-200 text-sm uppercase tracking-wide"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-2 text-black hover:bg-gray-100 px-4 py-2 transition-colors uppercase text-sm font-bold tracking-wide"
              >
                <User className="w-5 h-5" />
                <span>Login</span>
              </Link>
            )}

            <Link
              href="/seller"
              className="text-black hover:bg-gray-100 px-4 py-2 transition-colors uppercase text-sm font-bold tracking-wide"
            >
              Sell
            </Link>

            <div className="relative group">
              <button className="flex items-center gap-1 text-black hover:bg-gray-100 px-4 py-2 transition-colors uppercase text-sm font-bold tracking-wide">
                <span>More</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  href="/about"
                  className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                >
                  Contact
                </Link>
                <Link
                  href="/help"
                  className="block px-4 py-3 text-black hover:bg-gray-100 transition-colors text-sm uppercase tracking-wide"
                >
                  Help
                </Link>
              </div>
            </div>

            <Link
              href="/user/cart"
              className="relative flex items-center gap-2 text-black hover:bg-gray-100 px-4 py-2 transition-colors uppercase text-sm font-bold tracking-wide"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-black p-2"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e as any)}
              placeholder="SEARCH FOR PRODUCTS"
              className="w-full px-4 py-2.5 border-2 border-gray-200 text-black placeholder:text-gray-400 placeholder:text-sm focus:outline-none focus:border-black transition-colors uppercase text-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full px-4 text-black"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {user ? (
              <>
                <div className="py-3 px-4 bg-gray-100 mb-2">
                  <p className="font-bold text-black uppercase text-sm tracking-wide">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Customer
                  </p>
                </div>
                <Link
                  href="/user/profile"
                  className="block px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
                  onClick={() => setShowMobileMenu(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/user/orders"
                  className="block px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/user/cart"
                  className="flex items-center justify-between px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 text-black hover:bg-gray-100 border-t border-gray-200 uppercase text-sm tracking-wide"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block px-4 py-3 text-black hover:bg-gray-100 font-bold uppercase text-sm tracking-wide"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="block px-4 py-3 text-black hover:bg-gray-100 font-bold uppercase text-sm tracking-wide"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            <Link
              href="/seller"
              className="block px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
              onClick={() => setShowMobileMenu(false)}
            >
              Become a Seller
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
              onClick={() => setShowMobileMenu(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 text-black hover:bg-gray-100 uppercase text-sm tracking-wide"
              onClick={() => setShowMobileMenu(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}