"use client";

import { FiCheck, FiCopy } from "react-icons/fi";

export const Section = ({ title, icon: Icon, children, action }) => (
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

export const Badge = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
    {children}
  </span>
);

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

export const CopyBtn = ({ text, id, copied, copy }) => (
  <button
    onClick={() => copy(text, id)}
    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
  >
    {copied === id ? <FiCheck className="text-green-400" /> : <FiCopy />}
    {copied === id ? "Copied" : "Copy"}
  </button>
);
