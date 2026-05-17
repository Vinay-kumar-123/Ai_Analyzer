import { Queue, QueueEvents } from "bullmq";
import { connection }         from "../config/redis.js";

// ======================================================
// QUEUE NAME CONSTANT
// Single source of truth — used by queue, worker, and
// any place that needs to reference the queue by name.
// ======================================================

export const ANALYSIS_QUEUE_NAME = "analysis";

// ======================================================
// QUEUE INSTANCE
// defaultJobOptions apply to every job added to this queue
// unless explicitly overridden at the call site.
// ======================================================

export const analysisQueue = new Queue(ANALYSIS_QUEUE_NAME, {
  connection,

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type:  "exponential",
      delay: 3000, // 3s, 9s, 27s
    },

    removeOnComplete: {
      count: 100,  // keep last 100 completed jobs for debugging
    },

    removeOnFail: {
      count: 50,   // keep last 50 failed jobs for post-mortem
    },
  },
});

// ======================================================
// QUEUE EVENTS (optional — attach for monitoring)
// QueueEvents allows any process (not just the worker)
// to listen to queue-level events, useful for:
//   - server-sent events / WebSocket progress updates
//   - logging completed/failed jobs from the API server
//   - alerting on queue drain or high failure rate
// ======================================================

export const analysisQueueEvents = new QueueEvents(ANALYSIS_QUEUE_NAME, {
  connection,
});

// ======================================================
// QUEUE HEALTH CHECK
// Call this from your /health endpoint to verify
// Redis connectivity and queue responsiveness.
// ======================================================

export const getQueueHealth = async () => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      analysisQueue.getWaitingCount(),
      analysisQueue.getActiveCount(),
      analysisQueue.getCompletedCount(),
      analysisQueue.getFailedCount(),
      analysisQueue.getDelayedCount(),
    ]);

    return {
      healthy:   true,
      name:      ANALYSIS_QUEUE_NAME,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  } catch (err) {
    return {
      healthy: false,
      name:    ANALYSIS_QUEUE_NAME,
      error:   err.message,
    };
  }
};

// ======================================================
// GRACEFUL SHUTDOWN HELPER
// Call this from your main server shutdown handler.
// Closing the queue gracefully drains in-flight events
// and prevents Redis connection leak warnings.
// ======================================================

export const closeQueue = async () => {
  try {
    await analysisQueueEvents.close();
    await analysisQueue.close();
    console.log("✅ Analysis queue closed");
  } catch (err) {
    console.error("❌ Error closing analysis queue:", err.message);
  }
};

export default analysisQueue;