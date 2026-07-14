import { motion } from "framer-motion";

export function ResultTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="sticky top-0 z-30 py-4 -mx-4 px-4 md:-mx-6 md:px-6 bg-[#080a12]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="text-base" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
