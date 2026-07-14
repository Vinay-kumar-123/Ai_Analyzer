import jsPDF from "jspdf";

export const buildPDF = (data, type = "full") => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  const PW = 190;

  const addTitle = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text(text, 10, y);
    y += 12;
  };

  const addSubtitle = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(text, 10, y);
    y += 8;
  };

  const addBody = (text) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.splitTextToSize(String(text), PW).forEach((line) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 10, y);
      y += 5.5;
    });
    y += 6;
  };

  const addDivider = () => {
    doc.setDrawColor(220, 220, 220);
    doc.line(10, y, 200, y);
    y += 8;
  };

  switch (type) {
    case "notes":
      addTitle("📒 Premium Notes");
      addDivider();
      addBody((data.notes || "").replace(/[#*`_]/g, ""));
      break;
    case "summary":
      addTitle("📋 Summary");
      addDivider();
      addBody(data.summary);
      break;
    case "roadmap":
      addTitle("🗺 Roadmap");
      addDivider();
      (data.roadmap || []).forEach((item, i) => addBody(`${i + 1}. ${item}`));
      break;
    case "qa":
      addTitle("❓ Q & A");
      addDivider();
      (data.qa || []).forEach((q, i) => {
        addSubtitle(`Q${i + 1}: ${q.question}`);
        addBody(`A: ${q.answer}`);
        y += 2;
      });
      break;
    case "quiz":
      addTitle("🧠 Quiz");
      addDivider();
      (data.quiz || []).forEach((q, i) => {
        addSubtitle(`Q${i + 1} [${q.difficulty}]: ${q.question}`);
        (q.options || []).forEach((opt, oi) => addBody(`  ${String.fromCharCode(65 + oi)}. ${opt}`));
        addBody(`✓ ${q.correctAnswer}`);
        if (q.explanation) addBody(`Explanation: ${q.explanation}`);
        y += 2;
      });
      break;
    // flashcards export removed for MVP
    default:
      addTitle(`AI Analysis — ${data.videoTitle || "YouTube Video"}`);
      addDivider();
      if (data.summary) {
        addSubtitle("Summary");
        addBody(data.summary);
        addDivider();
      }
      if (data.notes) {
        addSubtitle("Notes");
        addBody((data.notes || "").replace(/[#*`_]/g, ""));
        addDivider();
      }
      if (data.keyPoints?.length) {
        addSubtitle("Key Points");
        data.keyPoints.forEach((kp) => addBody(`• ${kp}`));
        addDivider();
      }
      if (data.roadmap?.length) {
        addSubtitle("Roadmap");
        data.roadmap.forEach((r, i) => addBody(`${i + 1}. ${r}`));
        addDivider();
      }
      if (data.qa?.length) {
        addSubtitle("Q & A");
        data.qa.forEach((q) => {
          addBody(`Q: ${q.question}`);
          addBody(`A: ${q.answer}`);
          y += 2;
        });
      }
      break;
  }

  doc.save(`analysis-${type}.pdf`);
};
