"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";

export default function ActionEngine({ steps = [] }) {
  const [completed, setCompleted] = useState([]);

  const toggleStep = (index) => {
    setCompleted((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const progress = Math.round(
    (completed.length / steps.length) * 100
  );

  return (
    <div className="space-y-4">

      {/* 🔥 Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 🔥 Steps */}
      {steps.map((step, i) => (
        <div
          key={i}
          className={`border p-4 rounded-xl ${
            completed.includes(i)
              ? "bg-green-50 border-green-400"
              : "bg-white"
          }`}
        >
          {/* Title */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Step {i + 1}: {step.title}
            </h3>

            <button onClick={() => toggleStep(i)}>
              <CheckCircle
                className={
                  completed.includes(i)
                    ? "text-green-600"
                    : "text-gray-400"
                }
              />
            </button>
          </div>

          {/* Command */}
          {step.command && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">
                Command:
              </p>

              <div className="flex justify-between items-center bg-black text-green-400 p-2 rounded">
                <code>{step.command}</code>

                <button onClick={() => copy(step.command)}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Code */}
          {step.code && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">
                Code:
              </p>

              <div className="relative">
                <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto">
                  {step.code}
                </pre>

                <button
                  onClick={() => copy(step.code)}
                  className="absolute top-2 right-2"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}