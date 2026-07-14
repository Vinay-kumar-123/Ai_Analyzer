const API = process.env.NEXT_PUBLIC_API_URL || "";

const requestJson = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
  });

  const json = await res.json().catch(() => null);

  // Handle rate-limiting (HTTP 429) gracefully so callers can implement retry logic
  if (res.status === 429) {
    const retryAfterHeader = res.headers.get("Retry-After") || res.headers.get("retry-after");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : json?.retryAfter;
    return {
      success: false,
      retryAfter: Number.isFinite(retryAfter) ? Number(retryAfter) : undefined,
      message: json?.message || "Too many requests. Please try again later.",
    };
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
};

export const getAnalysis = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}`, options);

export const generateNotes = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/notes`, options);

export const generateQuiz = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/quiz`, options);

export const generateFlashcards = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/flashcards`, options);

export const generateRoadmap = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/roadmap`, options);

export const generateProject = (analysisId, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/project`, options);

export const generateLazyContent = (analysisId, route, options = {}) =>
  requestJson(`/api/analyze/${analysisId}/${route}`, options);
