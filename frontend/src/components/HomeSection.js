"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
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
  Link as LinkIcon,
  Globe,
  Check,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";

export default function HomeSection() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  // ======================================================
  // DATA MATRICES
  // ======================================================

  const features = [
    {
      title: "AI Deep Notes",
      desc: "Instantly parse long video files into formatted summaries with AI filling in missing concepts and background context.",
      icon: FileText,
    },
    {
      title: "Execution Engine",
      desc: "Receive structured implementation roadmaps with command-line examples, target folder directories, and code snippets.",
      icon: Rocket,
    },
    {
      title: "AI Skill Roadmaps",
      desc: "Generate custom learning paths to track and verify your progress from novice foundations up to mastery levels.",
      icon: Layers3,
    },
    {
      title: "Interview Board",
      desc: "Prepare for coding interviews with custom flashcards, mock QA questions, and structural job insights from study materials.",
      icon: Briefcase,
    },
    {
      title: "Project Creator",
      desc: "Build application boilerplate code structures and component layout architectures matching standard enterprise setups.",
      icon: Code2,
    },
    {
      title: "Smart Explanations",
      desc: "Break down complex or obscure topics into simplified summaries designed to maximize information retention.",
      icon: Brain,
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Paste Video Link",
      desc: "Provide any public YouTube educational link or programming tutorial into the URL input block.",
      icon: LinkIcon,
    },
    {
      step: "02",
      title: "Define Target Parameters",
      desc: "Specify your preferred study goal (Student, Developer, Job Seeker) and your desired output language.",
      icon: Globe,
    },
    {
      step: "03",
      title: "AI Synthesizes Material",
      desc: "Gemini models process transcripts to generate notes, interactive quizzes, and source project boilerplate.",
      icon: Brain,
    },
    {
      step: "04",
      title: "Study Efficiently",
      desc: "Read summaries, test your conceptual retention with flashcards, and launch code templates directly.",
      icon: Zap,
    },
  ];

  const languages = [
    { label: "English",    native: "English" },
    { label: "Hinglish",   native: "Hinglish" },
    { label: "Hindi",      native: "हिन्दी" },
    { label: "Bengali",    native: "বাংলা" },
    { label: "Tamil",      native: "தமிழ்" },
    { label: "Telugu",     native: "తెలుగు" },
    { label: "Marathi",    native: "मराठी" },
    { label: "Gujarati",   native: "ગુજરાતી" },
    { label: "Japanese",   native: "日本語" },
    { label: "German",     native: "Deutsch" },
  ];

  const faqs = [
    {
      q: "How does the AI fill in missing information?",
      a: "Our synthesis engine cross-references transcripts with verified technical sources, adding definitions and standard architectural code patterns where video speakers leave them out.",
    },
    {
      q: "Does this require a premium YouTube subscription?",
      a: "No, AI Analyzer parses public YouTube video data. You only need a standard video link to get started.",
    },
    {
      q: "Can I generate notes in languages other than English?",
      a: "Yes, we support over 20 languages including Hindi, Bengali, Spanish, Japanese, and Hinglish. AI writes all notes and quizzes in the selected language.",
    },
    {
      q: "How does the credit system work?",
      a: "Each video analysis consumes credits based on duration metrics. New accounts receive free starter credits, and you can buy top-ups anytime.",
    },
  ];

  const testimonials = [
    {
      name: "Aarav Mehta",
      role: "MERN Stack Developer",
      quote: "AI Analyzer completely replaced my scrub-heavy video study habits. The generated roadmaps are incredibly accurate.",
    },
    {
      name: "Sarah Jenkins",
      role: "Computer Science Student",
      quote: "The interactive flashcards and quizzes helped me prep for my data structure tests in half the time.",
    },
    {
      name: "Takahiro Sato",
      role: "Backend Engineer",
      quote: "Extremely useful for reading long code-along videos. Getting standard project files directly saves me hours of copy-pasting.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a12] text-white overflow-x-hidden">
      
      {/* ======================================================
          HERO SECTION
      ====================================================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Glow Background Gradients */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_40%)]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_bottom_left,#8b5cf6,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center w-full">
          
          {/* HERO LEFT */}
          <div className="lg:col-span-7 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 px-4.5 py-2 rounded-full mb-8 text-sm font-bold text-blue-400">
                <Sparkles size={14} className="text-yellow-400" />
                <span>Modern AI Learning Platform</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Never Rewatch a
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">YouTube Video</span>
                <br />
                Again.
              </h1>

              <p className="text-lg md:text-xl text-slate-300 leading-relaxed mt-6 max-w-xl font-medium">
                Instantly convert long video transcripts into structured study notes, coding roadmaps, flashcard decks, and practice tests designed for your target career path.
              </p>

              {/* ACTION CALLS */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="group inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold text-base shadow-lg shadow-blue-500/10 active:scale-98 transition-all duration-200"
                >
                  <span>{user ? "Go to Dashboard" : "Start Learning Free"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#features"
                  className="bg-white/5 border border-white/10 hover:border-white/20 px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-all duration-200"
                >
                  View Features
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/5 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Check className="text-emerald-500" size={16} />
                  <span>20+ Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-emerald-500" size={16} />
                  <span>Tailored Goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-emerald-500" size={16} />
                  <span>Boilerplate Export</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* HERO RIGHT */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-[#0b0f19]/70 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
              
              <div className="text-left mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Flow Diagram</span>
                    <h3 className="text-lg font-bold mt-1 text-white">AI Extraction Process</h3>
                  </div>
                  <Crown size={16} className="text-yellow-400" />
                </div>
              </div>

              {/* STAGES FLOW */}
              <div className="space-y-4">
                {[
                  { title: "YouTube Video Link", desc: "YouTube source processed", icon: FaYoutube, color: "text-red-500 bg-red-500/10" },
                  { title: "AI Speech-to-Text Parsing", desc: "Transcript built & checked", icon: Brain, color: "text-blue-400 bg-blue-500/10" },
                  { title: "Smart Study Materials", desc: "Custom notes, code & templates", icon: FileText, color: "text-purple-400 bg-purple-500/10" },
                  { title: "Interactive Roadmaps", desc: "Active quizzes & code exports", icon: Layers3, color: "text-emerald-400 bg-emerald-500/10" },
                ].map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl text-left hover:border-white/10 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stage.color}`}>
                      <stage.icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{stage.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ======================================================
          COMPARISON SECTION
      ====================================================== */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              A Better Way to Learn from Video
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
              Traditional video learning is slow and passive. We build structured systems to make active recall automatic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* TRADITIONAL */}
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-8 text-left">
              <h3 className="text-lg font-bold text-slate-400 mb-6 uppercase tracking-wider">Traditional Learning</h3>
              <ul className="space-y-4">
                {[
                  "Scrubbing timelines for code clips",
                  "Passive watching with low retention",
                  "Missing core concepts left unexplained",
                  "No simple way to quiz yourself",
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-semibold">
                    <span className="text-red-500 font-bold mt-0.5">✕</span>
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WITH AI ANALYZER */}
            <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-8 text-left shadow-lg shadow-blue-500/5">
              <h3 className="text-lg font-bold text-blue-400 mb-6 uppercase tracking-wider">AI Analyzer OS</h3>
              <ul className="space-y-4">
                {[
                  "Instant code & boilerplate folders",
                  "Active study reviews & mock QA tests",
                  "Missing concepts expanded automatically",
                  "Bespoke learning roadmaps by goal",
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-3 text-white text-sm font-semibold">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURES
      ====================================================== */}
      <section id="features" className="py-24 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-wider">
              <Zap size={14} className="fill-blue-400" />
              <span>Engine Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Study Smarter, Build Faster.
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
              Designed specifically to replace scrubbing timelines. Get complete notes, source assets, and verification cards in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-8 text-left hover:border-white/10 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white mt-6">{feature.title}</h3>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS (TIMELINE)
      ====================================================== */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight">How It Works</h2>
            <p className="text-slate-400 text-sm md:text-base mt-3 max-w-lg mx-auto">
              Get from any online YouTube link to a personalized structured notes catalog in four simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 text-left relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="absolute top-4 right-6 text-5xl font-black text-white/5 group-hover:text-white/10 transition-colors select-none">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-sm mb-6">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-bold text-base text-white">{step.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mt-2.5">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          MULTI-LANGUAGE SECTION
      ====================================================== */}
      <section className="py-24 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Analyze in Your Native Language</h2>
          <p className="text-slate-400 text-sm md:text-base mt-3 max-w-xl mx-auto">
            Choose your preferred study language. AI writes summaries, interview answers, and roadmap paths in the selected language.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {languages.map((lang, idx) => (
              <span key={idx} className="bg-white/5 border border-white/10 text-slate-200 px-4.5 py-2.5 rounded-2xl text-sm font-bold shadow-sm hover:border-white/20 transition-all cursor-default">
                {lang.native} <span className="text-slate-500 text-xs font-semibold">({lang.label})</span>
              </span>
            ))}
          </div>
        </div>
      </section>



      {/* ======================================================
          FAQ SECTION
      ====================================================== */}
      <section className="py-24 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm md:text-base mt-3">
              Everything you need to know about the AI video analysis system.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-white/10 rounded-2xl bg-[#0b0f19]/30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-white font-bold text-sm md:text-base hover:bg-white/5 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 border-t border-white/5 text-slate-400 text-sm leading-relaxed text-left bg-black/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          FINAL CONVERSION CARD
      ====================================================== */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-blue-500/20 p-10 md:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,#3b82f6,transparent_45%)]" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 px-4.5 py-2 rounded-full mb-8 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Sparkles size={12} className="text-yellow-400" />
                <span>AI Learning Revolution</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Ready to Learn
                <br />
                10x Faster?
              </h2>

              <p className="text-slate-300 text-sm md:text-base mt-6 max-w-xl mx-auto leading-relaxed">
                Reclaim your time today. Let our AI extract deep study guides, roadmaps, and code structures instantly from any tutorial video.
              </p>

              <div className="mt-10">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="group inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 px-10 py-4.5 rounded-2xl font-bold text-base shadow-lg shadow-blue-500/20 active:scale-98 transition-all duration-200"
                >
                  <span>Start Analyzing Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-white/5 py-16 bg-[#04060b]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10 text-left">
          
          {/* BRAND */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                <Sparkles size={14} />
              </div>
              <h3 className="font-black text-lg text-white leading-none">AI Analyzer</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              AI-powered learning platform to extract structured summaries, custom roadmaps, and interactive tests from educational video files.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/analyze" className="hover:text-white transition-colors">Analyze Video</Link></li>
              <li><Link href="/buy-credits" className="hover:text-white transition-colors">Buy Credits</Link></li>
            </ul>
          </div>

          {/* RESOURCES */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Supported Languages</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Learning OS</a></li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Refund Guidelines</a></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM METRICS */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-semibold">
          <span>&copy; 2026 AI Analyzer Learning OS. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
}