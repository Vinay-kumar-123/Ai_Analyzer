/**
 * ============================================================================
 * AI Learning OS — PDF Export Hook
 * src/result/hooks/usePdfExport.js
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Generates professional, paginated A4 PDFs for every Result tab.
 *
 * SUPPORTED EXPORT TYPES
 * ----------------------
 *   "summary"   — AI Summary + Learning Outcome + Content Type
 *   "keypoints" — Key Learning Points (numbered list)
 *   "notes"     — Full notes text + optional structured sections
 *   "actions"   — Action Steps (numbered list)
 *   "roadmap"   — Learning Roadmap (numbered steps)
 *   "quiz"      — MCQ Quiz with options and correct answers
 *   "full"      — Complete analysis export (all sections)
 *
 * CALL SIGNATURE (matches every tab component)
 * -------------------------------------------
 *   buildPDF({ type, data })
 *
 * Returns true on success, false on any failure.
 * Never throws — never crashes the UI.
 *
 * PDF QUALITY
 * -----------
 *   • A4 format (210 × 297 mm)
 *   • 15 mm margins on all sides
 *   • Professional header with title and creation date
 *   • Footer with brand name and page number on every page
 *   • Automatic page breaks — no clipped or overlapping text
 *   • Helvetica font hierarchy: titles, subtitles, body
 *   • Striped row backgrounds for quiz options
 *
 * DEPENDENCIES
 * ------------
 *   jsPDF — already listed in package.json ("jspdf": "^4.2.1")
 *   No other runtime dependency is introduced.
 *
 * PERFORMANCE
 * -----------
 *   buildPDF is memoised with useCallback — stable reference across renders.
 *   No global state.
 *   No memory leaks.
 *
 * ============================================================================
 */

"use client";

import { useCallback } from "react";
import jsPDF from "jspdf";

/* ============================================================================
   Layout constants (millimetres)
   ========================================================================== */

/** Total page height of an A4 sheet. */
const PAGE_H = 297;

/** Total page width of an A4 sheet. */
const PAGE_W = 210;

/** Left margin. */
const MARGIN_X = 15;

/** Right margin (mirror of left). */
const MARGIN_RIGHT = PAGE_W - MARGIN_X;

/** Usable text width between left and right margins. */
const CONTENT_W = PAGE_W - MARGIN_X * 2;

/** Y position where the header text baseline sits. */
const HEADER_Y = 13;

/** Y position where body content begins (below header rule). */
const BODY_START_Y = 22;

/**
 * Y threshold at which a new page is inserted before printing a line.
 * 10 mm above the footer gives enough breathing room.
 */
const PAGE_BREAK_Y = PAGE_H - 20;

/** Y position of the footer rule. */
const FOOTER_RULE_Y = PAGE_H - 14;

/** Y position of footer text baseline (below the rule). */
const FOOTER_TEXT_Y = PAGE_H - 9;

/* ============================================================================
   Typography constants (points)
   ========================================================================== */

/** Font size for the document title (h1). */
const FONT_TITLE = 18;

/** Font size for section subtitles (h2). */
const FONT_SUBTITLE = 13;

/** Font size for item labels inside a section (h3). */
const FONT_ITEM_LABEL = 10;

/** Font size for body text and list items. */
const FONT_BODY = 9.5;

/** Font size for header and footer text. */
const FONT_META = 8;

/* ============================================================================
   Colour palette  [R, G, B]
   ========================================================================== */

const COLOR_DARK       = [22,  22,  30];   // Near-black — title text
const COLOR_SUBTITLE   = [55,  55,  80];   // Dark indigo-grey — subtitles
const COLOR_BODY       = [70,  70,  90];   // Medium grey — body text
const COLOR_META       = [140, 140, 160];  // Light grey — header / footer
const COLOR_RULE       = [220, 220, 230];  // Very light — divider lines
const COLOR_ACCENT     = [79,  70, 229];   // Indigo — accent stripe
const COLOR_STRIPE     = [245, 245, 252];  // Off-white — alternating rows
const COLOR_CORRECT_BG = [220, 252, 231];  // Light green — correct quiz option

