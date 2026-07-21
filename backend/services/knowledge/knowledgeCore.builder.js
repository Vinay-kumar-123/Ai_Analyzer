/**
 * ============================================================================
 * AI Learning OS
 * Knowledge Core Builder (Hybrid Extraction & In-Memory Fallback)
 * ----------------------------------------------------------------------------
 * Responsibility:
 * 1. Hybrid Extraction: Merges AI semantic extraction with deterministic
 *    pure JS extraction (commands, code blocks, URLs).
 * 2. In-Memory Fallbacks: Constructs an in-memory Knowledge Core for older
 *    analyses without persisting back to MongoDB.
 * ============================================================================
 */

/**
 * Deterministically extracts CLI commands and code snippets from text.
 * Runs zero AI tokens.
 *
 * @param {string} text
 * @returns {Array<string>} List of unique commands / code lines
 */
export function extractCommandsDetermistic(text) {
  if (!text || typeof text !== "string") return [];

  const commands = new Set();

  // Match fenced code blocks (```bash ... ``` or ```sh ... ``` or ```shell ... ```)
  const codeBlockRegex = /```(?:bash|sh|shell|zsh|console|cmd|powershell)?\s*\n([\s\S]*?)\n```/gi;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//")) {
        commands.add(trimmed);
      }
    }
  }

  // Match lines starting with $ or npm/yarn/pnpm/pip/git/docker
  const cmdLineRegex = /^\s*(?:\$\s*|)(npm|yarn|pnpm|npx|git|docker|pip|python|cargo|go|brew|apt|kubectl)\s+.*$/gm;
  while ((match = cmdLineRegex.exec(text)) !== null) {
    commands.add(match[0].trim().replace(/^\$\s*/, ""));
  }

  return Array.from(commands).slice(0, 30);
}

/**
 * Deterministically extracts URLs and web references from text.
 *
 * @param {string} text
 * @returns {Array<string>} Unique list of URLs
 */
export function extractReferencesDeterministic(text) {
  if (!text || typeof text !== "string") return [];

  const urlRegex = /https?:\/\/[^\s<>"')]+/gi;
  const urls = text.match(urlRegex) || [];
  return Array.from(new Set(urls)).slice(0, 20);
}

/**
 * Builds a complete Knowledge Core payload combining AI semantic extraction,
 * deterministic extraction, and source metadata.
 *
 * @param {Object} aiExtracted    - Raw JSON from AI synthesis call
 * @param {Object} sourceMeta     - Source metadata (videoId, videoTitle, language, duration)
 * @param {string} rawTextContext - Text content for deterministic extraction
 * @returns {Object} Normalized Knowledge Core object
 */
export function assembleKnowledgeCore(aiExtracted = {}, sourceMeta = {}, rawTextContext = "") {
  const deterministicCommands = extractCommandsDetermistic(rawTextContext);
  const deterministicRefs     = extractReferencesDeterministic(rawTextContext);

  const aiCommands = Array.isArray(aiExtracted.commands) ? aiExtracted.commands : [];
  const aiRefs     = Array.isArray(aiExtracted.references) ? aiExtracted.references : [];

  const mergedCommands = Array.from(new Set([...aiCommands, ...deterministicCommands]));
  const mergedRefs     = Array.from(new Set([...aiRefs, ...deterministicRefs]));

  return {
    metadata: {
      schemaVersion:  "v1",
      aiVersion:      "v5",
      promptVersion:  "v1",
      generatedAt:    new Date(),
      domain:         aiExtracted.metadata?.domain || "general",
      level:          ["beginner", "intermediate", "advanced"].includes(aiExtracted.metadata?.level)
                        ? aiExtracted.metadata.level
                        : "beginner",
      sourceType:     "youtube",
      sourceLanguage: sourceMeta.language || "english",
      videoDuration:  sourceMeta.duration || 0,
      videoId:        sourceMeta.videoId  || "",
      videoTitle:     sourceMeta.videoTitle || "",
    },

    topics:            aiExtracted.topics            || [],
    concepts:          aiExtracted.concepts          || [],
    definitions:       aiExtracted.definitions       || [],
    comparisons:       aiExtracted.comparisons       || [],
    prerequisites:     aiExtracted.prerequisites     || [],
    commands:          mergedCommands,
    formulas:          aiExtracted.formulas          || [],
    glossary:          aiExtracted.glossary          || [],
    relationships:     aiExtracted.relationships     || [],
    realWorldExamples: aiExtracted.realWorldExamples || [],
    bestPractices:     aiExtracted.bestPractices     || [],
    commonMistakes:    aiExtracted.commonMistakes    || [],
    revisionPoints:    aiExtracted.revisionPoints    || [],
    interviewInsights: aiExtracted.interviewInsights || [],
    timeline:          aiExtracted.timeline          || [],
    references:        mergedRefs,
  };
}

/**
 * Builds an IN-MEMORY ONLY Knowledge Core fallback for older analyses.
 * CRITICAL GUARANTEE: Never writes to MongoDB.
 *
 * @param {Object} analysis - Analysis MongoDB document
 * @returns {Object} Knowledge Core object constructed in memory
 */
export function buildKnowledgeCoreFallback(analysis) {
  if (!analysis) return null;

  const sections = Array.isArray(analysis.sections) ? analysis.sections : [];
  const notes    = analysis.notes || "";
  const summary  = analysis.summary || "";

  const topics = sections.map((s, i) => ({
    id:   `topic-${i + 1}`,
    name: s.title || `Topic ${i + 1}`,
  }));

  const concepts = sections.map((s, i) => ({
    id:          `concept-${i + 1}`,
    name:        s.title || `Concept ${i + 1}`,
    explanation: s.content ? s.content.slice(0, 300) : "",
    importance:  s.importance || "medium",
    confidence:  1.0,
  }));

  const textToParse = notes + "\n" + sections.map((s) => s.content).join("\n") + "\n" + summary;
  const commands   = extractCommandsDetermistic(textToParse);
  const references = extractReferencesDeterministic(textToParse);

  return {
    metadata: {
      schemaVersion:  "v1-fallback",
      aiVersion:      "v5",
      promptVersion:  "fallback",
      generatedAt:    new Date(),
      domain:         "general",
      level:          "beginner",
      sourceType:     "youtube",
      sourceLanguage: analysis.language || "english",
      videoDuration:  analysis.duration || 0,
      videoId:        analysis.youtubeUrl ? (analysis.youtubeUrl.split("v=")[1] || "") : "",
      videoTitle:     analysis.videoTitle || "",
    },

    topics,
    concepts,
    definitions:       [],
    comparisons:       [],
    prerequisites:     [],
    commands,
    formulas:          [],
    glossary:          [],
    relationships:     [],
    realWorldExamples: [],
    bestPractices:     [],
    commonMistakes:    [],
    revisionPoints:    analysis.keyPoints || [],
    interviewInsights: [],
    timeline:          [],
    references,
  };
}

export default {
  extractCommandsDetermistic,
  extractReferencesDeterministic,
  assembleKnowledgeCore,
  buildKnowledgeCoreFallback,
};
