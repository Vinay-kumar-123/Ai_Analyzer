"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiCheckCircle, FiDownload, FiAward, FiBookOpen, FiHelpCircle, FiZap, FiMap, FiClock, FiCopy } from "react-icons/fi";
import dynamic from "next/dynamic";
import NotesTab from "@/components/NotesTab";
import { Section, Card } from "./resultPageUI";
import { buildPDF } from "./resultPdf";

const QuizTab = dynamic(() => import("./resultQuizTab"), { ssr: false });

const DIFFICULTY_STYLE = {
  easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function ResultTabs({ data, copy, copied, activeTab, onTabChange }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-8">
        {activeTab === "summary" && <SummaryTab data={data} copy={copy} copied={copied} />}
        {activeTab === "notes" && <NotesTabPanel data={data} copy={copy} copied={copied} />}
        {activeTab === "keypoints" && <KeyPointsTab data={data} />}
        {activeTab === "actions" && <ActionsTab data={data} />}
        {activeTab === "roadmap" && <RoadmapTab data={data} />}
        {activeTab === "qa" && <QATab data={data} copy={copy} copied={copied} />}
        {activeTab === "quiz" && <QuizTab data={data} buildPDF={buildPDF} />}
      </motion.div>
    </AnimatePresence>
  );
}

function SummaryTab({ data, copy, copied }) {
  return (
    <Section title="Summary" icon={FiClock} action={<div className="flex gap-2"><button onClick={() => buildPDF(data, "summary")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button></div>}>
      <Card>
        <p className="text-gray-300 leading-8 text-base">{data.summary}</p>
      </Card>
      {(data.duration > 0 || data.creditsUsed > 0 || data.keyPoints?.length > 0 || data.qa?.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {data.duration > 0 && <Card className="text-center"><p className="text-2xl font-black text-indigo-400">{formatDuration(data.duration)}</p><p className="text-xs text-gray-500 mt-1">Video Length</p></Card>}
          {data.creditsUsed > 0 && <Card className="text-center"><p className="text-2xl font-black text-violet-400">{data.creditsUsed}</p><p className="text-xs text-gray-500 mt-1">Credits Used</p></Card>}
          {data.keyPoints?.length > 0 && <Card className="text-center"><p className="text-2xl font-black text-emerald-400">{data.keyPoints.length}</p><p className="text-xs text-gray-500 mt-1">Key Points</p></Card>}
          {data.qa?.length > 0 && <Card className="text-center"><p className="text-2xl font-black text-amber-400">{data.qa.length}</p><p className="text-xs text-gray-500 mt-1">Q&A Pairs</p></Card>}
        </div>
      )}
    </Section>
  );
}

function NotesTabPanel({ data, copy, copied }) {
  return (
    <Section title="Premium Notes" icon={FiBookOpen} action={<div className="flex gap-2"><button onClick={() => buildPDF(data, "notes")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all"><FiDownload /> Download</button></div>}>
      <NotesTab data={data} onDownloadPDF={() => buildPDF(data, "notes")} />
      {data.confusion?.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2"><FiHelpCircle className="text-amber-400" /> Difficult Concepts Explained</h3>
          <div className="grid gap-4">
            {data.confusion.map((c, i) => (
              <Card key={`${c.concept}-${i}`} className="border-amber-500/20 bg-amber-500/5">
                <h4 className="font-bold text-white text-base mb-2">{c.concept}</h4>
                <p className="text-gray-300 text-sm leading-7 mb-3">{c.simpleExplanation}</p>
                {c.realLifeExample && <div className="flex gap-2 text-xs text-amber-300 bg-amber-500/10 rounded-xl p-3"><span>💡</span><span>{c.realLifeExample}</span></div>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function KeyPointsTab({ data }) {
  return (
    <Section title="Key Points" icon={FiCheckCircle}>
      {data.keyPoints?.length > 0 ? <div className="grid md:grid-cols-2 gap-3">{data.keyPoints.map((point, i) => <Card key={`${point}-${i}`} className="flex gap-3 items-start"><span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span><p className="text-gray-300 text-sm leading-6">{point}</p></Card>)}</div> : <p className="text-gray-500">No key points available.</p>}
    </Section>
  );
}

function ActionsTab({ data }) {
  return (
    <Section title="Action Steps" icon={FiZap}>
      {data.actionSteps?.length > 0 ? <div className="flex flex-col gap-3">{data.actionSteps.map((step, i) => <motion.div key={`${step}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}><Card className="flex gap-4 items-center group hover:border-indigo-500/40 transition-colors cursor-default"><div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-indigo-500/50 text-indigo-400 text-sm font-bold flex items-center justify-center">{i + 1}</div><p className="text-gray-200 text-sm leading-6 flex-1">{step}</p><FiCheckCircle className="text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0" /></Card></motion.div>)}</div> : <p className="text-gray-500">No action steps available.</p>}
    </Section>
  );
}

function RoadmapTab({ data }) {
  return (
    <Section title="Learning Roadmap" icon={FiMap} action={<button onClick={() => buildPDF(data, "roadmap")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
      {data.roadmap?.length > 0 ? <div className="relative"><div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/30 to-transparent" /><div className="flex flex-col gap-4 pl-12">{data.roadmap.map((step, i) => <motion.div key={`${step}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative"><div className="absolute -left-[2.4rem] top-3 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#080a12] shadow-lg shadow-indigo-500/40" /><Card><div className="flex items-start gap-3"><span className="text-xs font-bold text-indigo-400 mt-0.5 flex-shrink-0">STEP {i + 1}</span><p className="text-gray-300 text-sm leading-6">{step}</p></div></Card></motion.div>)}</div></div> : <p className="text-gray-500">No roadmap available.</p>}
      {data.learningPath?.length > 0 && <div className="mt-10"><h3 className="text-lg font-bold mb-4 text-gray-300">Next Steps & Resources</h3><div className="flex flex-col gap-2">{data.learningPath.map((item, i) => <div key={`${item}-${i}`} className="flex items-start gap-3 text-sm text-gray-400"><span className="text-indigo-400 mt-0.5">→</span>{item}</div>)}</div></div>}
    </Section>
  );
}

function QATab({ data, copy, copied }) {
  return (
    <Section title="Q & A" icon={FiHelpCircle} action={<button onClick={() => buildPDF(data, "qa")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
      {data.qa?.length > 0 ? <div className="flex flex-col gap-4">{data.qa.map((item, i) => <QACard key={`${item.question}-${i}`} item={item} index={i} copy={copy} copied={copied} />)}</div> : <p className="text-gray-500">No Q&A available.</p>}
    </Section>
  );
}

function QACard({ item, index, copy, copied }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors cursor-pointer ${open ? "border-indigo-500/40 bg-white/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`} onClick={() => setOpen((v) => !v)}>
      <div className="flex items-start gap-4 p-5">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">Q{index + 1}</span>
        <p className="flex-1 text-white font-medium text-sm leading-6">{item.question}</p>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-500 flex-shrink-0 mt-0.5">▾</motion.span>
      </div>
      <AnimatePresence>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}><div className="px-5 pb-5 pl-16 border-t border-white/10 pt-4"><p className="text-gray-300 text-sm leading-7">{item.answer}</p><div className="mt-3"><button onClick={(event) => { event.stopPropagation(); copy(`Q: ${item.question}\nA: ${item.answer}`, `qa-${index}`); }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all">{copied === `qa-${index}` ? <FiCheck className="text-green-400" /> : <FiCopy />} {copied === `qa-${index}` ? "Copied" : "Copy"}</button></div></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default ResultTabs;
