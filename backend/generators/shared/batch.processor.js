/**
 * ============================================================================
 * AI Learning OS
 * Batch Processor
 * ----------------------------------------------------------------------------
 * Responsibility:
 * Process asynchronous jobs in configurable batches.
 *
 * Features:
 * - Configurable concurrency
 * - Progress callback
 * - Continue on error
 * - Batch statistics
 * - Reusable across all generators
 *
 * ============================================================================
 */

const DEFAULT_OPTIONS = Object.freeze({
  concurrency: 2,
  continueOnError: false,
  onProgress: null,
});

/**
 * Process an array in parallel batches.
 *
 * @template T,R
 *
 * @param {T[]} items
 * @param {(item:T,index:number)=>Promise<R>} processor
 * @param {Object} options
 *
 * @returns {Promise<R[]>}
 */
export async function processInBatches(
  items = [],
  processor,
  options = {},
) {
  if (!Array.isArray(items)) {
    throw new Error("items must be an array.");
  }

  if (typeof processor !== "function") {
    throw new Error("processor must be a function.");
  }

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const results = [];

  let completed = 0;

  for (
    let start = 0;
    start < items.length;
    start += config.concurrency
  ) {
    const batch = items.slice(
      start,
      start + config.concurrency,
    );

    const batchResults = await Promise.all(
      batch.map(async (item, localIndex) => {
        const globalIndex = start + localIndex;

        try {
          const result = await processor(
            item,
            globalIndex,
          );

          completed++;

          if (typeof config.onProgress === "function") {
            config.onProgress({
              completed,
              total: items.length,
              progress:
                Math.round(
                  (completed / items.length) * 100,
                ),
            });
          }

          return result;
        } catch (error) {
          if (!config.continueOnError) {
            throw error;
          }

          console.error(
            `[Batch Processor] Failed item ${globalIndex}:`,
            error.message,
          );

          completed++;

          return null;
        }
      }),
    );

    results.push(...batchResults);
  }

  return results.filter(Boolean);
}

/**
 * Simple statistics helper.
 */
export function getBatchStats(items, results) {
  return {
    totalItems: items.length,

    successful: results.length,

    failed:
      items.length - results.length,
  };
}

export default processInBatches;