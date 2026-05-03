"use client";

import Link from "next/link";
import {
  Clock,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";

export default function AnalysisHistory({ analyses = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Clock className="text-blue-600" size={22} />

        <div>
          <h2 className="text-xl font-semibold">
            Analysis History
          </h2>

          <p className="text-sm text-gray-500">
            Your recently analyzed YouTube videos
          </p>
        </div>
      </div>

      {/* Empty State */}
      {analyses.length === 0 ? (
        <div className="text-center py-10">
          <FileText
            className="mx-auto text-gray-400 mb-4"
            size={42}
          />

          <h3 className="text-lg font-medium text-gray-700">
            No analyses found
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Start analyzing YouTube videos to see history here
          </p>

          <Link
            href="/analyze"
            className="inline-block mt-5 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Analyze Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((item) => (
            <div
              key={item._id}
              className="border rounded-xl p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                {/* LEFT */}
                <div className="flex items-start gap-3">
                  <FaYoutube
                    className="text-red-500 mt-1"
                    size={22}
                  />

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.videoTitle || "Untitled Video"}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Language:{" "}
                      <span className="font-medium">
                        {item.language || "English"}
                      </span>
                    </p>

                    <p className="text-sm text-gray-500">
                      Date:{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>

                    {/* 🔥 STATUS */}
                    <div className="mt-1 text-sm">
                      {item.status === "processing" && (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <Loader2 className="animate-spin" size={14} />
                          Processing...
                        </span>
                      )}

                      {item.status === "completed" && (
                        <span className="text-green-600">
                          Completed
                        </span>
                      )}

                      {item.status === "failed" && (
                        <span className="text-red-600">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-2">
                  {/* 🔥 MAIN BUTTON (FIXED) */}
                  <Link
                    href={`/result/${item._id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Analysis
                  </Link>

                  {/* OPTIONAL YouTube link */}
                  {item.youtubeUrl && (
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:underline"
                    >
                      YouTube
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* SUMMARY */}
              {item.summary && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {item.summary}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}