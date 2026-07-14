"use client";

import Navbar from "@/components/Navbar";

/**
 * ============================================================================
 * AI Learning OS
 * Result Layout
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • Global Result page layout
 * • Navbar
 * • Background
 * • Max Width Container
 * • Responsive spacing
 *
 * This component NEVER:
 * - Calls APIs
 * - Uses hooks
 * - Contains business logic
 * - Knows about tabs
 * ============================================================================
 */

export default function ResultLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      {/* Navigation */}
      <Navbar />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full bg-indigo-900/20 blur-[180px]" />

        <div className="absolute bottom-[-150px] right-[-150px] w-[550px] h-[550px] rounded-full bg-violet-900/20 blur-[180px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Page Container */}
      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}