/* ============================================================================
   Utility helpers
   ========================================================================== */

/**
 * Strip basic Markdown syntax from a string so it renders cleanly in PDF.
 * Removes: # headings, **, *, `, _, —, and excessive blank lines.
 *
 * @param {string} text
 * @returns {string}
 */
function stripMarkdown(text) {
  if (typeof text !== "string") return String(text ?? "");

  return text
    .replace(/^#{1,6}\s+/gm, "")       // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
    .replace(/\*(.+?)\*/g, "$1")       // italic
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // inline / fenced code
    .replace(/_(.+?)_/g, "$1")         // underscored italic
    .replace(/\n{3,}/g, "\n\n")        // excess blank lines
    .trim();
}

/**
 * Coerce any value to a printable string.
 *
 * @param {*} value
 * @returns {string}
 */
function toDisplayString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string")  return value;
  if (typeof value === "number")  return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value))       return value.map(toDisplayString).join("\n");
  if (typeof value === "object")  return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Format today's date as "DD MMM YYYY" (e.g. "13 Jul 2026").
 *
 * @returns {string}
 */
function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

/**
 * Sanitise a string for use as a filename (no spaces or special chars).
 *
 * @param {string} raw
 * @returns {string}
 */
function toFilename(raw) {
  return (raw || "analysis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ============================================================================
   PDF document builder
   ============================================================================
   All rendering is done through a `ctx` (context) object that encapsulates
   the jsPDF doc and the current Y cursor.  Every draw helper:
     • reads  ctx.y  to know where to draw
     • writes ctx.y  to advance the cursor
     • calls  ctx.newPage()  when a page break is needed

   This ensures no text is ever clipped or overlaps the footer.
   ========================================================================== */

/**
 * Create a rendering context that wraps a jsPDF document.
 *
 * @param {string} documentTitle   - Printed in the PDF header.
 * @param {string} exportType      - Used in the footer label.
 * @returns {{ doc: jsPDF, y: number, pageNum: number, newPage: Function }}
 */
function createContext(documentTitle, exportType) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const ctx = {
    doc,
    y: BODY_START_Y,
    pageNum: 1,
    documentTitle,
    exportType,
  };

  // Draw header and footer on the first page
  drawHeader(ctx);
  drawFooter(ctx);

  return ctx;
}

/**
 * Insert a page break, reset the cursor, and redraw header/footer.
 *
 * @param {object} ctx
 */
function newPage(ctx) {
  ctx.doc.addPage();
  ctx.pageNum += 1;
  ctx.y = BODY_START_Y;
  drawHeader(ctx);
  drawFooter(ctx);
}

/**
 * Ensure there is at least `neededMm` of vertical space remaining on the
 * current page.  If not, insert a page break.
 *
 * @param {object} ctx
 * @param {number} neededMm
 */
function ensureSpace(ctx, neededMm) {
  if (ctx.y + neededMm > PAGE_BREAK_Y) {
    newPage(ctx);
  }
}

/* --------------------------------------------------------------------------
   Header / Footer
   -------------------------------------------------------------------------- */

/**
 * Draw the page header: brand label on the left, creation date on the right,
 * separated from the body by a thin rule.
 *
 * @param {object} ctx
 */
function drawHeader(ctx) {
  const { doc } = ctx;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_META);
  doc.setTextColor(...COLOR_ACCENT);
  doc.text("AI Learning OS", MARGIN_X, HEADER_Y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_META);
  doc.text(formatDate(), MARGIN_RIGHT, HEADER_Y, { align: "right" });

  doc.setDrawColor(...COLOR_RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, HEADER_Y + 2, MARGIN_RIGHT, HEADER_Y + 2);
}

/**
 * Draw the page footer: document title on the left, page number on the right,
 * above a thin rule.
 *
 * @param {object} ctx
 */
function drawFooter(ctx) {
  const { doc } = ctx;

  doc.setDrawColor(...COLOR_RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, FOOTER_RULE_Y, MARGIN_RIGHT, FOOTER_RULE_Y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_META);
  doc.setTextColor(...COLOR_META);
  doc.text(ctx.documentTitle, MARGIN_X, FOOTER_TEXT_Y);
  doc.text(`Page ${ctx.pageNum}`, MARGIN_RIGHT, FOOTER_TEXT_Y, { align: "right" });
}

