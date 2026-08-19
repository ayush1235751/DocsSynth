import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { connectToDatabase } from "../config/db.js";
import { generateEmbedding } from "./embeddingService.js";
import fs from "fs";

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function indexPDFFile(filePath, originalFileName) {
  const collection = await connectToDatabase();

  // Check if file already exists in DB
  const existing = await collection.findOne({ fileName: originalFileName });
  if (existing) {
    // Delete existing to re-index cleanly
    await collection.deleteMany({ fileName: originalFileName });
  }

  // Load PDF text
  const loader = new PDFLoader(filePath, { splitPages: false });
  const docs = await loader.load();

  if (!docs || docs.length === 0 || !docs[0].pageContent.trim()) {
    throw new Error("The PDF document is empty or could not be read.");
  }

  // Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 180,
  });

  const chunkDocs = await splitter.splitDocuments(docs);
  const chunks = chunkDocs.map((d) => d.pageContent.trim()).filter((t) => t.length > 0);

  if (chunks.length === 0) {
    throw new Error("No readable text chunks could be extracted from the document.");
  }

  console.log(`Processing ${chunks.length} chunks for ${originalFileName}...`);

  const insertedDocs = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const embedding = await generateEmbedding(chunkText);

    const docRecord = {
      fileName: originalFileName,
      text: chunkText,
      embedding: embedding,
      chunkIndex: i + 1,
      totalChunks: chunks.length,
      createdAt: new Date(),
    };

    await collection.insertOne(docRecord);
    insertedDocs.push(docRecord);
  }

  console.log(`Successfully indexed ${insertedDocs.length} chunks for ${originalFileName}`);
  return {
    fileName: originalFileName,
    chunkCount: insertedDocs.length,
    success: true,
  };
}

export async function getDocumentsList() {
  const collection = await connectToDatabase();

  const pipeline = [
    {
      $group: {
        _id: "$fileName",
        chunkCount: { $sum: 1 },
        sampleText: { $first: "$text" },
        firstUploaded: { $min: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 0,
        fileName: "$_id",
        chunkCount: 1,
        preview: { $substrCP: ["$sampleText", 0, 160] },
        uploadedAt: "$firstUploaded",
      },
    },
    { $sort: { uploadedAt: -1 } },
  ];

  const results = await collection.aggregate(pipeline).toArray();
  return results;
}

export async function getDocumentChunks(fileName = null) {
  const collection = await connectToDatabase();
  const query = fileName ? { fileName } : {};
  const chunks = await collection
    .find(query, { projection: { fileName: 1, text: 1, chunkIndex: 1, totalChunks: 1, createdAt: 1 } })
    .sort({ chunkIndex: 1 })
    .toArray();
  return chunks;
}

export async function deleteDocument(fileName) {
  const collection = await connectToDatabase();
  const result = await collection.deleteMany({ fileName });
  return {
    fileName,
    deletedCount: result.deletedCount,
    success: true,
  };
}

export async function searchRelevantChunks(query, fileName = null, limit = 5) {
  const collection = await connectToDatabase();
  const queryEmbedding = await generateEmbedding(query);

  try {
    // Attempt Atlas Vector Search
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: limit,
          ...(fileName ? { filter: { fileName: { $eq: fileName } } } : {}),
        },
      },
      {
        $project: {
          _id: 1,
          fileName: 1,
          text: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    if (results && results.length > 0) {
      return results;
    }
  } catch (atlasErr) {
    console.warn("Atlas VectorSearch notice (falling back to memory cosine similarity):", atlasErr.message);
  }

  // Graceful in-memory vector search fallback
  const queryFilter = fileName ? { fileName } : {};
  const allDocs = await collection.find(queryFilter).toArray();

  if (!allDocs || allDocs.length === 0) {
    return [];
  }

  const scoredDocs = allDocs.map((doc) => {
    let score = 0;
    if (doc.embedding && Array.isArray(doc.embedding)) {
      score = cosineSimilarity(queryEmbedding, doc.embedding);
    }
    return {
      _id: doc._id,
      fileName: doc.fileName,
      text: doc.text,
      score: score,
    };
  });

  scoredDocs.sort((a, b) => b.score - a.score);
  return scoredDocs.slice(0, limit);
}
