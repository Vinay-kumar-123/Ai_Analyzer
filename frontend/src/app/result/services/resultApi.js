/**
 * ============================================================================
 * AI Learning OS
 * Result API Service
 * ----------------------------------------------------------------------------
 * Responsibilities
 *
 * • All Result Page API communication
 * • Analysis polling
 * • Lazy generation (dispatched by BACKEND ROUTE, not tab id)
 * • Consistent error handling
 * • AbortController support
 * • Credentials support
 *
 * GENERATOR DISPATCH
 * ------------------
 * The lazy generation hook dispatches by tab.route, which maps to actual
 * backend endpoints:
 *
 *   route "notes"   → GET /api/analyze/:id/notes
 *   route "roadmap" → GET /api/analyze/:id/roadmap   (Actions + Roadmap)
 *   route "quiz"    → GET /api/analyze/:id/quiz
 *
 * Q&A has been removed from the MVP.  Do not add qa back.
 *
 * NOTE
 * This is the ONLY file allowed to communicate with the backend.
 * Never call fetch() outside this service.
 * ============================================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* -------------------------------------------------------------------------- */
/* Internal Request Helper                                                      */
/* -------------------------------------------------------------------------- */

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    cache: "no-store",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },

    ...options,
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,

    /*
     * Retry-After is returned in seconds by the server; expose as a number
     * so callers can multiply by 1_000 for setTimeout.
     */
    retryAfter: Number(response.headers.get("Retry-After") || 0),

    success: body?.success ?? response.ok,
    message: body?.message,
    data: body?.data !== undefined ? body.data : body,
  };
}

/* -------------------------------------------------------------------------- */
/* Analysis                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAnalysis(analysisId, signal) {
  return request(`/api/analyze/${analysisId}`, {
    method: "GET",
    signal,
  });
}

export async function getAnalysisStatus(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/status`, {
    method: "GET",
    signal,
  });
}

/* -------------------------------------------------------------------------- */
/* Lazy Generators — keyed by BACKEND ROUTE                                     */
/* -------------------------------------------------------------------------- */

/**
 * Generate structured notes for an analysis.
 * Returns: { notes: string, sections?: [{title, content}] }
 */
async function generateNotes(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/notes`, {
    method: "GET",
    signal,
  });
}

/**
 * Generate roadmap AND action steps for an analysis.
 * Returns: { roadmap: string[], actionSteps: string[] }
 *
 * This single endpoint satisfies BOTH the Actions tab and the Roadmap tab.
 * Do NOT call it twice.
 */
async function generateRoadmap(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/roadmap`, {
    method: "GET",
    signal,
  });
}

/**
 * Generate quiz questions for an analysis.
 * Returns: { quiz: [{question, options, answer, difficulty?, explanation?}] }
 */
async function generateQuiz(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/quiz`, {
    method: "GET",
    signal,
  });
}

/**
 * Generate flashcards for an analysis.
 * Returns: { flashcards: [{question, answer, type, difficulty, tags}] }
 */
async function generateFlashcards(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/flashcards`, {
    method: "GET",
    signal,
  });
}

/* -------------------------------------------------------------------------- */
/* Route → Generator Dispatch Map                                               */
/* -------------------------------------------------------------------------- */

/**
 * Maps backend route strings (tab.route) to their generator functions.
 *
 * IMPORTANT: Keys must match the `route` field in tabs.js exactly.
 * The hook dispatches by tab.route, not by tab.id.
 */
const ROUTE_GENERATORS = Object.freeze({
  notes:      generateNotes,
  roadmap:    generateRoadmap,
  quiz:       generateQuiz,
  flashcards: generateFlashcards,
});

/**
 * Execute the generator for a given backend route.
 *
 * @param {string} analysisId  - MongoDB ObjectId.
 * @param {string} route       - Backend route key ("notes" | "roadmap" | "quiz" | "flashcards").
 * @param {AbortSignal} signal - AbortController signal for cancellation.
 * @returns {Promise<object>}  - Normalised API response.
 */
export async function generateLazyContent(analysisId, route, signal) {
  const generator = ROUTE_GENERATORS[route];

  if (!generator) {
    throw new Error(`No generator registered for route: "${route}"`);
  }

  return generator(analysisId, signal);
}

export async function getTutorStatus(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/tutor/status`, {
    method: "GET",
    signal,
  });
}

export async function sendTutorMessage(analysisId, message, signal) {
  return request(`/api/analyze/${analysisId}/tutor/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
    signal,
  });
}

export async function purchaseTutorPack(analysisId, signal) {
  return request(`/api/analyze/${analysisId}/tutor/purchase-pack`, {
    method: "POST",
    signal,
  });
}

const resultApi = {
  getAnalysis,
  getAnalysisStatus,
  generateLazyContent,
  getTutorStatus,
  sendTutorMessage,
  purchaseTutorPack,
};

export default resultApi;

