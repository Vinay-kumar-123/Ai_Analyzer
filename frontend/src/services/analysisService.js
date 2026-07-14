const API = process.env.NEXT_PUBLIC_API_URL || "";

const requestJson = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  return json;
};

export const fetchAnalysisResult = (analysisId) => requestJson(`/api/analyze/${analysisId}`);

export const fetchLazyAnalysisContent = (analysisId, route) =>
  requestJson(`/api/analyze/${analysisId}/${route}`);
