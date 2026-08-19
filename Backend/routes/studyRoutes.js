import express from "express";
import { getDocumentChunks } from "../services/documentService.js";
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  generateCheatSheet,
} from "../services/aiService.js";

const router = express.Router();

// Helper to get aggregated text context from document chunks
async function getContextForDocument(fileName, maxChars = 12000) {
  const chunks = await getDocumentChunks(fileName || null);
  if (!chunks || chunks.length === 0) {
    throw new Error("No indexed document content found. Please upload a document first.");
  }
  const text = chunks.map((c) => c.text).join("\n\n");
  return text.slice(0, maxChars);
}

// POST /api/study/flashcards
router.post("/flashcards", async (req, res) => {
  try {
    const { fileName, count = 6 } = req.body;
    const context = await getContextForDocument(fileName);
    const flashcards = await generateFlashcards({ context, count: Number(count) || 6 });
    res.json({ success: true, count: flashcards.length, flashcards });
  } catch (error) {
    console.error("Flashcard generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/study/quiz
router.post("/quiz", async (req, res) => {
  try {
    const { fileName, count = 5, difficulty = "Medium" } = req.body;
    const context = await getContextForDocument(fileName);
    const quiz = await generateQuiz({ context, count: Number(count) || 5, difficulty });
    res.json({ success: true, count: quiz.length, quiz });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/study/summary
router.post("/summary", async (req, res) => {
  try {
    const { fileName } = req.body;
    const context = await getContextForDocument(fileName);
    const summary = await generateSummary({ context });
    res.json({ success: true, summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/study/cheatsheet
router.post("/cheatsheet", async (req, res) => {
  try {
    const { fileName } = req.body;
    const context = await getContextForDocument(fileName);
    const cheatsheet = await generateCheatSheet({ context });
    res.json({ success: true, cheatsheet });
  } catch (error) {
    console.error("Cheat sheet generation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
