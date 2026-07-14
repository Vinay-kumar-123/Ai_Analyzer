import { chunkTranscript } from "./shared/chunk.processor.js";
import { buildMemory } from "./shared/memory.builder.js";
import { processInBatches } from "./shared/batch.processor.js";

import { generateChunk } from "./chunk.generator.js";
import { generateSynthesis } from "./synthesis.generator.js";

const DEFAULT_CONCURRENCY = 2;

export async function generateNotes({
  transcript,
  goal = "student",
  language = "english",
}) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  /*
   * STEP 1
   * Smart Chunking
   */

  const chunks = chunkTranscript(transcript);

  /*
   * STEP 2
   * Parallel Chunk Processing
   */

  const chunkResults = await processInBatches(
    chunks,
    (chunk) =>
      generateChunk({
        chunk: chunk.text,
        goal,
        language,
        chunkIndex: chunk.index,
        totalChunks: chunk.total,
      }),
    {
      concurrency: DEFAULT_CONCURRENCY,

      continueOnError: false,
    },
  );

  /*
   * STEP 3
   * Unified Memory
   */

  const memory = buildMemory(chunkResults);

  /*
   * STEP 4
   * Premium Synthesis
   */

  const synthesis = await generateSynthesis({
    memory,
    goal,
    language,
  });

  return {
    notes: synthesis.notes,

    sections: synthesis.sections,

    meta: {
      chunks: chunks.length,

      processedChunks: chunkResults.length,

      concepts: memory.concepts.length,

      keyPoints: memory.keyPoints.length,

      formulas: memory.formulas.length,

      examples: memory.examples.length,

      interviewInsights:
        memory.interviewInsights.length,
    },
  };
}

export default generateNotes;