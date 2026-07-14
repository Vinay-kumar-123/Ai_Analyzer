"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Link as LinkIcon, Globe, Loader2, Target, Sparkles,
  Brain, Rocket, FileText, CheckCircle2, Zap, Crown,
  Clock, AlertTriangle,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── LANGUAGES ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: "English",    value: "english"    },
  { label: "Hinglish",   value: "hinglish"   },
  { label: "Hindi",      value: "hindi"      },
  { label: "Bengali",    value: "bengali"    },
  { label: "Tamil",      value: "tamil"      },
  { label: "Telugu",     value: "telugu"     },
  { label: "Marathi",    value: "marathi"    },
  { label: "Gujarati",   value: "gujarati"   },
  { label: "Punjabi",    value: "punjabi"    },
  { label: "Urdu",       value: "urdu"       },
  { label: "Malayalam",  value: "malayalam"  },
  { label: "Kannada",    value: "kannada"    },
  { label: "Arabic",     value: "arabic"     },
  { label: "Spanish",    value: "spanish"    },
  { label: "French",     value: "french"     },
  { label: "German",     value: "german"     },
  { label: "Japanese",   value: "japanese"   },
  { label: "Korean",     value: "korean"     },
  { label: "Chinese",    value: "chinese"    },
  { label: "Portuguese", value: "portuguese" },
];

// ─── GOALS ────────────────────────────────────────────────────────────────────
const GOALS = [
  {
    label: "Student",
    value: "student",
    desc:  "Deep notes, easy explanations and learning guidance.",
    icon:  Brain,
  },
  {
    label: "Developer",
    value: "developer",
    desc:  "Code, architecture and implementation systems.",
    icon:  Rocket,
  },
  {
    label: "Job Seeker",
    value: "job_seeker",
    desc:  "Interview preparation and career-focused insights.",
    icon:  Crown,
  },
];

// ─── FEATURES LIST ────────────────────────────────────────────────────────────
const HERO_FEATURES = [
  "Deep structured AI notes",
  "AI fills missing explanations",
  "Execution roadmap generation",
  "Project & interview preparation",
];

const FEATURE_CARDS = [
  { title: "Deep Notes",     icon: FileText },
  { title: "Execution Plan", icon: Rocket   },
  { title: "Projects",       icon: Brain    },
  { title: "Roadmaps",       icon: Target   },
];

// ─── URL HELPERS ──────────────────────────────────────────────────────────────

// Validates the URL is actually a YouTube URL — not just any string containing
// "youtube.com". Checks for the real domain at the start of the hostname.
const isValidYouTubeUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    const isYT =
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "youtu.be" ||
      hostname === "m.youtube.com";
    return isYT;
  } catch {
    return false;
  }
};