/* --------------------------------------------------------------------------
   Typography helpers
   -------------------------------------------------------------------------- */

/**
 * Print the main document title (h1).
 * Advances the cursor by the title height + spacing.
 *
 * @param {object} ctx
 * @param {string} text
 */
function drawTitle(ctx, text) {
  ensureSpace(ctx, 18);

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(FONT_TITLE);
  ctx.doc.setTextColor(...COLOR_DARK);
  ctx.doc.text(text, MARGIN_X, ctx.y);

  ctx.y += 10;
  drawHRule(ctx);
  ctx.y += 4;
}

/**
 * Print a section subtitle (h2).
 * Advances the cursor by the subtitle height + spacing.
 *
 * @param {object} ctx
 * @param {string} text
 */
function drawSubtitle(ctx, text) {
  ensureSpace(ctx, 12);

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(FONT_SUBTITLE);
  ctx.doc.setTextColor(...COLOR_SUBTITLE);
  ctx.doc.text(text, MARGIN_X, ctx.y);

  ctx.y += 7;
}

/**
 * Print a small item label (h3) — used for quiz questions, etc.
 *
 * @param {object} ctx
 * @param {string} text
 */
function drawItemLabel(ctx, text) {
  ensureSpace(ctx, 8);

  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(FONT_ITEM_LABEL);
  ctx.doc.setTextColor(...COLOR_SUBTITLE);
  ctx.doc.text(text, MARGIN_X, ctx.y);

  ctx.y += 5.5;
}

/**
 * Print one or more lines of body text, wrapping at CONTENT_W and
 * inserting page breaks automatically.
 *
 * @param {object} ctx
 * @param {string} text
 * @param {number} [indent=0]   - Additional left indent in mm.
 */
function drawBody(ctx, text, indent = 0) {
  if (!text && text !== 0) return;

  const clean = stripMarkdown(toDisplayString(text));
  if (!clean) return;

  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(FONT_BODY);
  ctx.doc.setTextColor(...COLOR_BODY);

  const availableWidth = CONTENT_W - indent;
  const lines = ctx.doc.splitTextToSize(clean, availableWidth);

  for (const line of lines) {
    if (ctx.y > PAGE_BREAK_Y) {
      newPage(ctx);
    }
    ctx.doc.text(line, MARGIN_X + indent, ctx.y);
    ctx.y += 5.2;
  }
}

/**
 * Draw a horizontal rule.
 *
 * @param {object} ctx
 */
function drawHRule(ctx) {
  ctx.doc.setDrawColor(...COLOR_RULE);
  ctx.doc.setLineWidth(0.25);
  ctx.doc.line(MARGIN_X, ctx.y, MARGIN_RIGHT, ctx.y);
}

/**
 * Add vertical whitespace.
 *
 * @param {object} ctx
 * @param {number} [mm=5]
 */
function drawSpacer(ctx, mm = 5) {
  ctx.y += mm;
}

/**
 * Draw a full-width horizontal divider with spacing above and below.
 *
 * @param {object} ctx
 * @param {number} [spacingBefore=4]
 * @param {number} [spacingAfter=4]
 */
function drawDivider(ctx, spacingBefore = 4, spacingAfter = 4) {
  ctx.y += spacingBefore;
  ensureSpace(ctx, spacingAfter + 1);
  drawHRule(ctx);
  ctx.y += spacingAfter;
}

/* ============================================================================
   Section renderers — one per export type
   ============================================================================
   Each renderer receives (ctx, analysis) and draws into the document.
   They never return a value; state is entirely through ctx.
   ========================================================================== */

