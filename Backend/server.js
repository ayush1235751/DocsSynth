import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import studyRoutes from "./routes/studyRoutes.js";
import { connectToDatabase } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*", // allow requests from any origin (e.g. Vite frontend on 5173)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const col = await connectToDatabase();
    const docCount = await col.countDocuments();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "DocsSynth AI Backend API",
      database: "connected",
      totalChunksIndexed: docCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "degraded",
      database: "disconnected",
      error: error.message,
    });
  }
});

// Mount Routes
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/study", studyRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to DocsSynth Student AI API Server",
    docs: "/api/health",
    version: "1.0.0",
  });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error occurred",
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🚀 DocsSynth Backend running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);

  try {
    await connectToDatabase();
    console.log("✅ MongoDB ready for vector search & retrieval");
  } catch (err) {
    console.error("⚠️ MongoDB connection error on boot:", err.message);
  }
});

export default app;
