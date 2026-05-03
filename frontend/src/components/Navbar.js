

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-blue-600"
          >
            AI Analyzer
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/analyze"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
          >
            <BarChart3 size={18} />
            Analyze
          </Link>

          <Link
            href="/dashboard?tab=credits"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
          >
            <CreditCard size={18} />
            Buy Credits
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Welcome{" "}
            <span className="font-semibold text-gray-900">
              {user?.name || "User"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}