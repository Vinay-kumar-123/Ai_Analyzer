"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Link as LinkIcon,
  Globe,
  Loader2,
  Target,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

// ✅ FIXED VALUES (backend compatible)
const LANGUAGES = [
  { label: "English", value: "english" },
  { label: "Hinglish", value: "hinglish" },
];

const GOALS = [
  { label: "Student (Learn)", value: "student" },
  { label: "Developer (Build)", value: "developer" },
  { label: "Job Seeker", value: "job_seeker" },
];

export default function AnalyzePage() {
  const router = useRouter();

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("english");
  const [goal, setGoal] = useState("student");
  const [loading, setLoading] = useState(false);

  // ---------------- VALIDATION ----------------
  const validateUrl = (url) => {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be")
    );
  };

  // ---------------- HANDLE ANALYZE ----------------
  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      return toast.error("Enter YouTube URL");
    }

    if (!validateUrl(youtubeUrl)) {
      return toast.error("Invalid YouTube URL");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/analyze/youtube`, {
        method: "POST",
        credentials: "include", // 🔐 cookie auth
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtubeUrl,
          language,
          goal,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Analysis started 🚀");

      // 🔥 IMPORTANT: redirect to result page
      router.push(`/result/${data.analysisId}`);
    } catch (error) {
      toast.error(error.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Analyze YouTube Video
          </h1>
          <p className="text-gray-600 mt-2">
            Convert content into actionable insights
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow p-8">
          {/* TITLE */}
          <div className="flex items-center gap-3 mb-6">
            <FaYoutube className="text-red-500" size={28} />
            <h2 className="text-xl font-semibold">
              YouTube Analysis
            </h2>
          </div>

          {/* URL INPUT */}
          <div className="mb-6">
            <label className="text-sm font-medium">
              YouTube URL
            </label>

            <div className="relative mt-2">
              <LinkIcon className="absolute left-3 top-3 text-gray-400" />

              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border rounded-xl pl-10 py-3 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* GOAL (CRITICAL FEATURE) */}
          <div className="mb-6">
            <label className="text-sm font-medium">
              Select Goal
            </label>

            <div className="relative mt-2">
              <Target className="absolute left-3 top-3 text-gray-400" />

              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border rounded-xl pl-10 py-3"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LANGUAGE */}
          <div className="mb-8">
            <label className="text-sm font-medium">
              Output Language
            </label>

            <div className="relative mt-2">
              <Globe className="absolute left-3 top-3 text-gray-400" />

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border rounded-xl pl-10 py-3"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <FaYoutube size={20} />
                Analyze Video
              </>
            )}
          </button>
        </div>

        {/* CREDIT INFO */}
        <div className="mt-8 bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-3">
            Credit Usage
          </h3>

          <div className="text-gray-700 space-y-2">
            <p>• 0–10 min → 1 credit</p>
            <p>• 10–20 min → 2 credits</p>
            <p>• 20–40 min → 4 credits</p>
            <p>• 40+ min → 6 credits</p>
          </div>
        </div>
      </div>
    </div>
  );
}