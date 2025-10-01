'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, ChevronDown, Menu, X, Heart, Package } from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'http://localhost:8080';

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/user-info`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.log("User not logged in");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/product?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUserData(null);
      setShowUserMenu(false);
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 shadow-md">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
          <div className="max-w-7xl mx-auto px-4 h-16"></div>
        </div>
      </nav>
    );
  }

  const user = userData?.user;
  const cartCount = userData?.countCart || 0;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'shadow-lg' : 'shadow-md'
    }`}>
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="text-white font-bold text-2xl flex items-end">
                <span>Shop</span>
                <span className="text-yellow-300">Plus</span>
              </div>
              <div className="text-xs text-yellow-300 italic font-semibold bg-yellow-300/20 px-2 py-0.5 rounded">
                Premium
              </div>
            </Link>

            <div className="hidden md:flex flex-1 max-w-2xl mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e as any)}
                  placeholder="Search for products, brands and more..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-md"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-0 top-0 h-full px-4 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowUserMenu(true)}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <button className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-slate-200">
                      <Link
                        href={user.role === 'ROLE_ADMIN' ? '/admin/profile' : '/user/profile'}
                        className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </div>
                      </Link>
                      <Link
                        href="/user/orders"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4" />
                          <span>Orders</span>
                        </div>
                      </Link>
                      <Link
                        href="/user/wishlist"
                        className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4" />
                          <span>Wishlist</span>
                        </div>
                      </Link>
                      {user.role === 'ROLE_ADMIN' && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2.5 text-slate-700 hover:bg-blue-50 transition-colors border-t border-slate-200 mt-2 pt-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-blue-600 font-semibold">Admin Dashboard</span>
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200 mt-2"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}

              <Link
                href="/seller"
                className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Become a Seller
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors font-medium">
                  <span>More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/about" className="block px-4 py-2 text-slate-700 hover:bg-blue-50 transition-colors">
                    About Us
                  </Link>
                  <Link href="/contact" className="block px-4 py-2 text-slate-700 hover:bg-blue-50 transition-colors">
                    Contact
                  </Link>
                  <Link href="/help" className="block px-4 py-2 text-slate-700 hover:bg-blue-50 transition-colors">
                    Help Center
                  </Link>
                </div>
              </div>

              <Link
                href="/user/cart"
                className="relative flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white p-2"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className="md:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e as any)}
                placeholder="Search for products..."
                className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <button
                onClick={handleSearch}
                className="absolute right-0 top-0 h-full px-4 text-blue-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {user ? (
              <>
                <div className="py-3 px-4 bg-blue-50 rounded-lg mb-2">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.role === 'ROLE_ADMIN' ? 'Admin' : 'Customer'}</p>
                </div>
                <Link
                  href={user.role === 'ROLE_ADMIN' ? '/admin/profile' : '/user/profile'}
                  className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/user/orders"
                  className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/user/cart"
                  className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    href="/admin/dashboard"
                    className="block px-4 py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg border-t border-slate-200 mt-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg border-t border-slate-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            <Link
              href="/seller"
              className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              Become a Seller
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg"
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