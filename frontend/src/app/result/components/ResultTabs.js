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
      className="mb-8 overflow-x-auto"
      aria-label="Result Navigation"
    >
      <div className="flex w-max min-w-full gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">

        {tabs.map((tab) => {
          const Icon = tab.icon;

          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {Icon && <Icon size={18} />}

              <span>{tab.label}</span>
            </button>
          );
        })}

      </div>
    </nav>
  );
}