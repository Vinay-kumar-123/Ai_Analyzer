"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  ChevronRight,
  Zap,
} from "lucide-react";
import { getTutorStatus, sendTutorMessage, purchaseTutorPack } from "../../services/resultApi";
import CreditUnlockModal from "../tutor/CreditUnlockModal";

const STARTER_PROMPTS = [
  "Explain this simply",
  "Give a real-world example",
  "What are common mistakes to avoid?",
  "Give interview questions on this topic",
  "Ask me a quiz question about this video",
];

export default function AITutorTab({ analysis }) {
  const analysisId = analysis?._id;

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [usage, setUsage]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [purchasing, setPurchasing]   = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch initial tutor status and history on mount
  useEffect(() => {
    if (!analysisId) return;
    let isMounted = true;
    async function loadStatus() {
      try {
        const res = await getTutorStatus(analysisId);
        if (isMounted && res?.success) {
          setUsage(res.data?.usage || null);
          const history = res.data?.history || [];
          if (history.length > 0) {
            setMessages(history);
          }
        }
      } catch (err) {
        console.error("Failed to load tutor status:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }
    loadStatus();
    return () => { isMounted = false; };
  }, [analysisId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  if (!analysis) return null;

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput("");

    // Optimistic message append
    const userMsg = { role: "user", content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendTutorMessage(analysisId, text);

      if (res?.success) {
        setUsage(res.data?.usage || null);
        const aiMsg = {
          role: "assistant",
          content: res.data?.reply || "",
          followUpSuggestions: res.data?.followUpSuggestions || [],
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (res?.error === "FREE_LIMIT_EXHAUSTED" || res?.requiresCredit) {
        // Limit exhausted — show unlock modal
        setShowModal(true);
        // Revert optimistic user message if desired or keep it
      } else {
        const errorMsg = {
          role: "assistant",
          content: res?.message || "Failed to generate tutor response. Please try again.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error("sendTutorMessage error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockConfirm = async () => {
    setPurchasing(true);
    try {
      const res = await purchaseTutorPack(analysisId);
      if (res?.success) {
        setShowModal(false);
        setUsage(res.data?.usage || null);
      } else {
        alert(res?.message || "Failed to purchase credit pack.");
      }
    } catch (err) {
      console.error("purchaseTutorPack error:", err);
    } finally {
      setPurchasing(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (initialLoading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0f19]/30 p-12 text-center space-y-4">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <p className="text-xs text-slate-400">Connecting to AI Tutor...</p>
      </div>
    );
  }

  const freeRemaining = usage?.freeMessagesRemaining ?? 10;
  const totalRemaining = usage?.totalMessagesRemaining ?? 10;

  return (
    <section className="space-y-4 text-left flex flex-col h-[600px] max-h-[80vh]">
      {/* ── HEADER & USAGE BADGE ───────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/5 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-400" />
            <span>AI Tutor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ask questions grounded strictly in this video&apos;s context
          </p>
        </div>

        {/* Message Quota Badge */}
        <div className="flex items-center gap-2">
          {totalRemaining > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold">
              <Zap size={12} />
              <span>{freeRemaining > 0 ? `Free: ${freeRemaining} / 10` : `Remaining: ${totalRemaining}`}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              <Sparkles size={12} />
              <span>Unlock Messages (1 Credit)</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MESSAGES CONTAINER ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          /* Empty State / Starter Prompts */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Bot size={28} />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-base font-bold text-white">Ask your Personal AI Tutor</h3>
              <p className="text-xs text-slate-400">
                I can explain concepts, give code examples, clarify doubts, or quiz you based on this video.
              </p>
            </div>

            {/* Starter Prompt Chips */}
            <div className="w-full max-w-lg space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suggested Starters</span>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(promptText)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-all hover:border-white/20 text-left"
                  >
                    <span>{promptText}</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10"
                        : "bg-[#0b0f19] border border-white/10 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestion chips on latest AI message */}
                  {!isUser && msg.followUpSuggestions?.length > 0 && idx === messages.length - 1 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.followUpSuggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSend(suggestion)}
                          className="text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                        >
                          <Sparkles size={10} />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 bg-[#0b0f19] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
              <Loader2 size={14} className="animate-spin text-blue-400" />
              <span>Thinking based on video context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR ───────────────────────────────────────── */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="shrink-0 pt-2 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            totalRemaining <= 0
              ? "Free limit reached. Click unlock to continue..."
              : "Ask a question about this video..."
          }
          disabled={loading || totalRemaining <= 0}
          className="flex-1 rounded-xl border border-white/10 bg-[#0b0f19]/50 px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !input.trim() || totalRemaining <= 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* ── CREDIT UNLOCK MODAL ────────────────────────────── */}
      <CreditUnlockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleUnlockConfirm}
        loading={purchasing}
        userCredits={analysis.userCredits || 10}
      />
    </section>
  );
}
