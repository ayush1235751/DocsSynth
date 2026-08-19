import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();



const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateQueryEmbedding(question) {
  const response = await openRouter.embeddings.generate({
    requestBody: {
      model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
      input: [
        {
          content: [
            {
              type: "text",
              text: question,
            },
          ],
          encodingformat: "float",
        },
      ],
    },
  });

  return response.data[0].embedding;
}