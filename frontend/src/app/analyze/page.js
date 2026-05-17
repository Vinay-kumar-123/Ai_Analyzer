"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";

import toast from "react-hot-toast";

import { motion } from "framer-motion";

import {
  Link as LinkIcon,
  Globe,
  Loader2,
  Target,
  Sparkles,
  Brain,
  Rocket,
  FileText,
  PlayCircle,
  CheckCircle2,
  Zap,
  Crown,
} from "lucide-react";

import { FaYoutube } from "react-icons/fa";

const API =
  process.env.NEXT_PUBLIC_API_URL;

// ======================================================
// LANGUAGES
// ======================================================

const LANGUAGES = [
  {
    label: "English",
    value: "english",
  },

  {
    label: "Hinglish",
    value: "hinglish",
  },
  {
    label: "Hindi",
    value: "hindi",
  },
  {
    label: "Bengali",
    value: "bengali",
  },
  {
    label: "Tamil",
    value: "tamil",
  },
];

// ======================================================
// GOALS
// ======================================================

const GOALS = [
  {
    label: "Student",
    value: "student",

    desc:
      "Deep notes, easy explanation and learning guidance.",

    icon: Brain,
  },

  {
    label: "Developer",
    value: "developer",

    desc:
      "Code, architecture and implementation systems.",

    icon: Rocket,
  },

  {
    label: "Job Seeker",
    value: "job_seeker",

    desc:
      "Interview preparation and career-focused insights.",

    icon: Crown,
  },
];