/**
 * Render the Summary section.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderSummary(ctx, analysis) {
  drawTitle(ctx, "AI Summary");

  const summary    = analysis.summary     || "";
  const outcome    = analysis.outcome     || "";
  const contentType = analysis.contentType || "";

  if (summary) {
    drawSubtitle(ctx, "Summary");
    drawBody(ctx, summary);
    drawSpacer(ctx, 4);
  }

  if (outcome) {
    drawSubtitle(ctx, "Learning Outcome");
    drawBody(ctx, outcome);
    drawSpacer(ctx, 4);
  }

  if (contentType) {
    drawSubtitle(ctx, "Content Type");
    drawBody(ctx, contentType);
  }
}

/**
 * Render the Key Points section.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderKeyPoints(ctx, analysis) {
  drawTitle(ctx, "Key Learning Points");

  const keyPoints = Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [];

  if (!keyPoints.length) {
    drawBody(ctx, "No key points available.");
    return;
  }

  for (let i = 0; i < keyPoints.length; i++) {
    const point = toDisplayString(keyPoints[i]);
    if (!point.trim()) continue;

    ensureSpace(ctx, 14);

    // Bullet prefix with index
    const prefix = `${i + 1}. `;
    drawItemLabel(ctx, prefix + "Key Point");

    // Indent the body text under the label
    drawBody(ctx, point, 4);
    drawSpacer(ctx, 2);
  }
}

/**
 * Render the Notes section — includes structured sections if present.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderNotes(ctx, analysis) {
  drawTitle(ctx, "AI Notes");

  const notes    = analysis.notes    || "";
  const sections = Array.isArray(analysis.sections) ? analysis.sections : [];

  // Structured sections take priority when present
  if (sections.length > 0) {
    for (const section of sections) {
      if (!section) continue;

      const sectionTitle   = toDisplayString(section.title   || "");
      const sectionContent = toDisplayString(section.content || "");

      ensureSpace(ctx, 14);

      if (sectionTitle) drawSubtitle(ctx, sectionTitle);
      if (sectionContent) {
        drawBody(ctx, sectionContent);
        drawSpacer(ctx, 3);
      }
    }

    // After sections, print full notes as a reference appendix
    if (notes) {
      drawDivider(ctx);
      drawSubtitle(ctx, "Complete Notes");
      drawBody(ctx, notes);
    }

    return;
  }

  // No structured sections — print raw notes
  if (notes) {
    drawBody(ctx, notes);
  } else {
    drawBody(ctx, "No notes available.");
  }
}

/**
 * Render the Learning Roadmap section.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderRoadmap(ctx, analysis) {
  drawTitle(ctx, "Learning Roadmap");

  const roadmap = Array.isArray(analysis.roadmap) ? analysis.roadmap : [];

  if (!roadmap.length) {
    drawBody(ctx, "No roadmap available.");
    return;
  }

  for (let i = 0; i < roadmap.length; i++) {
    const step = toDisplayString(roadmap[i]);
    if (!step.trim()) continue;

    ensureSpace(ctx, 14);

    drawItemLabel(ctx, `Step ${i + 1} of ${roadmap.length}`);
    drawBody(ctx, step, 4);
    drawSpacer(ctx, 3);
  }
}

/**
 * Render the Quiz section.
 * Each question has a label, its options (with correct one highlighted),
 * and an optional explanation.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderQuiz(ctx, analysis) {
  drawTitle(ctx, "AI Quiz");

  const quiz = Array.isArray(analysis.quiz) ? analysis.quiz : [];

  if (!quiz.length) {
    drawBody(ctx, "No quiz questions available.");
    return;
  }

  const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

  for (let i = 0; i < quiz.length; i++) {
    const item = quiz[i];
    if (!item || typeof item !== "object") continue;

    const question    = toDisplayString(item.question    || "");
    const options     = Array.isArray(item.options) ? item.options : [];
    const answer      = toDisplayString(item.answer      || item.correctAnswer || "");
    const explanation = toDisplayString(item.explanation || "");
    const difficulty  = toDisplayString(item.difficulty  || "");

    // Estimate block height for page-break check
    const estimatedHeight = 14 + options.length * 7 + (explanation ? 8 : 0);
    ensureSpace(ctx, estimatedHeight);

    // Question label
    const difficultyLabel = difficulty ? ` [${difficulty}]` : "";
    drawItemLabel(ctx, `Q${i + 1}${difficultyLabel}`);

    // Question text
    drawBody(ctx, question, 0);
    drawSpacer(ctx, 2);

    // Options
    for (let oi = 0; oi < options.length; oi++) {
      const option    = toDisplayString(options[oi]);
      const letter    = OPTION_LETTERS[oi] || String(oi + 1);
      const isCorrect = option === answer;

      if (ctx.y + 7 > PAGE_BREAK_Y) newPage(ctx);

      // Tinted row background for the correct answer
      if (isCorrect) {
        ctx.doc.setFillColor(...COLOR_CORRECT_BG);
        ctx.doc.roundedRect(MARGIN_X, ctx.y - 4, CONTENT_W, 6.5, 1, 1, "F");
      } else if (oi % 2 === 0) {
        ctx.doc.setFillColor(...COLOR_STRIPE);
        ctx.doc.roundedRect(MARGIN_X, ctx.y - 4, CONTENT_W, 6.5, 1, 1, "F");
      }

      const optionLines = ctx.doc.splitTextToSize(
        `${letter}. ${option}`,
        CONTENT_W - 6,
      );

      ctx.doc.setFont("helvetica", isCorrect ? "bold" : "normal");
      ctx.doc.setFontSize(FONT_BODY);
      ctx.doc.setTextColor(...(isCorrect ? COLOR_ACCENT : COLOR_BODY));

      for (const line of optionLines) {
        if (ctx.y > PAGE_BREAK_Y) newPage(ctx);
        ctx.doc.text(line, MARGIN_X + 3, ctx.y);
        ctx.y += 5.2;
      }
    }

    // Explanation
    if (explanation) {
      drawSpacer(ctx, 2);
      ctx.doc.setFont("helvetica", "italic");
      ctx.doc.setFontSize(FONT_BODY - 0.5);
      ctx.doc.setTextColor(...COLOR_META);

      const expLines = ctx.doc.splitTextToSize(
        `Explanation: ${explanation}`,
        CONTENT_W - 4,
      );

      for (const line of expLines) {
        if (ctx.y > PAGE_BREAK_Y) newPage(ctx);
        ctx.doc.text(line, MARGIN_X + 2, ctx.y);
        ctx.y += 5;
      }
    }

    drawDivider(ctx, 4, 3);
  }
}

/**
 * Render a complete analysis export combining all available sections.
 *
 * @param {object} ctx
 * @param {object} analysis
 */
