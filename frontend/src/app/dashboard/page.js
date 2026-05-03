"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Link as LinkIcon,
  Target,
  BarChart3,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AnalysisHistory from "@/components/AnalysisHistory";

const API = process.env.NEXT_PUBLIC_API_URL;

// ---------------- CREDIT PLANS ----------------

const CREDIT_PLANS = [
  { id: "plan_basic", name: "Basic", price: 99, credits: 40 },
  { id: "plan_pro", name: "Pro", price: 199, credits: 100 },
  { id: "plan_premium", name: "Premium", price: 299, credits: 200 },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState(null);
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  const activeTab = searchParams.get("tab") || "overview";

  // ---------------- AUTH GUARD ----------------
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setPageLoading(true);

    try {
      const [statsRes, creditRes, historyRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, {
          credentials: "include",
        }),
        fetch(`${API}/api/dashboard/credits`, {
          credentials: "include",
        }),
        fetch(`${API}/api/dashboard/history?page=1&limit=5`, {
          credentials: "include",
        }),
      ]);

      const statsData = await statsRes.json();
      const creditData = await creditRes.json();
      const historyData = await historyRes.json();

      if (!statsRes.ok) throw new Error(statsData.message);

      setStats(statsData.data);
      setCredits(creditData.data?.credits || 0);
      setHistory(historyData.data?.analyses || []);
    } catch (error) {
      toast.error(error.message || "Failed to load dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  // ---------------- PURCHASE ----------------
  const handlePurchase = async (planId) => {
    setPurchasing(planId);

    try {
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Razorpay flow (future integration)
      toast.success("Redirecting to payment...");
    } catch (error) {
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  // ---------------- LOADING ----------------
  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ---------------- OVERVIEW ---------------- */}
        {activeTab === "overview" && (
          <>
            {/* CREDIT CARD */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-8">
              <p className="text-sm text-blue-100">Your Credit Balance</p>
              <h2 className="text-4xl font-bold mt-2">{credits}</h2>
              <p className="text-sm text-blue-100 mt-1">credits available</p>

              <button
                onClick={() => router.push("/dashboard?tab=credits")}
                className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg"
              >
                Buy More
              </button>
            </div>

            {/* STATS */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow p-6">
                <BarChart3 className="mb-3" />
                <p className="text-gray-600">Total Analyses</p>
                <h3 className="text-2xl font-bold">
                  {stats?.totalAnalyses || 0}
                </h3>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <Target className="mb-3" />
                <p className="text-gray-600">Usage</p>
                <h3 className="text-2xl font-bold">
                  {stats?.usageCount || 0}
                </h3>
              </div>
            </div>

            {/* QUICK ACTION */}
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <Link
                href="/analyze"
                className="block border rounded-xl p-5 hover:border-blue-500"
              >
                <LinkIcon className="mb-3" />
                <h3 className="font-semibold">Analyze YouTube Video</h3>
              </Link>
            </div>

            {/* HISTORY */}
            <AnalysisHistory analyses={history} />
          </>
        )}

        {/* ---------------- CREDIT PAGE ---------------- */}
        {activeTab === "credits" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Buy Credits</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {CREDIT_PLANS.map((plan) => (
                <div key={plan.id} className="border p-6 rounded-xl">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-3xl mt-4">₹{plan.price}</p>
                  <p className="text-green-600">{plan.credits} credits</p>

                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing === plan.id}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded"
                  >
                    {purchasing === plan.id
                      ? "Processing..."
                      : "Buy Now"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}