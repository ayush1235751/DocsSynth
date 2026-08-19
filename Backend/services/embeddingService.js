import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";
dotenv.config();

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";

export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Text must be a non-empty string for embedding generation");
  }

  try {
    const response = await openRouter.embeddings.generate({
      requestBody: {
        model: EMBEDDING_MODEL,
        input: [
          {
            content: [
              {
                type: "text",
                text: text,
              },
            ],
            encodingformat: "float",
          },
        ],
      },
    });

    if (response?.data?.[0]?.embedding) {
      return response.data[0].embedding;
    }
    throw new Error("Invalid embedding response structure");
  } catch (error) {
    console.error("Embedding generation error:", error.message);
    throw error;
  }
}

export async function generateBatchEmbeddings(chunks, progressCallback = null) {
  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    embeddings.push(embedding);
    if (progressCallback) {
      progressCallback(i + 1, chunks.length);
    }
  }
  return embeddings;
}
