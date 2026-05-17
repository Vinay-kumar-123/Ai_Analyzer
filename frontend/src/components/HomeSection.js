"use client";

import Link from "next/link";

import { motion } from "framer-motion";

import {
  ArrowRight,
  Brain,
  Sparkles,
  BookOpen,
  Rocket,
  CheckCircle2,
  Layers3,
  Crown,
  Zap,
  FileText,
  GraduationCap,
  Code2,
  Briefcase,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export default function HomeSection() {
  const { user } = useAuth();

  // ======================================================
  // FEATURES
  // ======================================================

  const features = [
    {
      title: "AI Deep Notes",
      desc:
        "Convert long videos into structured premium notes with missing explanations filled automatically.",
      icon: FileText,
    },

    {
      title: "Execution Engine",
      desc:
        "Get step-by-step practical implementation plans with commands, code and actions.",
      icon: Rocket,
    },

    {
      title: "AI Roadmaps",
      desc:
        "Generate personalized learning roadmaps and skill progression paths.",
      icon: Layers3,
    },

    {
      title: "Interview Preparation",
      desc:
        "AI generates interview questions, answers and job-focused insights automatically.",
      icon: Briefcase,
    },

    {
      title: "Project Builder",
      desc:
        "Generate real-world projects, architecture and folder structures instantly.",
      icon: Code2,
    },

    {
      title: "Smart Learning",
      desc:
        "Understand difficult concepts deeply with AI-powered simplified explanations.",
      icon: Brain,
    },
  ];

  // ======================================================
  // GOALS
  // ======================================================

  const goals = [
    {
      title: "Students",
      desc:
        "Deep notes, easy explanations and learning guidance.",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
    },

    {
      title: "Developers",
      desc:
        "Code generation, architecture and execution systems.",
      icon: Code2,
      color: "from-green-500 to-emerald-600",
    },

    {
      title: "Job Seekers",
      desc:
        "Interview prep, resume points and industry insights.",
      icon: Briefcase,
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-black via-slate-950 to-blue-950 text-white">

        {/* BG EFFECTS */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_30%)]" />

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,#7c3aed,transparent_30%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-24 items-center">

          {/* ======================================================
              LEFT
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.7,
            }}

            className="max-w-2xl"
          >

            {/* BADGE */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 backdrop-blur px-5 py-2 rounded-full mb-8">

              <Sparkles
                size={16}
                className="text-blue-400"
              />

              <span className="text-sm font-medium text-blue-100 tracking-wide">
                AI-Powered Learning OS
              </span>

            </div>

            {/* TITLE */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white">

              Never
              <br />

              <span className="text-blue-400">
                Rewatch
              </span>{" "}

              a
              <br />

              YouTube
              <br />

              Video Again.

            </h1>

            {/* DESC */}
            <p className="text-lg md:text-xl text-gray-300 leading-9 mt-8 max-w-2xl font-normal">

              Transform YouTube videos into premium AI-generated
              notes, roadmaps, interview prep, execution plans,
              projects and deep explanations.

            </p>

            {/* FEATURES */}
            <div className="mt-10 space-y-5">

              {[
                "AI fills missing explanations automatically",
                "Generate actionable execution systems",
                "Structured notes like premium study material",
                "Designed for students, developers & job seekers",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />

                  </div>

                  <span className="text-gray-200 text-lg">
                    {item}
                  </span>

                </div>
              ))}

            </div>

            {/* CTA */}
            <div className="mt-12">

              <Link
                href={
                  user
                    ? "/dashboard"
                    : "/login"
                }
                className="group inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-9 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-[0_10px_40px_rgba(37,99,235,0.35)]"
              >

                {user
                  ? "Go to Dashboard"
                  : "Start Free"}

                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition"
                />

              </Link>

            </div>

            {/* TRUST */}
            <div className="flex flex-wrap gap-12 mt-14">

              <div>
                <div className="text-4xl font-bold text-white">
                  AI
                </div>

                <p className="text-gray-400 mt-1">
                  Deep Analysis
                </p>
              </div>

              <div>
                <div className="text-4xl font-bold text-white">
                  Smart
                </div>

                <p className="text-gray-400 mt-1">
                  Structured Notes
                </p>
              </div>

              <div>
                <div className="text-4xl font-bold text-white">
                  Fast
                </div>

                <p className="text-gray-400 mt-1">
                  Premium Learning
                </p>
              </div>

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

            transition={{
              duration: 0.7,
            }}

            className="relative"
          >

            {/* MAIN CARD */}
            <div className="relative bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 shadow-[0_20px_100px_rgba(0,0,0,0.4)] overflow-hidden">

              {/* GLOW */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />

              <div className="relative z-10">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-gray-300">
                      AI Analysis Result
                    </p>

                    <h3 className="text-3xl font-bold mt-2">
                      Dynamic Programming
                    </h3>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">

                    <Brain />

                  </div>

                </div>

                {/* NOTES */}
                <div className="mt-8 bg-black/30 rounded-3xl p-6 border border-white/10">

                  <h4 className="font-bold text-xl flex items-center gap-2">

                    <BookOpen size={20} />

                    AI Notes

                  </h4>

                  <div className="mt-5 space-y-4 text-gray-300 leading-8">

                    <p>
                      Dynamic Programming is an optimization technique used to solve overlapping subproblems efficiently.
                    </p>

                    <p>
                      AI expanded weak explanations and generated step-by-step learning guidance automatically.
                    </p>

                  </div>

                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-4 mt-8">

                  {[
                    {
                      label: "Key Points",
                      value: "42",
                    },

                    {
                      label: "QA",
                      value: "18",
                    },

                    {
                      label: "Projects",
                      value: "5",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/10 rounded-2xl p-5 text-center border border-white/5"
                    >
                      <div className="text-4xl font-bold">
                        {item.value}
                      </div>

                      <div className="text-sm text-gray-300 mt-2">
                        {item.label}
                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>

            {/* FLOATING BADGE */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-semibold">

              <Crown size={18} />

              Premium AI

            </div>

          </motion.div>

        </div>

      </section>

      {/* ======================================================
          FEATURES
      ====================================================== */}

      <section className="py-28 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-20">

            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2 rounded-full mb-6">

              <Zap size={18} />

              AI Features

            </div>

            <h2 className="text-5xl font-bold leading-tight">
              Everything You Need to Learn Smarter
            </h2>

            <p className="text-gray-500 text-xl mt-6 max-w-3xl mx-auto leading-8">
              Built for deep understanding,
              practical execution and
              accelerated learning.
            </p>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}

                  initial={{
                    opacity: 0,
                    y: 20,
                  }}

                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}

                  viewport={{
                    once: true,
                  }}

                  transition={{
                    delay: index * 0.08,
                  }}

                  className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                >

                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">

                    <Icon className="text-blue-600" />

                  </div>

                  <h3 className="text-2xl font-bold mt-6">
                    {feature.title}
                  </h3>

                  <p className="text-gray-500 mt-4 leading-8">
                    {feature.desc}
                  </p>

                </motion.div>
              );
            })}

          </div>

        </div>

      </section>

      {/* ======================================================
          GOALS
      ====================================================== */}

      <section className="py-28 bg-white">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-20">

            <h2 className="text-5xl font-bold">
              Built For Every Learner
            </h2>

            <p className="text-gray-500 text-xl mt-6">
              Personalized AI outputs based on your goals.
            </p>

          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {goals.map((goal, index) => {
              const Icon = goal.icon;

              return (
                <motion.div
                  key={goal.title}

                  initial={{
                    opacity: 0,
                    y: 20,
                  }}

                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}

                  viewport={{
                    once: true,
                  }}

                  transition={{
                    delay: index * 0.1,
                  }}

                  className={`bg-gradient-to-r ${goal.color} rounded-[32px] p-10 text-white shadow-2xl hover:scale-[1.02] transition-all duration-300`}
                >

                  <Icon className="w-16 h-16" />

                  <h3 className="text-4xl font-bold mt-8">
                    {goal.title}
                  </h3>

                  <p className="text-white/90 mt-5 text-lg leading-8">
                    {goal.desc}
                  </p>

                </motion.div>
              );
            })}

          </div>

        </div>

      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="py-28 bg-black text-white relative overflow-hidden">

        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,#2563eb,transparent_40%)]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 bg-white/10 px-5 py-2 rounded-full mb-8">

            <Sparkles size={18} />

            AI Learning Revolution

          </div>

          <h2 className="text-6xl font-extrabold leading-tight">
            Ready to Learn
            <br />
            10x Faster?
          </h2>

          <p className="text-gray-400 text-xl mt-8 leading-9 max-w-3xl mx-auto">
            Stop wasting hours rewatching
            videos. Let AI generate deep,
            structured and actionable
            learning material instantly.
          </p>

          <div className="mt-12">

            <Link
              href={
                user
                  ? "/dashboard"
                  : "/login"
              }
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-10 py-5 rounded-2xl text-xl font-semibold transition-all hover:scale-105 shadow-[0_10px_50px_rgba(37,99,235,0.4)]"
            >

              Start Learning Now

              <ArrowRight size={22} />

            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}