export default function AnalyzePage() {
  const router = useRouter();

  // ======================================================
  // STATE
  // ======================================================

  const [youtubeUrl, setYoutubeUrl] =
    useState("");

  const [language, setLanguage] =
    useState("english");

  const [goal, setGoal] =
    useState("student");

  const [loading, setLoading] =
    useState(false);

  const [videoPreview, setVideoPreview] =
    useState("");

  // ======================================================
  // VALIDATE
  // ======================================================

  const validateUrl = (url) => {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be")
    );
  };

  // ======================================================
  // EXTRACT VIDEO ID
  // ======================================================

  const extractVideoId = (url) => {
    try {
      const regExp =
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;

      const match =
        url.match(regExp);

      return match
        ? match[1]
        : null;

    } catch {
      return null;
    }
  };

  // ======================================================
  // HANDLE URL
  // ======================================================

  const handleUrlChange = (e) => {
    const value = e.target.value;

    setYoutubeUrl(value);

    const videoId =
      extractVideoId(value);

    if (videoId) {
      setVideoPreview(
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      );
    } else {
      setVideoPreview("");
    }
  };

  // ======================================================
  // ANALYZE
  // ======================================================

  const handleAnalyze =
    async () => {
      if (
        !youtubeUrl.trim()
      ) {
        return toast.error(
          "Enter YouTube URL"
        );
      }

      if (
        !validateUrl(
          youtubeUrl
        )
      ) {
        return toast.error(
          "Invalid YouTube URL"
        );
      }

      setLoading(true);

      try {
        const res = await fetch(
          `${API}/api/analyze/youtube`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              youtubeUrl,
              language,
              goal,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data.message
          );
        }

        toast.success(
          "AI Analysis Started 🚀"
        );

        router.push(
          `/result/${data.analysisId}`
        );

      } catch (error) {
        toast.error(
          error.message ||
            "Analysis failed"
        );

      } finally {
        setLoading(false);
      }
    };

  // ======================================================
  // MAIN
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-black via-slate-900 to-blue-950 text-white py-24">

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_30%)]" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">

          {/* ======================================================
              LEFT
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/20 px-5 py-2 rounded-full mb-8 backdrop-blur">

              <Sparkles size={18} />

              Premium AI Analysis

            </div>

            {/* TITLE */}
            <h1 className="text-6xl font-extrabold leading-tight">

              Turn YouTube Videos
              Into

              <span className="text-blue-400">
                {" "}
                AI Knowledge
              </span>

            </h1>

            {/* DESC */}
            <p className="text-xl text-gray-300 leading-9 mt-8 max-w-2xl">

              Generate premium AI notes,
              roadmaps, projects,
              interview prep and execution
              systems automatically.

            </p>

            {/* FEATURES */}
            <div className="mt-10 space-y-4">

              {[
                "Deep structured AI notes",
                "AI fills missing explanations",
                "Execution roadmap generation",
                "Project & interview preparation",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="text-green-400" />

                  <span className="text-gray-200">
                    {item}
                  </span>

                </div>
              ))}

            </div>

          </motion.div>

          {/* ======================================================
              RIGHT
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}

            animate={{
              opacity: 1,
              scale: 1,
            }}

            className="relative"
          >
            <div className="bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 shadow-2xl">

              {/* HEADER */}
              <div className="flex items-center justify-between">

                <div>

                  <p className="text-gray-300 text-sm">
                    AI Learning Engine
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    Analyze Video
                  </h3>

                </div>

                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">

                  <Brain />

                </div>

              </div>

              {/* INPUT */}
              <div className="mt-8">

                <label className="text-sm text-gray-300">
                  YouTube URL
                </label>

                <div className="relative mt-3">

                  <LinkIcon className="absolute left-4 top-4 text-gray-400" />

                  <input
                    value={youtubeUrl}

                    onChange={
                      handleUrlChange
                    }

                    placeholder="https://youtube.com/watch?v=..."

                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

              </div>

              {/* PREVIEW */}
              {videoPreview && (
                <motion.img
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  src={videoPreview}

                  alt="preview"

                  className="mt-6 rounded-3xl border border-white/10"
                />
              )}

              {/* GOALS */}
              <div className="mt-8">

                <label className="text-sm text-gray-300">
                  Select Goal
                </label>

                <div className="grid gap-4 mt-4">

                  {GOALS.map(
                    (
                      item,
                      i
                    ) => {
                      const Icon =
                        item.icon;

                      const active =
                        goal ===
                        item.value;

                      return (
                        <button
                          key={i}

                          onClick={() =>
                            setGoal(
                              item.value
                            )
                          }

                          className={`text-left rounded-2xl border p-5 transition-all ${
                            active
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-white/10 bg-black/20 hover:border-blue-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-4">

                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">

                              <Icon />

                            </div>

                            <div>

                              <h3 className="font-bold text-lg">
                                {
                                  item.label
                                }
                              </h3>

                              <p className="text-gray-300 text-sm mt-1">
                                {
                                  item.desc
                                }
                              </p>

                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* LANGUAGE */}
              <div className="mt-8">

                <label className="text-sm text-gray-300">
                  Output Language
                </label>

                <div className="relative mt-3">

                  <Globe className="absolute left-4 top-4 text-gray-400" />

                  <select
                    value={language}

                    onChange={(e) =>
                      setLanguage(
                        e.target.value
                      )
                    }

                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none"
                  >
                    {LANGUAGES.map(
                      (
                        lang,
                        i
                      ) => (
                        <option
                          key={i}
                          value={
                            lang.value
                          }
                          className="text-black"
                        >
                          {
                            lang.label
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* BUTTON */}
              <button
                onClick={
                  handleAnalyze
                }

                disabled={loading}

                className="w-full mt-10 bg-blue-600 hover:bg-blue-700 transition-all rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-3 shadow-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />

                    AI Processing...
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

      {/* ======================================================
          AI FEATURES
      ====================================================== */}

      <section className="py-24">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-20">

            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2 rounded-full mb-6">

              <Zap size={18} />

              AI Features

            </div>

            <h2 className="text-5xl font-bold">
              What AI Generates For You
            </h2>

            <p className="text-gray-500 text-xl mt-6 max-w-3xl mx-auto">
              Designed to replace
              rewatching videos completely.
            </p>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            {[
              {
                title:
                  "Deep Notes",

                icon: FileText,
              },

              {
                title:
                  "Execution Plan",

                icon: Rocket,
              },

              {
                title:
                  "Projects",

                icon: Brain,
              },

              {
                title:
                  "Roadmaps",

                icon: Target,
              },
            ].map(
              (
                item,
                i
              ) => {
                const Icon =
                  item.icon;

                return (
                  <motion.div
                    key={i}

                    whileHover={{
                      y: -5,
                    }}

                    className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">

                      <Icon className="text-blue-600" />

                    </div>

                    <h3 className="text-2xl font-bold mt-6">
                      {
                        item.title
                      }
                    </h3>

                    <p className="text-gray-500 mt-4 leading-7">
                      AI generates premium
                      structured content for
                      deep understanding.
                    </p>

                  </motion.div>
                );
              }
            )}

          </div>

        </div>

      </section>

    </div>
  );
}