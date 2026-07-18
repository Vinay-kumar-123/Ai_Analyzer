import { useCallback } from "react";
import { motion } from "framer-motion";
import { FiClock, FiAlertCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

const STAGES = [
  { from: 0, to: 15, emoji: "⏳", label: "Getting in line…", sub: "Your request is queued" },
  { from: 15, to: 30, emoji: "📡", label: "Fetching transcript…", sub: "Pulling the video's spoken content" },
  { from: 30, to: 55, emoji: "🧠", label: "Deep-reading the content…", sub: "AI is understanding every concept and example" },
  { from: 55, to: 75, emoji: "✍️", label: "Writing your premium notes…", sub: "Building detailed structured study material" },
  { from: 75, to: 90, emoji: "🚀", label: "Building your learning roadmap…", sub: "Creating your personalized step-by-step roadmap" },
  { from: 90, to: 101, emoji: "✅", label: "Finalizing your analysis…", sub: "Almost there — saving your learning system" },
];

const getStage = (p) =>
  STAGES.find((s) => p >= s.from && p < s.to) || STAGES[STAGES.length - 1];

export const LoadingScreen = ({ data }) => {
  const progress = data?.progress ?? 5;
  const status = data?.status ?? "queued";
  const stage = getStage(progress);

  return (
    <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>
      <motion.div
        className="relative z-10 text-center w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          key={stage.emoji}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl mb-6"
        >
          {stage.emoji}
        </motion.div>
        <motion.h1
          key={stage.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-white mb-2 tracking-tight"
        >
          {stage.label}
        </motion.h1>
        <motion.p
          key={stage.sub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-sm mb-8 leading-relaxed"
        >
          {stage.sub}
        </motion.p>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs text-gray-500 font-medium">AI Engine</span>
            <span className="text-xs font-bold text-indigo-400">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.9 }}
            />
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          {STAGES.map((s, i) => {
            const done = progress >= s.to;
            const active = progress >= s.from && progress < s.to;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                  done
                    ? "w-2 h-2 bg-indigo-400"
                    : active
                      ? "w-4 h-2 bg-indigo-500"
                      : "w-2 h-2 bg-white/15"
                }`}
              />
            );
          })}
        </div>
        <p className="text-gray-600 text-xs mt-6">
          {status === "queued" ? "Usually under 30 seconds to start" : "This updates automatically"}
        </p>
      </motion.div>
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
    : "Something went wrong while analyzing this video. Please go back and try again.";
  const isDurationError = raw.includes("4 hours") || raw.includes("premium AI quality");

  return (
    <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center gap-6 px-6">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div
          className={`rounded-2xl border p-8 ${
            isDurationError
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              {isDurationError ? (
                <FiClock className="text-amber-400 text-3xl" />
              ) : (
                <FiAlertCircle className="text-red-400 text-3xl" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">
            {isDurationError ? "Video Too Long" : "Analysis Failed"}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-7">{message}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors text-sm"
            >
              <FiArrowLeft size={15} /> Try a Different Video
            </button>
            {!isDurationError && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white/8 hover:bg-white/12 text-gray-300 rounded-xl font-semibold transition-colors text-sm"
              >
                <FiRefreshCw size={14} /> Reload Page
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ErrorScreen = ({ error }) => (
  <div className="min-h-screen bg-[#080a12] flex flex-col items-center justify-center gap-5 px-6">
    <FiAlertCircle className="text-red-400 text-5xl" />
    <p className="text-red-400 text-xl text-center max-w-md">{error}</p>
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-colors"
    >
      Retry
    </button>
  </div>
);
