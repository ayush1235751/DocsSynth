import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  indexPDFFile,
  getDocumentsList,
  getDocumentChunks,
  deleteDocument,
} from "../services/documentService.js";

const router = express.Router();

// Configure multer for PDF uploads
const uploadDir = path.resolve("./uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported currently"));
    }
  },
});

// GET /api/documents - List all documents
router.get("/", async (req, res) => {
  try {
    const docs = await getDocumentsList();
    res.json({ success: true, count: docs.length, documents: docs });
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/documents/upload - Upload and index PDF
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No PDF file provided" });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log(`Received PDF upload: ${originalName} (${req.file.size} bytes)`);

    const indexResult = await indexPDFFile(filePath, originalName);

    // Optionally cleanup local temporary file after indexing into MongoDB
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanErr) {
      console.warn("Could not delete temp file:", cleanErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Document "${originalName}" indexed successfully into ${indexResult.chunkCount} chunks.`,
      document: {
        fileName: originalName,
        chunkCount: indexResult.chunkCount,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/documents/:fileName/chunks - Get chunks for document
router.get("/:fileName/chunks", async (req, res) => {
  try {
    const { fileName } = req.params;
    const chunks = await getDocumentChunks(decodeURIComponent(fileName));
    res.json({ success: true, count: chunks.length, chunks });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/documents/:fileName - Delete document
router.delete("/:fileName", async (req, res) => {
  try {
    const { fileName } = req.params;
    const result = await deleteDocument(decodeURIComponent(fileName));
    res.json({ success: true, message: `Deleted ${result.deletedCount} chunks.`, result });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/documents/preload-sample - Preload existing Opreating System .pdf if present
router.post("/preload-sample", async (req, res) => {
  try {
    const samplePath = path.resolve("./Opreating System .pdf");
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ success: false, error: "Sample PDF not found on server" });
    }
    const result = await indexPDFFile(samplePath, "Opreating System .pdf");
    res.json({ success: true, message: "Sample PDF indexed successfully", result });
  } catch (error) {
    console.error("Error preloading sample:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
