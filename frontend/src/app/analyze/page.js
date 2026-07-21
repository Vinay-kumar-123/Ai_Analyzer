"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Link as LinkIcon, Globe, Loader2, Target, Sparkles,
  Brain, Rocket, FileText, CheckCircle2, Zap, Crown,
  Clock, AlertTriangle, Check, ChevronDown,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── LANGUAGES ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: "English",    native: "English",    value: "english"    },
  { label: "Hinglish",   native: "Hinglish",   value: "hinglish"   },
  { label: "Hindi",      native: "हिन्दी",       value: "hindi"      },
  { label: "Bengali",    native: "বাংলা",       value: "bengali"    },
  { label: "Tamil",      native: "தமிழ்",        value: "tamil"      },
  { label: "Telugu",     native: "తెలుగు",       value: "telugu"     },
  { label: "Marathi",    native: "मराठी",       value: "marathi"    },
  { label: "Gujarati",   native: "ગુજરાતી",      value: "gujarati"   },
  { label: "Punjabi",    native: "ਪੰਜਾਬੀ",       value: "punjabi"    },
  { label: "Urdu",       native: "اردو",        value: "urdu"       },
  { label: "Malayalam",  native: "മലയാളം",      value: "malayalam"  },
  { label: "Kannada",    native: "ಕನ್ನಡ",       value: "kannada"    },
  { label: "Arabic",     native: "العربية",     value: "arabic"     },
  { label: "Spanish",    native: "Español",     value: "spanish"    },
  { label: "French",     native: "Français",    value: "french"     },
  { label: "German",     native: "Deutsch",     value: "german"     },
  { label: "Japanese",   native: "日本語",      value: "japanese"   },
  { label: "Korean",     native: "한국어",       value: "korean"     },
  { label: "Chinese",    native: "中文",        value: "chinese"    },
  { label: "Portuguese", native: "Português",   value: "portuguese" },
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
  const { user, fetchCurrentUser } = useAuth();
  const router = useRouter();

  const [youtubeUrl,    setYoutubeUrl]    = useState("");
  const [language,      setLanguage]      = useState("english");
  const [goal,          setGoal]          = useState("student");
  const [loading,       setLoading]       = useState(false);
  const [videoPreview,  setVideoPreview]  = useState("");
  const [submitError,   setSubmitError]   = useState(null);   // { message, errorCode }
  const [imgError,      setImgError]      = useState(false);  // thumbnail 404 fallback

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      if (fetchCurrentUser) {
        void fetchCurrentUser();
      }
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
    <div className="min-h-screen bg-[#080a12] text-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#080a12] py-20 md:py-28">

        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_45%)] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* LEFT ── hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-8 backdrop-blur text-sm font-bold text-blue-400">
              <Sparkles size={16} />
              <span>Premium AI Analysis Workspace</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Turn YouTube Videos Into
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent"> AI Knowledge</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mt-6 max-w-xl">
              Extract complete structured study notes, coding challenges, custom step-by-step roadmap guides, and practice quizzes from any video automatically.
            </p>

            <div className="mt-8 space-y-3.5">
              {HERO_FEATURES.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT ── analysis form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-lg mx-auto"
          >
            <div className="bg-[#0b0f19]/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/40">

              {/* Card header */}
              <div className="flex items-center justify-between mb-8">
                <div className="text-left">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">AI Learning Engine</p>
                  <h3 className="text-2xl font-black mt-1 text-white">Analyze Video</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Brain size={20} />
                </div>
              </div>

              {/* URL input */}
              <div className="text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">YouTube Video URL</label>
                <div className="relative mt-3">
                  <LinkIcon className="absolute left-4 top-[17px] text-gray-500" size={16} />
                  <input
                    value={youtubeUrl}
                    onChange={handleUrlChange}
                    disabled={loading}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/20 transition-all text-sm font-medium"
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
                      className="w-full aspect-video rounded-2xl border border-white/10 object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Goal selection */}
              <div className="mt-8 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Goal</label>
                <div className="grid gap-3 mt-4">
                  {GOALS.map((item) => {
                    const Icon   = item.icon;
                    const active = goal === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setGoal(item.value)}
                        disabled={loading}
                        className={`text-left rounded-2xl border p-4.5 transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                          active
                            ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.05)] text-white"
                            : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            active ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white/10 text-gray-300"
                          }`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">{item.label}</h3>
                            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language selector */}
              <div className="mt-8 text-left" ref={dropdownRef}>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Output Language</label>
                <div className="relative mt-3">
                  <Globe className="absolute left-4 top-[17px] text-gray-500 pointer-events-none" size={16} />
                  <button
                    type="button"
                    onClick={() => !loading && setDropdownOpen(!dropdownOpen)}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-between text-left cursor-pointer text-sm font-semibold hover:border-white/20"
                  >
                    <span className="truncate">
                      {(() => {
                        const sel = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
                        return sel.label === sel.native ? sel.label : `${sel.native} (${sel.label})`;
                      })()}
                    </span>
                    <ChevronDown className="text-gray-500 flex-shrink-0" size={16} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden py-2 focus:outline-none scrollbar-thin scrollbar-thumb-white/10">
                      {LANGUAGES.map((lang) => {
                        const isSelected = lang.value === language;
                        const displayText = lang.label === lang.native ? lang.label : `${lang.native} (${lang.label})`;
                        return (
                          <button
                            key={lang.value}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.value);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-6 py-3.5 transition-all flex items-center justify-between hover:bg-white/5 cursor-pointer text-sm ${
                              isSelected ? "text-blue-400 bg-blue-500/10 font-bold" : "text-white"
                            }`}
                          >
                            <span className="truncate">{displayText}</span>
                            {isSelected && <Check size={16} className="text-blue-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Credits Status Indicator */}
              <div className="mt-8 bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                    <Zap size={14} className="fill-yellow-400" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Balance</span>
                    <p className="text-sm font-black text-white leading-none mt-0.5">{user?.credits ?? 0} Credits</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Cost</span>
                  <p className="text-xs font-bold text-blue-400 mt-0.5">1-6 Credits</p>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>AI Processing…</span>
                  </>
                ) : (
                  <>
                    <FaYoutube size={18} />
                    <span>Analyze Video</span>
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
