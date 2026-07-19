"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter, usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  // ======================================================
  // AUTH
  // ======================================================

  const { user, logout } =
    useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const isDarkTheme = pathname?.startsWith("/result") || pathname?.startsWith("/login");

  // ======================================================
  // STATE
  // ======================================================

  const [mobileOpen, setMobileOpen] =
    useState(false);

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = async () => {
    await logout();

    router.push("/login");
  };

  // ======================================================
  // CREDIT INFO
  // ======================================================

  const credits =
    user?.credits || 0;

  const isLowCredits =
    credits <= 2;

  const expiryDate =
    user?.creditsExpiry
      ? new Date(
          user.creditsExpiry
        )
      : null;

  const daysLeft =
    expiryDate
      ? Math.ceil(
          (expiryDate -
            new Date()) /
            (1000 *
              60 *
              60 *
              24)
        )
      : 0;

  // ======================================================
  // LINKS
  // ======================================================

  const links = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Analyze",
      href: "/analyze",
      icon: BarChart3,
    },
  ];

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <>
      {/* ======================================================
          NAVBAR
      ====================================================== */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isDarkTheme
          ? "border-white/10 bg-[#080a12]/80 text-white"
          : "border-slate-200/80 bg-white/80 text-slate-900"
      } backdrop-blur-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]`}>

        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="h-20 flex items-center justify-between">

            {/* ======================================================
                LEFT (BRAND & LINKS)
            ====================================================== */}
            <div className="flex items-center gap-8">
              {/* LOGO */}
              <Link href="/dashboard" className="flex items-center gap-3.5 group">
                <div className="w-[46px] h-[46px] rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_4px_15px_rgba(59,130,246,0.35)] group-hover:scale-102 transition-transform duration-300">
                  <Sparkles className="text-white w-5.5 h-5.5" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent leading-none">
                    AI Analyzer
                  </h1>
                  <p className={`text-[10px] uppercase tracking-widest font-black mt-1.5 ${
                    isDarkTheme ? "text-gray-500" : "text-slate-400"
                  }`}>
                    Learning OS
                  </p>
                </div>
              </Link>

              {/* DESKTOP LINKS */}
              <div className="hidden lg:flex items-center gap-1.5 ml-4">
                {links.map((link, index) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={index}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? isDarkTheme
                            ? "bg-white/10 text-white shadow-sm"
                            : "bg-slate-100 text-slate-900 shadow-sm"
                          : isDarkTheme
                            ? "text-gray-400 hover:bg-white/5 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{link.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ======================================================
                RIGHT (USER STATS & ACTIONS)
            ====================================================== */}
            <div className="hidden lg:flex items-center gap-4">
              {/* LOW CREDIT ALERT */}
              {isLowCredits && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  <AlertTriangle size={14} className="animate-pulse" />
                  <span>Low Credits</span>
                </motion.div>
              )}

              {/* CREDITS CARD */}
              <div className="relative group overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.03)] hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  <Zap size={14} className="fill-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold leading-none">
                    Credits
                  </div>
                  <div className={`text-base font-black leading-none mt-1 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {credits}
                  </div>
                </div>
              </div>

              {/* EXPIRY STATUS BADGE */}
              {expiryDate && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold border ${
                  daysLeft > 0
                    ? isDarkTheme
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isDarkTheme
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    daysLeft > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span>
                    {daysLeft > 0 ? `Active · ${daysLeft} days` : "Expired"}
                  </span>
                </div>
              )}

              {/* BUY BUTTON */}
              <Link
                href="/buy-credits"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm hover:-translate-y-0.5 active:scale-98 transition-all duration-200 ${
                  isDarkTheme
                    ? "bg-white text-slate-950 hover:bg-slate-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(15,23,42,0.08)]"
                }`}
              >
                <CreditCard size={15} />
                <span>Buy Credits</span>
              </Link>

              {/* PROFILE CHIP */}
              <div className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl border ${
                isDarkTheme 
                  ? "bg-white/5 text-white border-white/5" 
                  : "bg-slate-50 text-slate-800 border-slate-200"
              }`}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="max-w-[120px]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 leading-none">
                    Account
                  </div>
                  <div className={`font-bold text-xs truncate mt-0.5 ${isDarkTheme ? "text-gray-200" : "text-slate-800"}`}>
                    {user?.name || "User"}
                  </div>
                </div>
              </div>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm hover:-translate-y-0.5 active:scale-98 transition-all duration-200 ${
                  isDarkTheme
                    ? "bg-white/5 text-gray-400 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>

            {/* ======================================================
                MOBILE TOGGLE BUTTON
            ====================================================== */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-95 ${
                isDarkTheme ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>
      </nav>

      {/* ======================================================
          MOBILE NAVIGATION DRAWER
      ====================================================== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`lg:hidden fixed top-20 left-0 right-0 z-40 border-b shadow-2xl ${
              isDarkTheme
                ? "bg-[#080a12]/95 border-white/10 text-white"
                : "bg-white/95 border-slate-200 text-slate-900"
            } backdrop-blur-2xl`}
          >
            <div className="p-6 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
              
              {/* USER PROFILE DRAWER CARD */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-blue-100 text-xs font-bold uppercase tracking-wider">
                      Welcome Back
                    </div>
                    <div className="text-lg font-black mt-0.5">
                      {user?.name || "User"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="text-blue-200 text-xs font-bold uppercase tracking-wider">
                      Available Credits
                    </div>
                    <div className="text-3xl font-black mt-1">
                      {credits}
                    </div>
                  </div>
                  <Crown className="w-8 h-8 text-yellow-300 drop-shadow-md" />
                </div>
              </div>

              {/* NAVIGATION LINKS */}
              <div className="space-y-2">
                {links.map((link, index) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={index}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                        isActive
                          ? isDarkTheme
                            ? "bg-white/10 text-white shadow-sm"
                            : "bg-slate-100 text-slate-900 shadow-sm"
                          : isDarkTheme
                            ? "text-gray-400 hover:bg-white/5 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{link.title}</span>
                    </Link>
                  );
                })}

                {/* EXPIRY BADGE (MOBILE) */}
                {expiryDate && (
                  <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-bold border ${
                    daysLeft > 0
                      ? isDarkTheme
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isDarkTheme
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      daysLeft > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                    }`} />
                    <span>
                      Validity Status: {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
                    </span>
                  </div>
                )}

                {/* BUY BUTTON */}
                <Link
                  href="/buy-credits"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-sm ${
                    isDarkTheme
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Buy Credits</span>
                </Link>

                {/* LOGOUT BUTTON */}
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isDarkTheme
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100/50"
                  }`}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}