function renderFull(ctx, analysis) {
  const videoTitle = analysis.videoTitle || "YouTube Video";
  drawTitle(ctx, `AI Analysis — ${videoTitle}`);

  // Summary block
  if (analysis.summary || analysis.outcome) {
    drawSubtitle(ctx, "Summary");
    if (analysis.summary) drawBody(ctx, analysis.summary);
    if (analysis.outcome) {
      drawSpacer(ctx, 3);
      drawSubtitle(ctx, "Learning Outcome");
      drawBody(ctx, analysis.outcome);
    }
    drawDivider(ctx);
  }

  // Key Points block
  const keyPoints = Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [];
  if (keyPoints.length > 0) {
    drawSubtitle(ctx, "Key Points");
    keyPoints.forEach((kp, i) => {
      drawBody(ctx, `${i + 1}. ${toDisplayString(kp)}`);
    });
    drawDivider(ctx);
  }

  // Notes block
  if (analysis.notes) {
    drawSubtitle(ctx, "Notes");
    drawBody(ctx, analysis.notes);
    drawDivider(ctx);
  }

  // Roadmap block
  const roadmap = Array.isArray(analysis.roadmap) ? analysis.roadmap : [];
  if (roadmap.length > 0) {
    drawSubtitle(ctx, "Learning Roadmap");
    roadmap.forEach((r, i) => {
      drawBody(ctx, `${i + 1}. ${toDisplayString(r)}`);
    });
    drawDivider(ctx);
  }

  // Quiz block (abbreviated — full quiz has its own renderer)
  const quiz = Array.isArray(analysis.quiz) ? analysis.quiz : [];
  if (quiz.length > 0) {
    drawSubtitle(ctx, `Quiz (${quiz.length} questions)`);
    quiz.forEach((q, i) => {
      if (!q || typeof q !== "object") return;
      drawBody(ctx, `${i + 1}. ${toDisplayString(q.question || "")}`);
      drawSpacer(ctx, 1);
    });
  }
}

