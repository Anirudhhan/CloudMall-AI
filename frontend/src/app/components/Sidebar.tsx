"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FolderTree, 
  Package, 
  ShoppingCart, 
  Users, 
  ShieldCheck, 
  UserCircle, 
  BarChart3,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const menuItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/categories", icon: FolderTree, label: "Categories" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/admins", icon: ShieldCheck, label: "Admins" },
    { href: "/admin/profile", icon: UserCircle, label: "Profile" },
    { href: "/admin/stats", icon: BarChart3, label: "Stats" },
  ];

  const isActive = (href: string) => pathname === href;

  if (loading) {
    return null; // or a loading skeleton
  }

  if (user?.role !== "ROLE_ADMIN") {
    return null;
  }

  return (
    <div className="bg-white relative">
      <aside
        className={`border-r border-gray-300 min-h-screen transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">MANAGEMENT</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <X className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="pt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-6 py-3 transition-colors relative ${
                      active
                        ? "text-gray-900 bg-gray-100 border-r-4 border-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;