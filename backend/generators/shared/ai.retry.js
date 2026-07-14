/**
 * ============================================================================
 * AI Learning OS
 * AI Retry Layer
 * ----------------------------------------------------------------------------
 * Responsibility:
 * - Retry AI requests
 * - Exponential backoff
 * - Retry only retryable errors
 * - Avoid retry loops
 * ============================================================================
 */

const DEFAULT_OPTIONS = Object.freeze({
  retries: 3,
  initialDelay: 1500,
  backoffMultiplier: 2,
});

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether request should retry.
 */
export function isRetryableError(error) {
  if (!error) return false;

  const message = String(error.message || "").toLowerCase();

  const status =
    error.status ||
    error.statusCode ||
    error.code;

  if (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("rate limit") ||
    message.includes("temporarily") ||
    message.includes("overloaded") ||
    message.includes("connection")
  );
}

/**
 * Execute function with retry.
 */
export async function withRetry(
  fn,
  options = {},
) {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let delay = config.initialDelay;
  let lastError;

  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const retryable = isRetryableError(error);

      if (!retryable || attempt === config.retries) {
        throw error;
      }

      console.warn(
        `[AI Retry] Attempt ${attempt}/${config.retries} failed. Retrying in ${delay}ms...`,
      );

      await sleep(delay);

      delay *= config.backoffMultiplier;
    }
  }

  throw lastError;
}