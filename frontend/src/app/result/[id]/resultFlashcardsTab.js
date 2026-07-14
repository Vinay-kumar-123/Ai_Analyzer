"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookOpen, FiCheck, FiDownload } from "react-icons/fi";
import { Section } from "./resultPageUI";

const DIFFICULTY_STYLE = {
  easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
};

const FlashcardsTab = ({ data, buildPDF }) => {
  const cards = data.flashcards || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((card) => card.difficulty === filter);
  }, [cards, filter]);

  const current = filtered[currentIdx];

  const next = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((idx) => Math.min(idx + 1, filtered.length - 1)), 120);
  }, [filtered.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setCurrentIdx((idx) => Math.max(idx - 1, 0)), 120);
  }, []);

  const toggleMastered = useCallback(() => {
    setMastered((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(currentIdx)) nextSet.delete(currentIdx);
      else nextSet.add(currentIdx);
      return nextSet;
    });
  }, [currentIdx]);

  useEffect(() => {
    setCurrentIdx(0);
    setFlipped(false);
  }, [filter]);

  if (!cards.length) {
    return <Section title="Flashcards" icon={FiBookOpen}><p className="text-gray-500">No flashcards available.</p></Section>;
  }

  return (
    <Section title="Flashcards" icon={FiBookOpen} action={<button onClick={() => buildPDF(data, "flashcards")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>{filtered.length} cards</span>
          <span>·</span>
          <span className="text-emerald-400">{mastered.size} mastered</span>
        </div>
        <div className="flex gap-1.5">
          {['all', 'easy', 'medium', 'hard'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white/8 hover:bg-white/12 text-gray-400'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {current && <div className="max-w-2xl mx-auto"><AnimatePresence mode="wait"><motion.div key={`${currentIdx}-${flipped}`} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.16 }} onClick={() => setFlipped((value) => !value)} className={`min-h-[200px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-colors mb-4 ${flipped ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'} ${mastered.has(currentIdx) ? 'ring-1 ring-emerald-500/30' : ''}`}><span className={`mb-4 px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${DIFFICULTY_STYLE[current.difficulty] || DIFFICULTY_STYLE.medium}`}>{current.difficulty}</span><p className={`font-semibold leading-7 ${flipped ? 'text-gray-300 text-sm' : 'text-white text-base'}`}>{flipped ? current.back : current.front}</p>{flipped && current.tags?.length > 0 && <div className="flex flex-wrap justify-center gap-1.5 mt-4">{current.tags.map((tag, ti) => <span key={`${tag}-${ti}`} className="px-2 py-0.5 bg-white/10 text-gray-400 text-xs rounded-full">#{tag}</span>)}</div>}{!flipped && <p className="text-gray-600 text-xs mt-4">Click to reveal answer</p>}</motion.div></AnimatePresence><div className="flex items-center justify-between gap-4"><button onClick={prev} disabled={currentIdx === 0} className="px-4 py-2 bg-white/8 hover:bg-white/12 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-sm rounded-xl transition-colors">← Prev</button><div className="flex items-center gap-3"><button onClick={toggleMastered} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mastered.has(currentIdx) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/8 hover:bg-white/12 text-gray-400'}`}>{mastered.has(currentIdx) ? '✓ Mastered' : 'Mark as mastered'}</button><span className="text-xs text-gray-600">{currentIdx + 1} / {filtered.length}</span></div><button onClick={next} disabled={currentIdx === filtered.length - 1} className="px-4 py-2 bg-white/8 hover:bg-white/12 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-sm rounded-xl transition-colors">Next →</button></div><div className="flex justify-center gap-1 mt-5 flex-wrap max-w-xs mx-auto">{filtered.map((_, i) => <button key={`${i}-${_.front || ''}`} onClick={() => { setFlipped(false); setCurrentIdx(i); }} className={`rounded-full transition-all ${i === currentIdx ? 'w-4 h-2 bg-indigo-400' : mastered.has(i) ? 'w-2 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/20'}`} />)}</div></div>}
      {filtered.length > 1 && <div className="mt-10"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">All Cards</h3><div className="grid md:grid-cols-2 gap-3">{filtered.map((card, i) => <button key={`${card.front}-${i}`} onClick={() => { setCurrentIdx(i); setFlipped(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`text-left rounded-xl border p-4 transition-all hover:border-indigo-500/40 ${i === currentIdx ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02]'}`}><div className="flex items-start justify-between gap-2"><p className="text-white text-xs font-semibold leading-5 flex-1">{card.front}</p>{mastered.has(i) && <FiCheck className="text-emerald-400 flex-shrink-0 text-xs mt-0.5" />}</div><p className="text-gray-500 text-xs mt-1 leading-4 line-clamp-2">{card.back}</p></button>)}</div></div>}
    </Section>
  );
};

export default memo(FlashcardsTab);
