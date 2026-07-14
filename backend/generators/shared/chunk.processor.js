/**
 * ============================================================================
 * AI Learning OS
 * Chunk Processor
 * ----------------------------------------------------------------------------
 * Responsibility:
 * - Smart transcript chunking
 * - Sentence-aware splitting
 * - Configurable overlap
 * - Chunk metadata
 * - Prevent token overflow
 * ============================================================================
 */

const DEFAULT_OPTIONS = Object.freeze({
  chunkSize: 6000,
  overlap: 500,
  maxChunks: 50,
  minChunkLength: 100,
});

/**
 * Finds a natural sentence boundary near the target position.
 */
function findBoundary(text, targetIndex) {
  const start = Math.max(0, targetIndex - 300);
  const end = Math.min(text.length, targetIndex + 300);

  const window = text.slice(start, end);

  const regex = /[.!?]\s+/g;

  let match;
  let boundary = -1;

  while ((match = regex.exec(window)) !== null) {
    boundary = start + match.index + match[0].length;
  }

  if (boundary === -1) {
    return targetIndex;
  }

  return boundary;
}

/**
 * Creates transcript chunks.
 */
export function chunkTranscript(transcript, options = {}) {
  if (!transcript || typeof transcript !== "string") {
    throw new Error("Transcript is required.");
  }

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (transcript.length <= config.chunkSize) {
    return [
      {
        index: 0,
        total: 1,
        start: 0,
        end: transcript.length,
        text: transcript.trim(),
      },
    ];
  }

  const chunks = [];

  let position = 0;

  while (position < transcript.length && chunks.length < config.maxChunks) {
    const targetEnd = Math.min(position + config.chunkSize, transcript.length);

    const splitPoint =
      targetEnd >= transcript.length
        ? transcript.length
        : findBoundary(transcript, targetEnd);

    const chunkText = transcript.slice(position, splitPoint).trim();

    if (chunkText.length >= config.minChunkLength) {
      chunks.push({
        index: chunks.length,
        total: 0,
        start: position,
        end: splitPoint,
        text: chunkText,
      });
    }

    position =
      splitPoint >= transcript.length
        ? splitPoint
        : Math.max(0, splitPoint - config.overlap);
  }

  const total = chunks.length;

  return chunks.map((chunk) => ({
    ...chunk,
    total,
  }));
}

/**
 * Returns transcript statistics.
 */
export function getChunkStatistics(chunks = []) {
  const sizes = chunks.map((c) => c.text.length);

  return {
    totalChunks: chunks.length,

    totalCharacters: sizes.reduce((a, b) => a + b, 0),

    averageChunkSize:
      sizes.length === 0
        ? 0
        : Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),

    largestChunk: sizes.length === 0 ? 0 : Math.max(...sizes),

    smallestChunk: sizes.length === 0 ? 0 : Math.min(...sizes),
  };
}

export default chunkTranscript;
