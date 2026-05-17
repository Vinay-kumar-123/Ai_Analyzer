"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import Navbar from "@/components/Navbar";
import ActionEngine from "@/components/ActionEngine";
import {
  FiBook, FiDownload, FiCheckCircle, FiCode, FiHelpCircle,
  FiMap, FiCopy, FiRefreshCw, FiClock, FiZap, FiTarget,
  FiLayers, FiActivity, FiFolder, FiCalendar, FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── POLL INTERVAL ────────────────────────────────────────────────────────────
const POLL_MS = 3000;

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { id: "summary",   label: "Summary",    icon: FiActivity,     always: true  },
  { id: "notes",     label: "Notes",      icon: FiBook,         always: true  },
  { id: "keypoints", label: "Key Points", icon: FiCheckCircle,  always: true  },
  { id: "actions",   label: "Actions",    icon: FiZap,          key: "actionSteps" },
  { id: "roadmap",   label: "Roadmap",    icon: FiMap,          key: "roadmap" },
  { id: "qa",        label: "Q & A",      icon: FiHelpCircle,   key: "qa" },
  { id: "engine",    label: "Engine",     icon: FiCode,         key: "actionEngine", contentType: "tech" },
  { id: "project",   label: "Project",    icon: FiFolder,       projectKey: true },
  { id: "plan",      label: "Exec Plan",  icon: FiCalendar,     key: "executionPlan" },
];

// ─── COPY HELPER ──────────────────────────────────────────────────────────────
const useCopy = () => {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, id = "default") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);
  return { copy, copied };
};

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, action }) => (
  <div className="mb-10">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="text-2xl text-indigo-400" />}
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
    {children}
  </span>
);

// ─── CARD ─────────────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────
const CopyBtn = ({ text, id, copied, copy }) => (
  <button
    onClick={() => copy(text, id)}
    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
  >
    {copied === id ? <FiCheck className="text-green-400" /> : <FiCopy />}
    {copied === id ? "Copied" : "Copy"}
  </button>
);

// ─── LOADING SCREEN ──────────────────────────────────────────────────────────
const LoadingScreen = ({ data }) => {
  const progress = data?.progress || 5;
  const status = data?.status || "queued";

  const statusLabels = {
    queued:     "Queued — waiting for worker…",
    processing: `Analyzing — ${progress}% complete`,
  };

  return (
    <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* spinner ring */}
        <div className="relative w-28 h-28 mx-auto mb-10">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-indigo-500/30"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-indigo-400 font-bold text-lg">{progress}%</span>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          AI Engine Running
        </h1>
        <p className="text-indigo-300 text-base mb-10">
          {statusLabels[status] || "Preparing analysis…"}
        </p>

        {/* progress bar */}
        <div className="w-80 h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.8 }}
          />
        </div>

        <p className="text-gray-500 text-sm mt-4">
          This page updates automatically
        </p>
      </motion.div>
    </div>
  );
};

// ─── FAILED SCREEN ────────────────────────────────────────────────────────────
const FailedScreen = ({ data, router }) => (
  <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center gap-6 px-6">
    <FiAlertCircle className="text-red-400 text-6xl" />
    <h2 className="text-3xl font-black text-white">Analysis Failed</h2>
    <p className="text-gray-400 text-center max-w-md">{data?.error || "Something went wrong. Please try again."}</p>
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-colors"
    >
      <FiRefreshCw />
      Go Back & Retry
    </button>
  </div>
);

