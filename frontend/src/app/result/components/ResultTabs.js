"use client";

import React from "react";

/**
 * ============================================================================
 * AI Learning OS
 * Result Tabs
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Render visible tabs
 * • Active tab styling
 * • Notify parent on click
 *
 * This component NEVER:
 * - Calls APIs
 * - Generates content
 * - Contains business logic
 * - Knows about polling
 * ============================================================================
 */

export default function ResultTabs({
  tabs = [],
  activeTab,
  onTabChange,
}) {
  if (!tabs.length) return null;

  return (
    <nav
      className="mb-8 overflow-x-auto select-none no-scrollbar"
      aria-label="Workspace Navigation"
    >
      <div className="flex w-max min-w-full gap-1.5 rounded-2xl border border-white/10 bg-[#0b0f19]/30 p-1.5 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap outline-none ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {Icon && <Icon size={14} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}