"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import ActionEngine from "@/components/ActionEngine";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ResultPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------- REALTIME POLLING ----------------
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

        const analysis = json.data;

        setData(analysis);

        if (analysis.status === "completed" || analysis.status === "failed") {
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [id]);

  // ---------------- DYNAMIC TABS ----------------
  const buildTabs = (data) => {
    const tabs = ["summary", "keypoints", "notes"];

    // ✅ Always
    if (data.actionSteps?.length) tabs.push("actions");

    // ✅ TECH ONLY
    if (data.contentType === "tech") {
      if (data.actionEngine?.length) tabs.push("engine");
      if (data.project?.title) tabs.push("project");
    }

    // ✅ ACADEMIC / EXAM
    if (data.contentType === "academic" || data.contentType === "exam") {
      if (data.learningPath?.length) tabs.push("learning");
    }

    // ✅ Execution plan (any type)
    if (data.executionPlan?.length) tabs.push("plan");

    // ✅ Always last
    tabs.push("roadmap");
    tabs.push("qa");

    return tabs;
  };

  const TABS = data ? buildTabs(data) : [];
  useEffect(() => {
    if (data) {
      const tabs = buildTabs(data);

      if (!tabs.includes(activeTab)) {
        setActiveTab(tabs[0]); // 🔥 auto fix
      }
    }
  }, [data]);

  // ---------------- PDF ----------------
  const downloadPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    let y = 10;

    const add = (title, content) => {
      if (!content) return;

      doc.setFontSize(12);
      doc.text(title, 10, y);
      y += 6;

      const lines = doc.splitTextToSize(content.toString(), 180);
      doc.text(lines, 10, y);

      y += lines.length * 6 + 6;
    };

    add("Summary", data.summary);
    add("Notes", data.notes);
    add("Outcome", data.outcome);
    add("Action Steps", data.actionSteps?.join("\n"));
    add("Roadmap", data.roadmap?.join("\n"));

    doc.save("analysis.pdf");
  };

  // ---------------- UI STATES ----------------

  if (loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold animate-pulse">
          AI is analyzing your content...
        </h2>
        <p className="text-gray-500 mt-2">This may take a few seconds ⏳</p>
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  if (!data) return null;

  if (data.status === "failed") {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ Analysis failed: {data.error}
      </div>
    );
  }

  if (data.status !== "completed") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Processing...</h2>
        <p className="text-gray-500 mt-2">
          Please wait while AI generates results...
        </p>
      </div>
    );
  }

  // ---------------- UI ----------------

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analysis Result</h1>

        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download PDF
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded capitalize whitespace-nowrap ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {tab === "keypoints"
              ? "Key Points"
              : tab === "actions"
                ? "Action Steps"
                : tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-white p-5 rounded-xl shadow space-y-4">
        {activeTab === "summary" && <p>{data.summary}</p>}

        {activeTab === "notes" && (
          <p className="whitespace-pre-line">{data.notes}</p>
        )}

        {activeTab === "keypoints" &&
          (data.keyPoints?.length ? (
            <ul className="list-disc ml-5 space-y-1">
              {data.keyPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No key points available</p>
          ))}

        {activeTab === "actions" && (
          <ul className="list-disc ml-5">
            {data.actionSteps?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}

        {activeTab === "engine" &&
          (data.contentType || "general") === "tech" && (
            <ActionEngine steps={data.actionEngine} />
          )}

        {activeTab === "learning" && (
          <ul className="list-disc ml-5">
            {data.learningPath?.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}

        {activeTab === "project" &&
          (data.contentType || "general") === "tech" && (
            <div>
              <h2 className="text-xl font-bold">{data.project.title}</h2>

              <p className="font-semibold mt-2">Features:</p>
              <ul className="list-disc ml-5">
                {data.project.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p className="font-semibold mt-3">Tech Stack:</p>
              <ul className="list-disc ml-5">
                {data.project.techStack?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

        {activeTab === "plan" && (
          <div>
            {data.executionPlan.map((p) => (
              <div>
                <strong>{p.day}</strong>
                <p>{p.task}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "roadmap" && (
          <ul className="list-disc ml-5">
            {data.roadmap?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        {activeTab === "qa" && (
          <div className="space-y-3">
            {data.qa?.map((q, i) => (
              <div key={i}>
                <p className="font-semibold">Q: {q.question}</p>
                <p>A: {q.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