// ─── ERROR SCREEN ─────────────────────────────────────────────────────────────
const ErrorScreen = ({ error }) => (
  <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center gap-5 px-6">
    <FiAlertCircle className="text-red-400 text-5xl" />
    <p className="text-red-400 text-xl">{error}</p>
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-colors"
    >
      Retry
    </button>
  </div>
);

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────
const buildPDF = (data, type = "full") => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  const PW = 190; // printable width

  const addTitle = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text(text, 10, y);
    y += 12;
  };

  const addSubtitle = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(text, 10, y);
    y += 8;
  };

  const addBody = (text) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(String(text), PW);
    // paginate
    lines.forEach((line) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 10, y);
      y += 5.5;
    });
    y += 6;
  };

  const addDivider = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(10, y, 200, y);
    y += 8;
  };

  switch (type) {
    case "notes":
      addTitle("📒 Premium Notes");
      addDivider();
      // strip markdown for PDF
      addBody(data.notes?.replace(/[#*`_]/g, ""));
      break;

    case "summary":
      addTitle("📋 Summary");
      addDivider();
      addBody(data.summary);
      break;

    case "roadmap":
      addTitle("🗺 Roadmap");
      addDivider();
      (data.roadmap || []).forEach((item, i) => {
        addBody(`${i + 1}. ${item}`);
      });
      break;

    case "qa":
      addTitle("❓ Q & A");
      addDivider();
      (data.qa || []).forEach((q, i) => {
        addSubtitle(`Q${i + 1}: ${q.question}`);
        addBody(`A: ${q.answer}`);
        y += 2;
      });
      break;

    default: // full
      addTitle(`AI Analysis — ${data.videoTitle || "YouTube Video"}`);
      addDivider();

      if (data.summary) {
        addSubtitle("Summary");
        addBody(data.summary);
        addDivider();
      }
      if (data.notes) {
        addSubtitle("Notes");
        addBody(data.notes?.replace(/[#*`_]/g, ""));
        addDivider();
      }
      if (data.keyPoints?.length) {
        addSubtitle("Key Points");
        data.keyPoints.forEach((kp) => addBody(`• ${kp}`));
        addDivider();
      }
      if (data.roadmap?.length) {
        addSubtitle("Roadmap");
        data.roadmap.forEach((r, i) => addBody(`${i + 1}. ${r}`));
        addDivider();
      }
      if (data.qa?.length) {
        addSubtitle("Q & A");
        data.qa.forEach((q) => {
          addBody(`Q: ${q.question}`);
          addBody(`A: ${q.answer}`);
          y += 2;
        });
      }
      break;
  }

  doc.save(`analysis-${type}.pdf`);
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function ResultPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { copy, copied } = useCopy();

  const [data,      setData]      = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const pollingRef = useRef(null);

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const fetchResult = useCallback(async () => {
    if (!id) return;
    try {
      const res  = await fetch(`${API}/api/dashboard/history/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Failed to load analysis");
        setLoading(false);
        clearInterval(pollingRef.current);
        return;
      }

      setData(json.data);

      // Stop polling once terminal state reached
      if (json.data.status === "completed" || json.data.status === "failed") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setLoading(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load analysis. Check your connection.");
      setLoading(false);
      clearInterval(pollingRef.current);
    }
  }, [id]);

  useEffect(() => {
    fetchResult();
    pollingRef.current = setInterval(fetchResult, POLL_MS);
    return () => clearInterval(pollingRef.current);
  }, [fetchResult]);

  // ── TABS ───────────────────────────────────────────────────────────────────
  const TABS = useMemo(() => {
    if (!data) return [];
    return TAB_CONFIG.filter((t) => {
      if (t.always) return true;
      if (t.projectKey) return !!data.project?.title;
      if (t.contentType && data.contentType !== t.contentType) return false;
      if (t.key) return Array.isArray(data[t.key]) ? data[t.key].length > 0 : !!data[t.key];
      return false;
    });
  }, [data]);

  // Keep activeTab valid when tabs change
  useEffect(() => {
    if (TABS.length && !TABS.find((t) => t.id === activeTab)) {
      setActiveTab(TABS[0].id);
    }
  }, [TABS, activeTab]);

  // ── STATES ─────────────────────────────────────────────────────────────────
  if (error) return <ErrorScreen error={error} />;

  if (
    loading ||
    !data ||
    data.status === "queued" ||
    data.status === "processing"
  ) {
    return <LoadingScreen data={data} />;
  }

  if (data.status === "failed") return <FailedScreen data={data} router={router} />;

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  const processingSeconds = Math.floor((data.processingTime || 0) / 1000);

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <Navbar />

      {/* ── AMBIENT BACKGROUND ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full bg-indigo-900/20 blur-[160px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[160px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pb-20">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-8 pb-4"
        >
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge>{data.contentType || "general"}</Badge>
            <Badge>{data.goal?.replace("_", " ")}</Badge>
            <Badge>{data.language}</Badge>
            {processingSeconds > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FiClock /> {processingSeconds}s
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight mb-2">
            {data.videoTitle || "AI Analysis"}
          </h1>

          {/* Outcome pill */}
          {data.outcome && (
            <p className="text-indigo-300 text-base mt-3 max-w-3xl leading-relaxed">
              🎯 {data.outcome}
            </p>
          )}

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => buildPDF(data, "full")}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <FiDownload /> Full PDF
            </button>
            <button
              onClick={() => buildPDF(data, "notes")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-semibold rounded-xl transition-colors"
            >
              <FiDownload /> Notes PDF
            </button>
            <CopyBtn text={data.summary} id="summary-hero" copied={copied} copy={copy} />
          </div>
        </motion.div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 bg-[#080a12]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="text-base" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >

            {/* ── SUMMARY ──────────────────────────────────────────────────── */}
            {activeTab === "summary" && (
              <Section
                title="Summary"
                icon={FiActivity}
                action={
                  <div className="flex gap-2">
                    <CopyBtn text={data.summary} id="summary" copied={copied} copy={copy} />
                    <button
                      onClick={() => buildPDF(data, "summary")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
                    >
                      <FiDownload /> PDF
                    </button>
                  </div>
                }
              >
                <Card>
                  <p className="text-gray-300 leading-8 text-base">{data.summary}</p>
                </Card>

                {/* Key stats row */}
                {(data.creditsUsed || data.duration) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {data.duration > 0 && (
                      <Card className="text-center">
                        <p className="text-2xl font-black text-indigo-400">
                          {Math.floor(data.duration / 60)}m
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Video Length</p>
                      </Card>
                    )}
                    {data.creditsUsed > 0 && (
                      <Card className="text-center">
                        <p className="text-2xl font-black text-violet-400">{data.creditsUsed}</p>
                        <p className="text-xs text-gray-500 mt-1">Credits Used</p>
                      </Card>
                    )}
                    {data.keyPoints?.length > 0 && (
                      <Card className="text-center">
                        <p className="text-2xl font-black text-emerald-400">{data.keyPoints.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Key Points</p>
                      </Card>
                    )}
                    {data.qa?.length > 0 && (
                      <Card className="text-center">
                        <p className="text-2xl font-black text-amber-400">{data.qa.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Q&A Pairs</p>
                      </Card>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* ── NOTES ────────────────────────────────────────────────────── */}
            {activeTab === "notes" && (
              <Section
                title="Premium Notes"
                icon={FiBook}
                action={
                  <div className="flex gap-2">
                    <CopyBtn text={data.notes} id="notes" copied={copied} copy={copy} />
                    <button
                      onClick={() => buildPDF(data, "notes")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                    >
                      <FiDownload /> Download
                    </button>
                  </div>
                }
              >
                <Card>
                  <div className="prose prose-invert prose-indigo max-w-none
                    prose-headings:font-black prose-headings:text-white
                    prose-p:text-gray-300 prose-p:leading-8
                    prose-li:text-gray-300 prose-li:leading-7
                    prose-code:text-indigo-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10
                    prose-strong:text-white prose-blockquote:border-indigo-500
                  ">
                    <ReactMarkdown>{data.notes}</ReactMarkdown>
                  </div>
                </Card>

                {/* Confusion breakdown */}
                {data.confusion?.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                      <FiHelpCircle className="text-amber-400" />
                      Difficult Concepts Explained
                    </h3>
                    <div className="grid gap-4">
                      {data.confusion.map((c, i) => (
                        <Card key={i} className="border-amber-500/20 bg-amber-500/5">
                          <h4 className="font-bold text-white text-base mb-2">{c.concept}</h4>
                          <p className="text-gray-300 text-sm leading-7 mb-3">{c.simpleExplanation}</p>
                          {c.realLifeExample && (
                            <div className="flex gap-2 text-xs text-amber-300 bg-amber-500/10 rounded-xl p-3">
                              <span>💡</span>
                              <span>{c.realLifeExample}</span>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ── KEY POINTS ───────────────────────────────────────────────── */}
            {activeTab === "keypoints" && (
              <Section title="Key Points" icon={FiCheckCircle}>
                {data.keyPoints?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.keyPoints.map((point, i) => (
                      <Card key={i} className="flex gap-3 items-start group">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-gray-300 text-sm leading-6">{point}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No key points available.</p>
                )}
              </Section>
            )}

            {/* ── ACTIONS ──────────────────────────────────────────────────── */}
            {activeTab === "actions" && (
              <Section title="Action Steps" icon={FiZap}>
                {data.actionSteps?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {data.actionSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Card className="flex gap-4 items-center group hover:border-indigo-500/40 transition-colors cursor-default">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-indigo-500/50 text-indigo-400 text-sm font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          <p className="text-gray-200 text-sm leading-6 flex-1">{step}</p>
                          <FiCheckCircle className="text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0" />
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No action steps available.</p>
                )}
              </Section>
            )}

            {/* ── ROADMAP ──────────────────────────────────────────────────── */}
            {activeTab === "roadmap" && (
              <Section
                title="Learning Roadmap"
                icon={FiMap}
                action={
                  <button
                    onClick={() => buildPDF(data, "roadmap")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
                  >
                    <FiDownload /> PDF
                  </button>
                }
              >
                {data.roadmap?.length > 0 ? (
                  <div className="relative">
                    {/* vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/30 to-transparent" />
                    <div className="flex flex-col gap-4 pl-12">
                      {data.roadmap.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative"
                        >
                          {/* dot */}
                          <div className="absolute -left-[2.4rem] top-3 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#080a12] shadow-lg shadow-indigo-500/40" />
                          <Card>
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold text-indigo-400 mt-0.5 flex-shrink-0">
                                STEP {i + 1}
                              </span>
                              <p className="text-gray-300 text-sm leading-6">{step}</p>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No roadmap available.</p>
                )}

                {/* Learning path */}
                {data.learningPath?.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-lg font-bold mb-4 text-gray-300">Next Steps & Resources</h3>
                    <div className="flex flex-col gap-2">
                      {data.learningPath.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
                          <span className="text-indigo-400 mt-0.5">→</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* ── Q & A ────────────────────────────────────────────────────── */}
            {activeTab === "qa" && (
              <Section
                title="Q & A"
                icon={FiHelpCircle}
                action={
                  <button
                    onClick={() => buildPDF(data, "qa")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
                  >
                    <FiDownload /> PDF
                  </button>
                }
              >
                {data.qa?.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {data.qa.map((item, i) => (
                      <QACard key={i} item={item} index={i} copy={copy} copied={copied} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No Q&A available.</p>
                )}
              </Section>
            )}

            {/* ── ACTION ENGINE ─────────────────────────────────────────────── */}
            {activeTab === "engine" && (
              <Section title="Action Engine" icon={FiCode}>
                {data.actionEngine?.length > 0 ? (
                  <ActionEngine steps={data.actionEngine} />
                ) : (
                  <p className="text-gray-500">No action engine steps available.</p>
                )}
              </Section>
            )}

            {/* ── PROJECT ──────────────────────────────────────────────────── */}
            {activeTab === "project" && data.project && (
              <ProjectTab project={data.project} copy={copy} copied={copied} />
            )}

            {/* ── EXECUTION PLAN ────────────────────────────────────────────── */}
            {activeTab === "plan" && (
              <Section title="Execution Plan" icon={FiCalendar}>
                {data.executionPlan?.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.executionPlan.map((item, i) => (
                      <Card key={i} className="hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                            {item.day || `Day ${i + 1}`}
                          </span>
                          <p className="text-gray-300 text-sm leading-6">{item.task}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No execution plan available.</p>
                )}
              </Section>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Q&A CARD (accordion) ─────────────────────────────────────────────────────
function QACard({ item, index, copy, copied }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-colors cursor-pointer ${
        open ? "border-indigo-500/40 bg-white/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-start gap-4 p-5">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
          Q{index + 1}
        </span>
        <p className="flex-1 text-white font-medium text-sm leading-6">{item.question}</p>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-gray-500 flex-shrink-0 mt-0.5"
        >
          ▾
        </motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pl-16 border-t border-white/10 pt-4">
              <p className="text-gray-300 text-sm leading-7">{item.answer}</p>
              <div className="mt-3">
                <CopyBtn
                  text={`Q: ${item.question}\nA: ${item.answer}`}
                  id={`qa-${index}`}
                  copied={copied}
                  copy={copy}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PROJECT TAB ─────────────────────────────────────────────────────────────
function ProjectTab({ project, copy, copied }) {
  return (
    <Section title="Project Builder" icon={FiFolder}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Title + description */}
        <div className="md:col-span-2">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-xl font-black text-white mb-1">{project.title}</h3>
            {project.outcome && (
              <p className="text-emerald-300 text-sm">{project.outcome}</p>
            )}
          </Card>
        </div>

        {/* Features */}
        {project.features?.length > 0 && (
          <Card>
            <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center gap-2">
              <FiLayers className="text-indigo-400" /> Features
            </h4>
            <ul className="flex flex-col gap-2">
              {project.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <FiCheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Tech Stack */}
        {project.techStack?.length > 0 && (
          <Card>
            <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center gap-2">
              <FiLayers className="text-violet-400" /> Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {t}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Folder Structure */}
        {project.folderStructure?.length > 0 && (
          <Card>
            <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center gap-2">
              <FiFolder className="text-amber-400" /> Folder Structure
            </h4>
            <pre className="text-xs text-amber-300/80 font-mono leading-6">
              {project.folderStructure.join("\n")}
            </pre>
          </Card>
        )}

        {/* Starter Code */}
        {project.starterCode && (
          <div className="md:col-span-2">
            <Card className="relative">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-300 text-sm flex items-center gap-2">
                  <FiCode className="text-indigo-400" /> Starter Code
                </h4>
                <CopyBtn text={project.starterCode} id="starter-code" copied={copied} copy={copy} />
              </div>
              <pre className="overflow-x-auto text-xs text-gray-300 font-mono leading-6 bg-black/40 rounded-xl p-4 border border-white/10">
                {project.starterCode}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </Section>
  );
}
