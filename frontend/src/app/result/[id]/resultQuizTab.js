"use client";

import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FiAward, FiCheck, FiDownload } from "react-icons/fi";
import { Section } from "./resultPageUI";

const DIFFICULTY_STYLE = {
  easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hard: "bg-red-500/20 text-red-300 border-red-500/30",
};

const QuizTab = ({ data, buildPDF }) => {
  const questions = data.quiz || [];
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [score, setScore] = useState(null);

  const getCorrectIndex = useCallback((q) => {
    if (typeof q.correctAnswerIndex === "number") return q.correctAnswerIndex;
    return (q.options || []).findIndex((opt) => opt === q.correctAnswer);
  }, []);

  const submit = useCallback(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      const correctIndex = getCorrectIndex(q);
      if (answers[i] === correctIndex) correct += 1;
    });
    setScore(correct);
  }, [answers, getCorrectIndex, questions]);

  const reset = useCallback(() => {
    setAnswers({});
    setRevealed({});
    setScore(null);
  }, []);

  if (!questions.length) {
    return <Section title="Quiz" icon={FiAward}><p className="text-gray-500">No quiz questions available.</p></Section>;
  }

  const allAnswered = Object.keys(answers).length === questions.length;
  const scorePercent = score !== null ? Math.round((score / questions.length) * 100) : null;

  return (
    <Section title="Quiz" icon={FiAward} action={<button onClick={() => buildPDF(data, "quiz")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"><FiDownload /> PDF</button>}>
      {score !== null && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-5 rounded-2xl border text-center ${scorePercent >= 80 ? "border-emerald-500/30 bg-emerald-500/10" : scorePercent >= 50 ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`}>
          <p className="text-4xl font-black text-white">{score}/{questions.length}</p>
          <p className="text-gray-400 text-sm mt-1">{scorePercent >= 80 ? "🏆 Excellent — you've mastered this material!" : scorePercent >= 50 ? "📚 Good — review the missed concepts." : "🔄 Keep studying — revisit your notes."}</p>
          <button onClick={reset} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors">Try Again</button>
        </motion.div>
      )}
      <div className="flex flex-col gap-5">
        {questions.map((q, i) => {
          const selected = answers[i];
          const correctIdx = getCorrectIndex(q);
          const isRevealed = revealed[i];
          const isCorrect = selected === correctIdx;
          return (
            <motion.div key={`${q.question}-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`rounded-2xl border p-5 transition-all ${isRevealed && isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : isRevealed && !isCorrect ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <p className="text-white font-semibold text-sm leading-6">{q.question}</p>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${DIFFICULTY_STYLE[q.difficulty] || DIFFICULTY_STYLE.medium}`}>
                  {q.difficulty}
                </span>
              </div>
              <div className="grid gap-2">
                {(q.options || []).map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isRight = oi === correctIdx;
                  let cls = "border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/8";
                  if (isRevealed) {
                    cls = isRight ? "border-emerald-500/50 bg-emerald-500/15 text-white" : isSelected ? "border-red-500/50 bg-red-500/10 text-gray-400" : "border-white/5 bg-white/[0.02] text-gray-600";
                  } else if (isSelected) {
                    cls = "border-indigo-500/60 bg-indigo-500/15 text-white";
                  }
                  return (
                    <button key={`${opt}-${oi}`} disabled={isRevealed} onClick={() => setAnswers((prev) => ({ ...prev, [i]: oi }))} className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all disabled:cursor-default ${cls}`}>
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
      {score === null && <div className="mt-6 flex items-center justify-between"><p className="text-xs text-gray-500">{Object.keys(answers).length}/{questions.length} answered</p><button onClick={submit} disabled={!allAnswered} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">Submit Quiz</button></div>}
    </Section>
  );
};

export default memo(QuizTab);
