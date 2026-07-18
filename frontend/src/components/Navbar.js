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

      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isDarkTheme
          ? "border-white/10 bg-[#080a12]/80 text-white"
          : "border-slate-200 bg-white/85 text-slate-900"
      } backdrop-blur-2xl shadow-sm`}>

        <div className="max-w-7xl mx-auto px-4 lg:px-6">

          <div className="h-20 flex items-center justify-between">

            {/* ======================================================
                LEFT
            ====================================================== */}

            <div className="flex items-center gap-10">

              {/* LOGO */}
              <Link
                href="/dashboard"
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-md">

                  <Sparkles className="text-white w-6 h-6" />

                </div>

                <div>

                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Analyzer
                  </h1>

                  <p className={`text-xs -mt-1 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    Learning OS
                  </p>

                </div>

              </Link>

              {/* DESKTOP LINKS */}
              <div className="hidden lg:flex items-center gap-2">

                {links.map(
                  (
                    link,
                    index
                  ) => {
                    const Icon =
                      link.icon;

                    return (
                      <Link
                        key={index}
                        href={
                          link.href
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium ${
                          isDarkTheme
                            ? "text-gray-300 hover:bg-white/5 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon size={18} />

                        {
                          link.title
                        }
                      </Link>
                    );
                  }
                )}

              </div>

            </div>

            {/* ======================================================
                RIGHT
            ====================================================== */}

            <div className="hidden lg:flex items-center gap-4">

              {/* LOW CREDIT */}
              {isLowCredits && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}

                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}

                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-2xl text-sm font-medium"
                >
                  <AlertTriangle
                    size={16}
                  />

                  Low Credits
                </motion.div>
              )}

              {/* CREDITS */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-md">

                <div className="flex items-center gap-3">

                  <Zap
                    size={18}
                  />

                  <div>

                    <div className="text-xs text-blue-100">
                      Credits
                    </div>

                    <div className="font-bold text-lg leading-none mt-1">
                      {credits}
                    </div>

                  </div>

                </div>

              </div>

              {/* EXPIRY */}
              {expiryDate && (
                <div className={`px-4 py-3 rounded-2xl ${isDarkTheme ? "bg-white/5 text-white" : "bg-slate-100 text-slate-800"}`}>

                  <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    Validity
                  </div>

                  <div className="font-semibold text-sm mt-1">
                    {daysLeft >
                    0
                      ? `${daysLeft} days`
                      : "Expired"}
                  </div>

                </div>
              )}

              {/* BUY */}
              <Link
                href="/buy-credits"
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition shadow-sm ${
                  isDarkTheme
                    ? "bg-white text-slate-950 hover:bg-slate-100"
                    : "bg-slate-900 text-white hover:bg-slate-850"
                }`}
              >
                <CreditCard
                  size={18}
                />

                Buy Credits
              </Link>

              {/* USER */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                isDarkTheme ? "bg-white/5 text-white" : "bg-slate-100 text-slate-800"
              }`}>

                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">

                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "U"}

                </div>

                <div>

                  <div className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                    Logged in
                  </div>

                  <div className="font-semibold text-sm">
                    {user?.name ||
                      "User"}
                  </div>

                </div>

              </div>

              {/* LOGOUT */}
              <button
                onClick={
                  handleLogout
                }
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
              >
                <LogOut
                  size={18}
                />

                Logout
              </button>

            </div>

            {/* ======================================================
                MOBILE BUTTON
            ====================================================== */}

            <button
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
              className={`lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                isDarkTheme ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {mobileOpen ? (
                <X />
              ) : (
                <Menu />
              )}
            </button>

          </div>

        </div>

      </nav>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      <AnimatePresence>

        {mobileOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            exit={{
              opacity: 0,
              y: -20,
            }}

            className="lg:hidden fixed top-20 left-0 right-0 z-40 bg-white border-b shadow-2xl"
          >
            <div className="p-6 space-y-4">

              {/* USER */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-5 text-white">

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">

                    {user?.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "U"}

                  </div>

                  <div>

                    <div className="text-blue-100 text-sm">
                      Welcome
                    </div>

                    <div className="text-xl font-bold">
                      {user?.name}
                    </div>

                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between">

                  <div>

                    <div className="text-blue-100 text-sm">
                      Credits
                    </div>

                    <div className="text-3xl font-bold">
                      {credits}
                    </div>

                  </div>

                  <Crown className="w-10 h-10 text-yellow-300" />

                </div>

              </div>

              {/* LINKS */}
              <div className="space-y-3">

                {links.map(
                  (
                    link,
                    index
                  ) => {
                    const Icon =
                      link.icon;

                    return (
                      <Link
                        key={index}
                        href={
                          link.href
                        }
                        onClick={() =>
                          setMobileOpen(
                            false
                          )
                        }
                        className="flex items-center gap-3 bg-gray-100 hover:bg-blue-50 px-5 py-4 rounded-2xl transition"
                      >
                        <Icon
                          size={20}
                        />

                        {
                          link.title
                        }
                      </Link>
                    );
                  }
                )}

                {/* BUY */}
                <Link
                  href="/buy-credits"
                  onClick={() =>
                    setMobileOpen(
                      false
                    )
                  }
                  className="flex items-center justify-center gap-2 bg-black text-white px-5 py-4 rounded-2xl font-semibold"
                >
                  <CreditCard
                    size={18}
                  />

                  Buy Credits
                </Link>

                {/* LOGOUT */}
                <button
                  onClick={
                    handleLogout
                  }
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-4 rounded-2xl font-semibold"
                >
                  <LogOut
                    size={18}
                  />

                  Logout
                </button>

              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}