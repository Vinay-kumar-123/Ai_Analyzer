"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import ActionEngine from "@/components/ActionEngine";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ResultPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (!id) return;

    let interval;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/dashboard/history/${id}`, {
          credentials: "include",
        });

        const json = await res.json();

        if (!json.success) return;

        setData(json.data);

        if (json.data.status === "completed" || json.data.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        setError("Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [id]);

  // ---------------- TABS ----------------
  const buildTabs = (data) => {
    const tabs = ["notes", "summary", "keypoints"];

    if (data.quickRevision?.length) tabs.push("revision");

    if (data.actionSteps?.length) tabs.push("actions");

    if (data.contentType === "tech") {
      if (data.actionEngine?.length) tabs.push("engine");
      if (data.project?.title) tabs.push("project");
    }

    if (data.learningPath?.length) tabs.push("learning");

    if (data.executionPlan?.length) tabs.push("plan");

    tabs.push("roadmap", "qa");

    return tabs;
  };

  const TABS = data ? buildTabs(data) : [];

  // ---------------- PDF ----------------
  const downloadPDF = (type = "full") => {
    if (!data) return;

    const doc = new jsPDF();
    let y = 10;

    const add = (title, content) => {
      if (!content) return;

      doc.setFontSize(14);
      doc.text(title, 10, y);
      y += 6;

      const lines = doc.splitTextToSize(content.toString(), 180);
      doc.setFontSize(11);
      doc.text(lines, 10, y);

      y += lines.length * 6 + 8;
    };

    // 🔥 SWITCH BASED DOWNLOAD
    switch (type) {
      case "summary":
        add("Summary", data.summary);
        break;

      case "notes":
        add("Notes", data.notes);
        break;

      case "roadmap":
        add("Roadmap", data.roadmap?.join("\n"));
        break;

      case "qa":
        add(
          "Questions & Answers",
          data.qa?.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n"),
        );
        break;

      case "actions":
        add("Action Steps", data.actionSteps?.join("\n"));
        break;

      case "full":
      default:
        add("Summary", data.summary);
        add("Notes", data.notes);
        add("Roadmap", data.roadmap?.join("\n"));
        break;
    }

    doc.save(`${type}-analysis.pdf`);
  };

  // ---------------- STATES ----------------
  if (loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold animate-pulse text-blue-600">
          🤖 AI is teaching your content...
        </h2>
      </div>
    );
  }

  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!data) return null;

  if (data.status === "failed") {
    return <div className="p-6 text-red-500 text-center">❌ {data.error}</div>;
  }

  // ---------------- UI ----------------
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Navbar />

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5 rounded-xl">
        <h1 className="text-2xl font-bold">AI Teacher Mode 🚀</h1>
        <p className="text-sm">
          No need to watch video again — everything explained here
        </p>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Analysis Result</h2>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-white p-5 rounded-xl shadow space-y-6">
        {/* NOTES (🔥 CORE) */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">📘 Deep Explanation</h3>
              <p className="whitespace-pre-line text-gray-700">{data.notes}</p>
            </div>

            {/* WHY */}
            {data.whyItMatters && (
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold">🔥 Why it Matters</h4>
                <ul className="list-disc ml-5">
                  {data.whyItMatters.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CONFUSION */}
            {data.confusion && (
              <div>
                <h4 className="font-semibold">🧠 Hard Concepts</h4>
                {data.confusion.map((c, i) => (
                  <div key={i} className="border p-3 rounded mb-2">
                    <p className="font-bold">{c.concept}</p>
                    <p>{c.simpleExplanation}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => downloadPDF("notes")}
              className="text-sm bg-green-500 text-white px-2 py-1 rounded"
            >
              Download
            </button>
          </div>
        )}

        {/* SUMMARY */}
        {activeTab === "summary" && (
          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-bold">⚡ Summary</h3>
            <p>{data.summary}</p>
            <button
              onClick={() => downloadPDF("summary")}
              className="text-sm bg-green-500 text-white px-2 py-1 rounded"
            >
              Download
            </button>
          </div>
        )}

        {/* REVISION */}
        {activeTab === "revision" && (
          <ul className="list-disc ml-5">
            {data.quickRevision?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {/* KEYPOINTS */}
        {activeTab === "keypoints" && (
          <ul className="list-disc ml-5">
            {data.keyPoints?.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        )}

        {/* ACTIONS */}
        {activeTab === "actions" && (
          <div>
            <ul className="list-disc ml-5">
              {data.actionSteps?.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <button
              onClick={() => downloadPDF("actions")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Download Actions
            </button>
          </div>
        )}

        {/* ENGINE */}
        {activeTab === "engine" && <ActionEngine steps={data.actionEngine} />}

        {/* PROJECT */}
        {activeTab === "project" && (
          <div>
            <h3 className="text-xl font-bold">{data.project.title}</h3>

            <ul className="list-disc ml-5">
              {data.project.features?.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ROADMAP */}
        {activeTab === "roadmap" && (
          <div>
            <ul className="list-disc ml-5">
              {data.roadmap?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <button
              onClick={() => downloadPDF("roadmap")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Download Roadmap
            </button>
          </div>
        )}

        {/* QA */}
        {activeTab === "qa" && (
          <div>
            {data.qa?.map((q, i) => (
              <details key={i} className="border p-3 rounded mb-2">
                <summary className="font-semibold">{q.question}</summary>
                <p>{q.answer}</p>
              </details>
            ))}
            <button
              onClick={() => downloadPDF("qa")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Download QA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
