"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isLowCredits = user?.credits <= 2;

  const expiryDate = user?.creditsExpiry
    ? new Date(user.creditsExpiry)
    : null;

  const daysLeft = expiryDate
    ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-blue-600"
          >
            AI Analyzer
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/analyze"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
          >
            <BarChart3 size={18} />
            Analyze
          </Link>

          {/* 🔥 BUY CREDITS CTA */}
          <Link
            href="/buy-credits"
            className="flex items-center gap-2 text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700"
          >
            <CreditCard size={16} />
            Buy Credits
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* 🔥 CREDIT DISPLAY */}
          <div className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            <span className="font-semibold text-blue-600">
              {user?.credits ?? 0}
            </span>{" "}
            credits
          </div>

          {/* 🔥 EXPIRY */}
          {expiryDate && (
            <div className="text-xs text-gray-500">
              Expires in{" "}
              <span className="font-semibold">
                {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
              </span>
            </div>
          )}

          {/* 🔥 LOW CREDIT WARNING */}
          {isLowCredits && (
            <div className="flex items-center gap-1 text-red-500 text-xs">
              <AlertTriangle size={14} />
              Low credits
            </div>
          )}

          {/* USER */}
          <div className="text-sm text-gray-600">
            Hi{" "}
            <span className="font-semibold text-gray-900">
              {user?.name || "User"}
            </span>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}