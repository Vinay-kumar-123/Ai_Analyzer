"use client";

import React from "react";
import { Sparkles, AlertCircle, X, CheckCircle2 } from "lucide-react";

export default function CreditUnlockModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  userCredits = 0,
}) {
  if (!isOpen) return null;

  const hasCredits = userCredits >= 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0f19] p-6 md:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles size={26} />
          </div>

          <h3 id="unlock-modal-title" className="text-xl font-black text-white tracking-tight">
            Unlock 10 More AI Messages
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            You have used all <strong className="text-white font-bold">10 free AI Tutor messages</strong> for this video analysis.
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Package Offer:</span>
            <span className="text-blue-400 font-bold">+10 Tutor Messages</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Cost:</span>
            <span className="text-amber-400 font-bold">1 Credit</span>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Your Credit Balance:</span>
            <span className={`font-bold ${hasCredits ? "text-emerald-400" : "text-rose-400"}`}>
              {userCredits} {userCredits === 1 ? "credit" : "credits"}
            </span>
          </div>
        </div>

        {!hasCredits && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>You do not have enough credits. Please buy credits to continue.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {hasCredits ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? (
                "Unlocking..."
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Spend 1 Credit to Unlock</span>
                </>
              )}
            </button>
          ) : (
            <a
              href="/buy-credits"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20"
            >
              Buy Credits Now
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full text-xs font-semibold text-slate-400 hover:text-slate-200 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
