"use client";

import Link from "next/link";

export default function LowCreditModal({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[300px] text-center">
        <h2 className="text-lg font-bold mb-2">⚠️ Low Credits</h2>

        <p className="text-sm text-gray-600">
          You don’t have enough credits to analyze this video.
        </p>

        <Link href="/buy-credits">
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            Buy Credits
          </button>
        </Link>
      </div>
    </div>
  );
}