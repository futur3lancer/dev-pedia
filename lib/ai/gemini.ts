// Phase 4 — manipis na wrapper sa Gemini REST API. Direktang `fetch` sa
// halip na opisyal na SDK — walang extra dependency, at server-only naman
// lagi ang gamit nito (mula sa server actions), kaya safe ang env var
// access dito. Kung dadami ang AI features (summary, quiz, flashcards),
// dito rin sila dadaan — iisa lang ang lugar na nag-aalaga ng API call,
// error shape, at model name.

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GenerateOptions {
  temperature?: number;
}

export async function generateAnswer(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY ay hindi naka-set. Idagdag ito sa .env.local (see .env.example)."
    );
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    // Karaniwang dahilan: na-block ng safety filter (check
    // data.candidates[0].finishReason kung kailangan pang i-debug).
    throw new Error("Walang natanggap na sagot mula sa Gemini.");
  }

  return text;
}

// Phase 5 (slice 2): embeddings para sa semantic search. Gemini
// "text-embedding-004" — 768 dimensions (dapat tumugma sa `vector(768)`
// column sa migration 0009). Hiwalay na `taskType` para sa documents
// (RETRIEVAL_DOCUMENT — nase-save sa articles.embedding) laban sa queries
// (RETRIEVAL_QUERY — hindi naka-save, sa runtime lang ginagamit) — mas
// tumpak ang retrieval kapag magkaiba ang task type ng dalawang panig,
// ayon sa dokumentasyon ng Gemini embeddings API.
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY ay hindi naka-set. Idagdag ito sa .env.local (see .env.example)."
    );
  }

  const res = await fetch(`${EMBEDDING_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embeddings API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const values: number[] | undefined = data?.embedding?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error("Walang natanggap na embedding mula sa Gemini.");
  }

  return values;
}