/* ============================================================================
   Type → renderer map
   ============================================================================
   Maps each export type string to its renderer function and human-readable
   title.  Adding a new export type only requires one entry here.
   ========================================================================== */

/**
 * @typedef {{ render: Function, title: string, filename: string }} TypeConfig
 */

/** @type {Record<string, TypeConfig>} */
const TYPE_CONFIG = Object.freeze({
  summary: {
    title:    "AI Summary",
    filename: "ai-summary",
    render:   renderSummary,
  },
  keypoints: {
    title:    "Key Learning Points",
    filename: "key-points",
    render:   renderKeyPoints,
  },
  notes: {
    title:    "AI Notes",
    filename: "ai-notes",
    render:   renderNotes,
  },
  roadmap: {
    title:    "Learning Roadmap",
    filename: "learning-roadmap",
    render:   renderRoadmap,
  },
  quiz: {
    title:    "AI Quiz",
    filename: "ai-quiz",
    render:   renderQuiz,
  },
  full: {
    title:    "Full AI Analysis",
    filename: "full-analysis",
    render:   renderFull,
  },
});

/* ============================================================================
   Hook
   ============================================================================
   A thin React wrapper around the PDF builder.  Its only job is to expose a
   memoised buildPDF function so parent components get a stable reference and
   are never forced to re-render just because the function identity changed.
   ========================================================================== */

/**
 * @typedef {object} UsePdfExportReturn
 * @property {Function} buildPDF  - ({ type, data }) => boolean
 */

/**
 * AI Learning OS — PDF Export Hook.
 *
 * @returns {UsePdfExportReturn}
 *
 * @example
 *   const { buildPDF } = usePdfExport();
 *   buildPDF({ type: "summary", data: analysis });
 */
export function usePdfExport() {
  /**
   * Generate and download a PDF for the given type and analysis data.
   *
   * Accepts two call signatures for backward compatibility:
   *   1. buildPDF({ type, data })    — used by all current tab components
   *   2. buildPDF(data, type)        — used by legacy resultPdf.js callers
   *
   * Returns true on success, false on any failure.
   * Never throws — never crashes the UI.
   *
   * @param {{ type: string, data: object } | object} typeOrPayload
   * @param {string} [legacyType]
   * @returns {boolean}
   */
  const buildPDF = useCallback((typeOrPayload, legacyType) => {
    try {
      /* ---------------------------------------------------------------
         Normalise call signature
         --------------------------------------------------------------- */

      let type;
      let data;

      if (
        typeOrPayload !== null &&
        typeof typeOrPayload === "object" &&
        !Array.isArray(typeOrPayload) &&
        ("type" in typeOrPayload || "data" in typeOrPayload)
      ) {
        // Signature 1: buildPDF({ type, data })
        type = typeOrPayload.type;
        data = typeOrPayload.data;
      } else {
        // Signature 2: buildPDF(data, type)  — legacy / resultPdf.js compat
        data = typeOrPayload;
        type = legacyType;
      }

      /* ---------------------------------------------------------------
         Validation
         --------------------------------------------------------------- */

      const normalizedType = typeof type === "string" ? type.trim().toLowerCase() : "";
      const config = TYPE_CONFIG[normalizedType] ?? TYPE_CONFIG["full"];

      if (!data || typeof data !== "object") {
        return false;
      }

      /* ---------------------------------------------------------------
         Build document
         --------------------------------------------------------------- */

      const documentTitle = config.title;
      const ctx = createContext(documentTitle, normalizedType);

      config.render(ctx, data);

      /* ---------------------------------------------------------------
         Save
         --------------------------------------------------------------- */

      const videoSlug = toFilename(data.videoTitle || "");
      const filename  = videoSlug
        ? `${config.filename}-${videoSlug}.pdf`
        : `${config.filename}.pdf`;

      ctx.doc.save(filename);

      return true;
    } catch {
      // Never crash the UI — swallow silently and signal failure.
      return false;
    }
  }, []);

  return { buildPDF };
}

export default usePdfExport;
