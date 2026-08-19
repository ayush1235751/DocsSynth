import express from "express";
import { searchRelevantChunks } from "../services/documentService.js";
import { askDocument } from "../services/aiService.js";

const router = express.Router();

// POST /api/chat - RAG Chat with document context
router.post("/", async (req, res) => {
  try {
    const { message, fileName, conversationHistory = [], studentMode = "standard" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Question/message is required" });
    }

    // Retrieve relevant context chunks
    const relevantChunks = await searchRelevantChunks(message.trim(), fileName || null, 5);

    // Generate AI response
    const result = await askDocument({
      query: message.trim(),
      contextChunks: relevantChunks,
      conversationHistory,
      studentMode,
    });

    res.json({
      success: true,
      query: message,
      answer: result.answer,
      model: result.model,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
