import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2,
  Globe, Target, Zap, Loader2, FileText, Check, ShieldCheck, Play
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";

const EXTRACTION_STAGES = [
  { label: "Video Link Received",    desc: "Link verification complete", minProgress: 0 },
  { label: "Extracting Transcript",  desc: "Processing video speech track", minProgress: 15 },
  { label: "Understanding Content",  desc: "Deep reading concepts & logic", minProgress: 30 },
  { label: "Generating Summary",     desc: "Synthesizing main subjects", minProgress: 55 },
  { label: "Creating Key Points",    desc: "Extracting core structures", minProgress: 70 },
  { label: "Preparing Study Notes",  desc: "Formatting detailed paragraphs", minProgress: 80 },
  { label: "Building Practice Quiz", desc: "Assembling active recall tests", minProgress: 90 },
  { label: "Creating Roadmap",       desc: "Structuring step-by-step guides", minProgress: 95 },
  { label: "Finalizing Results",     desc: "Saving modules to workspace", minProgress: 99 },
];

const getStageStatus = (idx, progress) => {
  const stage = EXTRACTION_STAGES[idx];
  const nextStage = EXTRACTION_STAGES[idx + 1];
  
  if (progress >= 100 || (nextStage && progress >= nextStage.minProgress)) {
    return "completed";
  }
  if (progress >= stage.minProgress) {
    return "active";
  }
  return "queued";
};

// Friendly status rotations that cycles slowly to reassure the user
const ROTATING_MESSAGES = [
  "Analyzing video context and language structures...",
  "Synthesizing key points and code logic...",
  "Generating active recall study cards...",
  "Formatting personalized roadmap levels...",
  "Finalizing notes workspace modules..."
];

export const LoadingScreen = ({ data }) => {
  const progress = data?.progress ?? 5;
  const status = data?.status ?? "queued";
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#080a12] text-white flex items-center justify-center py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Background soft ambient lights */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,#2563eb,transparent_45%)] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: Video Preview & Configuration Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 space-y-6 text-left"
        >
          {/* Video Card */}
          <div className="bg-[#0b0f19]/60 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            {data?.thumbnail ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-slate-900 group">
                <img src={data.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                  <Play className="text-white fill-white/20 animate-pulse" size={32} />
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-xl border border-white/10 bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={30} />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Awaiting Stream Metadata</span>
              </div>
            )}

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Target Video Module</span>
              <h2 className="text-base md:text-lg font-bold text-white mt-1 leading-snug truncate">
                {data?.videoTitle || "Initializing Stream Capture..."}
              </h2>
            </div>

            {/* Target Settings */}
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/5">
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
                <Globe size={14} className="text-slate-400 mx-auto" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mt-1">Language</span>
                <span className="text-xs font-bold text-white block mt-0.5 truncate capitalize">{data?.language || "english"}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
                <Target size={14} className="text-slate-400 mx-auto" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mt-1">Goal</span>
                <span className="text-xs font-bold text-white block mt-0.5 truncate capitalize">{data?.goal || "student"}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
                <Zap size={14} className="text-yellow-400 mx-auto fill-yellow-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mt-1">Cost</span>
                <span className="text-xs font-bold text-white block mt-0.5 truncate">{data?.creditsUsed ?? 1} Cr</span>
              </div>
            </div>
          </div>

          {/* Reassuring Notification block */}
          <div className="bg-blue-950/20 border border-blue-500/15 rounded-3xl p-5 space-y-3.5 shadow-sm text-left">
            <div className="flex items-center gap-2.5 text-blue-400">
              <ShieldCheck size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Reserved & Protected</h4>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Your credits have been securely reserved. You can safely keep this workspace open; notes will compile in the background and load immediately when ready.
            </p>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pt-1">
              <Clock size={12} />
              <span>Duration estimate: ~30–60 seconds</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Stepper Timeline progress */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Progress details */}
          <div className="bg-[#0b0f19]/30 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 text-left">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Processing Pipeline</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {ROTATING_MESSAGES[msgIdx]}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-400">{progress}%</span>
              </div>
            </div>

            {/* Glowing progress line */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.8 }}
              />
            </div>

            {/* Steps layout */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5">
              {EXTRACTION_STAGES.map((stage, idx) => {
                const status = getStageStatus(idx, progress);
                
                return (
                  <div key={idx} className="flex items-start gap-4 transition-all duration-300">
                    <div className="mt-1 flex-shrink-0">
                      {status === "completed" && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                      {status === "active" && (
                        <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/35 flex items-center justify-center text-blue-400">
                          <Loader2 size={10} className="animate-spin" />
                        </div>
                      )}
                      {status === "queued" && (
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold transition-colors ${
                        status === "completed" ? "text-slate-400 line-through decoration-slate-600" :
                        status === "active" ? "text-blue-400 font-extrabold" : "text-slate-600"
                      }`}>
                        {stage.label}
                      </h4>
                      {status === "active" && (
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{stage.desc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export const FailedScreen = ({ analysis, router }) => {
  const raw = analysis?.error || "";
  const isUserFacing =
    raw.includes("4 hours") ||
    raw.includes("premium AI quality") ||
    raw.includes("spoken content") ||
    raw.includes("unavailable or private") ||
    raw.includes("too short");
  const message = isUserFacing
    ? raw
    : "Something went wrong while compiling the speech transcripts. Please return and try a different link.";
  const isDurationError = raw.includes("4 hours") || raw.includes("premium AI quality");

  return (
    <div className="min-h-screen bg-[#080a12] text-white flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,#be123c,transparent_55%)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className={`rounded-3xl border p-8 bg-[#0b0f19]/60 backdrop-blur-2xl shadow-2xl text-left ${
          isDurationError ? "border-amber-500/20" : "border-rose-500/20"
        }`}>
          <div className="flex justify-center mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              isDurationError ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {isDurationError ? <Clock size={24} /> : <AlertTriangle size={24} />}
            </div>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-white text-center tracking-tight leading-none mb-3">
            {isDurationError ? "Video Too Long" : "Analysis Failed"}
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed text-center mb-8">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold active:scale-98 transition-all text-xs"
            >
              <ArrowLeft size={14} /> 
              <span>Try a Different Video</span>
            </button>
            {!isDurationError && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-white/10 rounded-2xl font-bold active:scale-98 transition-all text-xs"
              >
                <RefreshCw size={12} /> 
                <span>Retry Processing</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ErrorScreen = ({ error }) => (
  <div className="min-h-screen bg-[#080a12] text-white flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden">
    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,#be123c,transparent_50%)] pointer-events-none" />
    
    <div className="relative z-10 w-full max-w-sm text-center bg-[#0b0f19]/60 border border-rose-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-md">
        <AlertTriangle size={24} />
      </div>
      
      <h2 className="text-xl font-black tracking-tight leading-none mb-3">Connection Interrupted</h2>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">{error}</p>
      
      <button
        onClick={() => window.location.reload()}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs active:scale-98 transition-all shadow-md shadow-blue-500/10"
      >
        <span>Reconnect & Retry</span>
      </button>
    </div>
  </div>
);
