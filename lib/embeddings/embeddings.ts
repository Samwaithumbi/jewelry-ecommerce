/**
 * lib/embeddings/embeddings.ts
 * High-performance, resilient Voyage AI embedding client.
 * Supports single & batch embeddings with asymmetric document/query typing.
 */

export const DEFAULT_VOYAGE_MODEL = "voyage-4-lite";
export const EMBEDDING_DIMENSIONS = 1024;
export const MAX_BATCH_SIZE = 128; // Voyage AI maximum batch size per API call

export type EmbeddingInputType = "document" | "query";

export interface EmbedOptions {
  model?: string;
  inputType?: EmbeddingInputType;
  outputDimension?: number;
  maxRetries?: number;
}

function getApiKey(): string {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "VOYAGE_API_KEY is not configured. Please set VOYAGE_API_KEY in your environment (.env.local)."
    );
  }
  return apiKey.trim();
}

/**
 * Execute request to Voyage AI with exponential backoff on rate limits (429) or temporary server errors (5xx).
 */
async function callVoyageApi(
  payload: {
    model: string;
    input: string[];
    input_type?: EmbeddingInputType;
    output_dimension?: number;
  },
  maxRetries = 3
): Promise<number[][]> {
  const apiKey = getApiKey();
  let attempt = 0;
  let delayMs = 500;

  while (true) {
    attempt++;
    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          output_dimension: payload.output_dimension ?? EMBEDDING_DIMENSIONS,
        }),
      });

      if (response.ok) {
        const result: {
          data: { embedding: number[]; index?: number }[];
        } = await response.json();

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error("Invalid response format from Voyage AI API");
        }

        const embeddings = result.data.map((item, idx) => {
          if (!item.embedding || item.embedding.length !== EMBEDDING_DIMENSIONS) {
            throw new Error(
              `Voyage API returned unexpected embedding dimension at index ${idx}: expected ${EMBEDDING_DIMENSIONS}, got ${item.embedding?.length ?? 0}`
            );
          }
          return item.embedding;
        });

        return embeddings;
      }

      const status = response.status;
      const errorBody = await response.text();

      // Retry on 429 (Rate Limit) or 5xx (Server Error)
      const isTransient = status === 429 || (status >= 500 && status < 600);
      if (isTransient && attempt <= maxRetries) {
        console.warn(
          `[Voyage AI] Transient error (${status}). Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }

      throw new Error(`Voyage API error [HTTP ${status}]: ${errorBody}`);
    } catch (err: any) {
      if (attempt > maxRetries || !err.message?.includes("fetch")) {
        throw err;
      }
      console.warn(
        `[Voyage AI] Network error: ${err.message}. Retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

/**
 * Embed a single text string.
 * @param text The string to embed
 * @param options Options including inputType ("document" for products, "query" for searches)
 */
export async function embedText(
  text: string,
  options?: EmbedOptions
): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text");
  }

  const model = options?.model || process.env.VOYAGE_MODEL || DEFAULT_VOYAGE_MODEL;
  const inputType = options?.inputType || "document";

  const embeddings = await callVoyageApi(
    {
      model,
      input: [trimmed],
      input_type: inputType,
    },
    options?.maxRetries ?? 3
  );

  return embeddings[0];
}

/**
 * Embed an array of texts in batches.
 * Handles chunking to stay within Voyage AI's max batch size limit (128).
 * @param texts Array of strings to embed
 * @param options Options including inputType
 */
export async function embedTexts(
  texts: string[],
  options?: EmbedOptions
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = options?.model || process.env.VOYAGE_MODEL || DEFAULT_VOYAGE_MODEL;
  const inputType = options?.inputType || "document";

  const sanitized = texts.map((t) => (t.trim() ? t.trim() : "jewelry item"));
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < sanitized.length; i += MAX_BATCH_SIZE) {
    const chunk = sanitized.slice(i, i + MAX_BATCH_SIZE);
    const chunkEmbeddings = await callVoyageApi(
      {
        model,
        input: chunk,
        input_type: inputType,
      },
      options?.maxRetries ?? 3
    );
    allEmbeddings.push(...chunkEmbeddings);
  }

  return allEmbeddings;
}