// Extracts the video ID from any YouTube URL format.
const extractVideoId = (url) => {
  try {
    const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match  = url.match(regExp);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// ─── DURATION WARNING ─────────────────────────────────────────────────────────
// Shown when the backend returns errorCode === "VIDEO_TOO_LONG".
// Never shows technical language — only the premium UX message.
const DurationWarning = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
    className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
  >
    <div className="flex items-start gap-3">
      <Clock className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
      <div>
        <p className="text-amber-200 text-sm font-semibold">Video too long</p>
        <p className="text-amber-200/70 text-sm mt-1 leading-relaxed">{message}</p>
      </div>
    </div>
  </motion.div>
);

// ─── GENERIC ERROR WARNING ─────────────────────────────────────────────────────
const ErrorWarning = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
    className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
      <p className="text-red-200 text-sm leading-relaxed">{message}</p>
    </div>
  </motion.div>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const router = useRouter();

  const [youtubeUrl,    setYoutubeUrl]    = useState("");
  const [language,      setLanguage]      = useState("english");
  const [goal,          setGoal]          = useState("student");
  const [loading,       setLoading]       = useState(false);
  const [videoPreview,  setVideoPreview]  = useState("");
  const [submitError,   setSubmitError]   = useState(null);   // { message, errorCode }
  const [imgError,      setImgError]      = useState(false);  // thumbnail 404 fallback

  // ── URL change handler ──────────────────────────────────────────────────────
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setYoutubeUrl(value);
    setSubmitError(null);  // clear error when user edits URL

    const videoId = extractVideoId(value);
    if (videoId) {
      // Reset image error state so the new thumbnail gets a fresh attempt
      setImgError(false);
      setVideoPreview(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    } else {
      setVideoPreview("");
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setSubmitError(null);

    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl.trim())) {
      toast.error("Please enter a valid YouTube video URL");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/analyze/youtube`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ youtubeUrl: youtubeUrl.trim(), language, goal }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Show inline warning for duration errors; toast for everything else
        if (data.errorCode === "VIDEO_TOO_LONG" || data.errorCode === "VIDEO_TOO_SHORT") {
          setSubmitError({ message: data.message, errorCode: data.errorCode });
        } else {
          toast.error(data.message || "Analysis failed. Please try again.");
        }
        return;
      }

      toast.success("AI Analysis Started 🚀");
      router.push(`/result/${data.analysisId}`);

    } catch (err) {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Thumbnail: fall back to hqdefault if maxresdefault 404s ────────────────
  const handleImgError = () => {
    if (!imgError && videoPreview.includes("maxresdefault")) {
      setImgError(true);
      const videoId = extractVideoId(youtubeUrl);
      if (videoId) setVideoPreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white py-24">

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_30%)]" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT ── hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/20 px-5 py-2 rounded-full mb-8 backdrop-blur">
              <Sparkles size={18} />
              Premium AI Analysis
            </div>

            <h1 className="text-6xl font-extrabold leading-tight">
              Turn YouTube Videos Into
              <span className="text-blue-400"> AI Knowledge</span>
            </h1>

            <p className="text-xl text-gray-300 leading-9 mt-8 max-w-2xl">
              Generate premium AI notes, roadmaps, projects, interview prep
              and execution systems automatically.
            </p>

            <div className="mt-10 space-y-4">
              {HERO_FEATURES.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-400" />
                  <span className="text-gray-200">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT ── analysis form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 shadow-2xl">

              {/* Card header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-gray-300 text-sm">AI Learning Engine</p>
                  <h3 className="text-3xl font-bold mt-1">Analyze Video</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <Brain />
                </div>
              </div>

              {/* URL input */}
              <div>
                <label className="text-sm text-gray-300">YouTube URL</label>
                <div className="relative mt-3">
                  <LinkIcon className="absolute left-4 top-4 text-gray-400" size={18} />
                  <input
                    value={youtubeUrl}
                    onChange={handleUrlChange}
                    disabled={loading}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  />
                </div>
              </div>

              {/* Inline error warnings */}
              <AnimatePresence mode="wait">
                {submitError?.errorCode === "VIDEO_TOO_LONG" && (
                  <DurationWarning key="duration" message={submitError.message} />
                )}
                {submitError && submitError.errorCode !== "VIDEO_TOO_LONG" && (
                  <ErrorWarning key="error" message={submitError.message} />
                )}
              </AnimatePresence>

              {/* Thumbnail preview */}
              <AnimatePresence>
                {videoPreview && !submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 overflow-hidden"
                  >
                    <img
                      src={videoPreview}
                      alt="Video preview"
                      onError={handleImgError}
                      className="w-full rounded-2xl border border-white/10 object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Goal selection */}
              <div className="mt-8">
                <label className="text-sm text-gray-300">Select Goal</label>
                <div className="grid gap-3 mt-4">
                  {GOALS.map((item) => {
                    const Icon   = item.icon;
                    const active = goal === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setGoal(item.value)}
                        disabled={loading}
                        className={`text-left rounded-2xl border p-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          active
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-white/10 bg-black/20 hover:border-blue-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{item.label}</h3>
                            <p className="text-gray-300 text-sm mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language selector */}
              <div className="mt-8">
                <label className="text-sm text-gray-300">Output Language</label>
                <div className="relative mt-3">
                  <Globe className="absolute left-4 top-4 text-gray-400" size={18} />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition appearance-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value} className="text-black bg-slate-800">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-3 shadow-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    AI Processing…
                  </>
                ) : (
                  <>
                    <FaYoutube size={22} />
                    Analyze Video
                  </>
                )}
              </button>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2 rounded-full mb-6">
              <Zap size={18} />
              AI Features
            </div>
            <h2 className="text-5xl font-bold">What AI Generates For You</h2>
            <p className="text-gray-500 text-xl mt-6 max-w-3xl mx-auto">
              Designed to replace rewatching videos completely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURE_CARDS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Icon className="text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mt-6">{item.title}</h3>
                  <p className="text-gray-500 mt-4 leading-7">
                    AI generates premium structured content for deep understanding.
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}
