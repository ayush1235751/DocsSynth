import { connectToDatabase } from "../config/db.js";
import { generateQueryEmbedding } from "../chains/qaChain.js";
import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";
dotenv.config();

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function searchDocuments(query) {
  try {
    // query is a normal string
    const queryEmbedding = await generateQueryEmbedding(query);

    console.log("Query:", query);
    console.log("Embedding dimensions:", queryEmbedding.length);

    const collection = await connectToDatabase();

    const documents = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 5,
          },
        },
        {
          $project: {
            _id: 1,
            fileName: 1,
            text: 1,
            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ])
      .toArray();

    const context = documents.map((doc) => doc.text).join("\n\n");

    const response = await openRouter.chat.send({
      chatRequest: {
        model: "google/gemma-4-26b-a4b-it:free",
        messages: [
          {
            role: "system",
            content: "Answer only using the provided context.",
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion:\n${query}`,
          },
        ],
      },
    });
    console.log(response.choices[0].message.content);

    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ Search Error:", error);
    throw error;
  }
}
