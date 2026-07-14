"use client";

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCircle2, Terminal, Code2,
  AlertTriangle, Target, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";

const ActionEngine = ({ steps = [] }) => {
  const [completed, setCompleted] = useState([]);
  const [expanded,  setExpanded]  = useState([]);
  const [copied,    setCopied]    = useState("");

  const progress = useMemo(() => {
    if (!steps.length) return 0;
    return Math.round((completed.length / steps.length) * 100);
  }, [completed, steps]);

  const toggleStep = (index) => {
    setCompleted((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleExpand = (index) => {
    setExpanded((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const copyText = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  };

  if (!steps.length) {
    return (
      <div className="bg-gray-50 border border-dashed rounded-3xl p-10 text-center">
        <Sparkles className="mx-auto text-blue-500 w-12 h-12" />
        <h2 className="text-2xl font-bold mt-4">No Execution Steps</h2>
        <p className="text-gray-500 mt-2">AI could not generate execution flow for this content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold">AI Execution Engine 🚀</h2>
            <p className="text-blue-100 mt-2">Step-by-step practical implementation roadmap</p>
          </div>
          <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur">
            <div className="text-sm text-blue-100">Completion</div>
            <div className="text-3xl font-bold">{progress}%</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Learning Progress</span>
            <span>{completed.length}/{steps.length} Steps</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-white h-full rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {steps.map((step, i) => {
          const isCompleted = completed.includes(i);
          const isExpanded  = expanded.includes(i);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
                isCompleted ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="p-6">
                {/* Step header row */}
                <div className="flex justify-between gap-4 items-start">
                  <div className="flex gap-4">
                    {/* Number badge */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isCompleted ? "bg-green-500 text-white" : "bg-blue-100 text-blue-700"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Title + whatToDo */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold">{step.title || `Step ${i + 1}`}</h3>
                        {isCompleted && (
                          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      {step.whatToDo && (
                        <p className="text-gray-600 mt-2 leading-7 text-sm">{step.whatToDo}</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStep(i)}
                      className={`p-2 rounded-xl transition ${
                        isCompleted ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleExpand(i)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-5 overflow-hidden"
                    >

                      {/* Command block */}
                      {step.command && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Terminal className="text-green-600" size={16} />
                            <h4 className="font-bold">Command</h4>
                          </div>
                          <div className="relative">
                            <pre className="bg-black text-green-400 rounded-2xl p-5 overflow-x-auto text-sm leading-7">
                              <code>{step.command}</code>
                            </pre>
                            <button
                              onClick={() => copyText(step.command, `cmd-${i}`)}
                              className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition"
                            >
                              {copied === `cmd-${i}` ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Code block */}
                      {step.code && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Code2 className="text-blue-600" size={16} />
                            <h4 className="font-bold">Code</h4>
                          </div>
                          <div className="relative">
                            <pre className="bg-[#0f172a] text-green-400 rounded-2xl p-5 overflow-x-auto text-sm leading-7 border border-slate-700">
                              <code>{step.code}</code>
                            </pre>
                            <button
                              onClick={() => copyText(step.code, `code-${i}`)}
                              className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition"
                            >
                              {copied === `code-${i}` ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expected result */}
                      {step.expectedResult && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="text-blue-600" size={16} />
                            <h4 className="font-bold">Expected Result</h4>
                          </div>
                          <p className="text-gray-700 leading-7 text-sm">{step.expectedResult}</p>
                        </div>
                      )}

                      {/* Common mistake */}
                      {step.commonMistake && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="text-red-600" size={16} />
                            <h4 className="font-bold">Common Mistake</h4>
                          </div>
                          <p className="text-gray-700 leading-7 text-sm">{step.commonMistake}</p>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default memo(ActionEngine);
