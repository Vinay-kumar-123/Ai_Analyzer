import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiBook, FiCheckCircle, FiDownload, FiHelpCircle, FiMap, FiZap, FiAward, FiCopy, FiCheck } from "react-icons/fi";
import NotesTab from "@/components/NotesTab";

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

const Card = ({ children, className = "" }) => (
  <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm ${className}`}>{children}</div>
);

const CopyBtn = ({ text, id, copied, copy }) => (
  <button onClick={() => copy(text, id)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all">
    {copied === id ? <FiCheck className="text-green-400" /> : <FiCopy />}
    {copied === id ? "Copied" : "Copy"}
  </button>
);

function QACard({ item, index, copy, copied }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors cursor-pointer ${open ? "border-indigo-500/40 bg-white/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`} onClick={() => setOpen((v) => !v)}>
      <div className="flex items-start gap-4 p-5">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">Q{index + 1}</span>
        <p className="flex-1 text-white font-medium text-sm leading-6">{item.question}</p>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-500 flex-shrink-0 mt-0.5">▾</motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 pl-16 border-t border-white/10 pt-4">
              <p className="text-gray-300 text-sm leading-7">{item.answer}</p>
              <div className="mt-3">
                <CopyBtn text={`Q: ${item.question}\nA: ${item.answer}`} id={`qa-${index}`} copied={copied} copy={copy} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuizTab({ data, buildPDF }) {
  const questions = data.quiz || [];
  const [answers, setAnswers] = React.useState({});
  const [revealed, setRevealed] = React.useState({});
  const [score, setScore] = React.useState(null);

  const getCorrectIndex = React.useCallback((q) => {
    if (typeof q.correctAnswerIndex === "number") return q.correctAnswerIndex;
    return (q.options || []).findIndex((opt) => opt === q.correctAnswer);
  }, []);

  const submit = React.useCallback(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      const correctIndex = getCorrectIndex(q);
      if (answers[i] === correctIndex) correct++;
    });
    setScore(correct);
  }, [answers, getCorrectIndex, questions]);

  if (!questions.length) return <Section title="Quiz" icon={FiAward}><p className="text-gray-500">No quiz questions available.</p></Section>;

  return (
    <Section title="Quiz" icon={FiAward} action={<button onClick={() => buildPDF(data, "quiz")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
      <div className="flex flex-col gap-5">
        {questions.map((q, i) => {
          const selected = answers[i];
          const correctIdx = getCorrectIndex(q);
          const isRevealed = revealed[i];
          const isCorrect = selected === correctIdx;

          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`rounded-2xl border p-5 transition-all ${isRevealed && isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : isRevealed && !isCorrect ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <p className="text-white font-semibold text-sm leading-6">{q.question}</p>
                </div>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full border text-xs font-semibold capitalize text-gray-200">{q.difficulty}</span>
              </div>

              <div className="grid gap-2">
                {(q.options || []).map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isRight = oi === correctIdx;
                  let cls = "border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/8";
                  if (isRevealed) cls = isRight ? "border-emerald-500/50 bg-emerald-500/15 text-white" : isSelected ? "border-red-500/50 bg-red-500/10 text-gray-400" : "border-white/5 bg-white/[0.02] text-gray-600";
                  else if (isSelected) cls = "border-indigo-500/60 bg-indigo-500/15 text-white";

                  return (
                    <button key={oi} disabled={isRevealed} onClick={() => setAnswers((prev) => ({ ...prev, [i]: oi }))} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all disabled:cursor-default ${cls}`}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                      {isRevealed && isRight && <FiCheck className="ml-auto text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-3">
                {!isRevealed && selected !== undefined && <button onClick={() => setRevealed((prev) => ({ ...prev, [i]: true }))} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 transition-colors">Check Answer</button>}
                {isRevealed && q.explanation && <p className="text-xs text-gray-400 leading-5"><span className="text-indigo-400 font-semibold">Explanation: </span>{q.explanation}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-gray-500">{Object.keys(answers).length}/{questions.length} answered</p>
        <button onClick={submit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">Submit Quiz</button>
      </div>
    </Section>
  );
}

export function ResultPageUI({ data, activeTab, TAB_CONFIG, copy, copied, lazyLoading, lazyError, buildPDF }) {
  const activeTabConfig = TAB_CONFIG.find((t) => t.id === activeTab);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-8 pb-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight mb-2">{data.videoTitle || "AI Analysis"}</h1>
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => buildPDF(data, "full")} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"><FiDownload /> Full PDF</button>
          <button onClick={() => buildPDF(data, "notes")} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-semibold rounded-xl transition-colors"><FiDownload /> Notes PDF</button>
          <CopyBtn text={data.summary} id="summary-hero" copied={copied} copy={copy} />
        </div>
        {lazyLoading && activeTabConfig?.lazy && <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-100">Generating {activeTabConfig.label} content. This may take a moment.</div>}
        {lazyError && activeTabConfig?.lazy && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{lazyError}</div>}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-8">

          {activeTab === "summary" && (
            <Section title="Summary" icon={FiActivity} action={<div className="flex gap-2"><CopyBtn text={data.summary} id="summary" copied={copied} copy={copy} /><button onClick={() => buildPDF(data, "summary")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button></div>}>
              <Card><p className="text-gray-300 leading-8 text-base">{data.summary}</p></Card>
            </Section>
          )}

          {activeTab === "notes" && (
            <Section title="Premium Notes" icon={FiBook} action={<div className="flex gap-2"><CopyBtn text={data.notes} id="notes" copied={copied} copy={copy} /><button onClick={() => buildPDF(data, "notes")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all"><FiDownload /> Download</button></div>}>
              <NotesTab data={data} onDownloadPDF={() => buildPDF(data, "notes")} />
            </Section>
          )}

          {activeTab === "keypoints" && (
            <Section title="Key Points" icon={FiCheckCircle}>{data.keyPoints?.length > 0 ? <div className="grid md:grid-cols-2 gap-3">{data.keyPoints.map((point, i) => <Card key={i} className="flex gap-3 items-start"><span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">{i+1}</span><p className="text-gray-300 text-sm leading-6">{point}</p></Card>)}</div> : <p className="text-gray-500">No key points available.</p>}</Section>
          )}

          {activeTab === "actions" && (
            <Section title="Action Steps" icon={FiZap}>{data.actionSteps?.length > 0 ? <div className="flex flex-col gap-3">{data.actionSteps.map((step, i) => <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}><Card className="flex gap-4 items-center group hover:border-indigo-500/40 transition-colors cursor-default"><div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-indigo-500/50 text-indigo-400 text-sm font-bold flex items-center justify-center">{i+1}</div><p className="text-gray-200 text-sm leading-6 flex-1">{step}</p><FiCheckCircle className="text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0" /></Card></motion.div>)}</div> : <p className="text-gray-500">No action steps available.</p>}</Section>
          )}

          {activeTab === "roadmap" && (
            <Section title="Learning Roadmap" icon={FiMap} action={<button onClick={() => buildPDF(data, "roadmap")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
              {data.roadmap?.length > 0 ? <div className="relative"><div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/30 to-transparent" /><div className="flex flex-col gap-4 pl-12">{data.roadmap.map((step, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative"><div className="absolute -left-[2.4rem] top-3 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-[#080a12] shadow-lg shadow-indigo-500/40" /><Card><div className="flex items-start gap-3"><span className="text-xs font-bold text-indigo-400 mt-0.5 flex-shrink-0">STEP {i+1}</span><p className="text-gray-300 text-sm leading-6">{step}</p></div></Card></motion.div>)}</div></div> : <p className="text-gray-500">No roadmap available.</p>}
            </Section>
          )}

          {activeTab === "qa" && (
            <Section title="Q & A" icon={FiHelpCircle} action={<button onClick={() => buildPDF(data, "qa")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
              {data.qa?.length > 0 ? <div className="flex flex-col gap-4">{data.qa.map((item, i) => <QACard key={i} item={item} index={i} copy={copy} copied={copied} />)}</div> : <p className="text-gray-500">No Q&A available.</p>}
            </Section>
          )}

          {activeTab === "quiz" && <QuizTab data={data} buildPDF={buildPDF} />}

        </motion.div>
      </AnimatePresence>
    </>
  );
}
