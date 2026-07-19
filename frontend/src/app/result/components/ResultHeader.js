"use client";

import { FiClock, FiFileText, FiTag } from "react-icons/fi";

/**
 * ============================================================================
 * AI Learning OS
 * Result Header
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Display analysis metadata
 * • Display title
 * • Display content type
 * • Display transcript length
 * • Display processing status
 *
 * This component NEVER:
 * - Calls APIs
 * - Manages state
 * - Generates content
 * - Contains business logic
 * ============================================================================
 */

import { 
  Globe, Target, Clock, Zap, Calendar, Play, FileText, ChevronRight
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";

const formatDuration = (sec) => {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

export default function ResultHeader({ analysis }) {
  if (!analysis) return null;

  const {
    title,
    videoTitle,
    thumbnail,
    channelTitle,
    duration,
    language,
    goal,
    createdAt,
    contentType,
    transcriptLength,
    processingTime,
  } = analysis;

  const displayTitle = videoTitle || title || "AI Analysis";

  return (
    <header className="mb-8 bg-[#0b0f19]/60 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
      
      <div className="relative z-10 grid md:grid-cols-12 gap-6 items-center">
        
        {/* THUMBNAIL PREVIEW */}
        <div className="md:col-span-4 lg:col-span-3">
          {thumbnail ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-slate-900 group shadow-md">
              <img src={thumbnail} alt="Video Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Play className="text-white fill-white/20" size={24} />
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-2xl border border-white/10 bg-slate-900/50 flex items-center justify-center text-slate-600 shadow-inner">
              <FaYoutube size={32} className="text-slate-700" />
            </div>
          )}
        </div>

        {/* DETAILS COLUMN */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                {contentType || "General"}
              </span>
              {channelTitle && (
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                  • {channelTitle}
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
              {displayTitle}
            </h1>
          </div>

          {/* Info cards row */}
          <div className="flex flex-wrap gap-2 pt-2">
            
            {/* Language */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Globe size={13} className="text-slate-400" />
              <span className="font-semibold capitalize">{language || "english"}</span>
            </div>

            {/* Study Goal */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Target size={13} className="text-slate-400" />
              <span className="font-semibold capitalize">{goal || "student"}</span>
            </div>

            {/* Duration */}
            {duration && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <Clock size={13} className="text-slate-400" />
                <span className="font-semibold">{formatDuration(duration)}</span>
              </div>
            )}

            {/* Created At */}
            {createdAt && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <Calendar size={13} className="text-slate-400" />
                <span className="font-semibold">{formatDate(createdAt)}</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </header>
  );
}