/**
 * ============================================================================
 * AI Learning OS
 * Progress Tracker
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Centralized progress tracking for all AI generators.
 *
 * Supported Features:
 * - Progress percentage
 * - Current stage
 * - Status message
 * - Event callback
 * - Timing
 * - Metadata
 *
 * Future Compatible:
 * - Polling
 * - WebSocket
 * - Server Sent Events (SSE)
 * - Queue Workers
 * - Analytics
 * ============================================================================
 */

const DEFAULT_STAGES = Object.freeze({
  STARTED: "started",

  TRANSCRIPT: "transcript",

  CHUNKING: "chunking",

  CHUNK_ANALYSIS: "chunk_analysis",

  MEMORY_BUILDING: "memory_building",

  SYNTHESIS: "synthesis",

  QUIZ: "quiz",

  FLASHCARDS: "flashcards",

  ROADMAP: "roadmap",

  PROJECT: "project",

  COMPLETED: "completed",

  FAILED: "failed",
});

export class ProgressTracker {
  constructor(onProgress = null) {
    this.startedAt = Date.now();

    this.onProgress =
      typeof onProgress === "function"
        ? onProgress
        : null;

    this.state = {
      progress: 0,

      stage: DEFAULT_STAGES.STARTED,

      message: "Starting...",

      meta: {},

      elapsed: 0,
    };
  }

  update({
    progress,
    stage,
    message,
    meta = {},
  }) {
    this.state = {
      progress,

      stage,

      message,

      meta,

      elapsed:
        Date.now() - this.startedAt,
    };

    if (this.onProgress) {
      this.onProgress(this.getState());
    }

    return this.state;
  }

  complete(message = "Completed") {
    return this.update({
      progress: 100,

      stage: DEFAULT_STAGES.COMPLETED,

      message,
    });
  }

  fail(error) {
    return this.update({
      progress: this.state.progress,

      stage: DEFAULT_STAGES.FAILED,

      message:
        error?.message || "Generation failed",
    });
  }

  getState() {
    return {
      ...this.state,
    };
  }
}

export { DEFAULT_STAGES };