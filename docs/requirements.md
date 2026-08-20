# ==============================================================================
# DocsSynth - Comprehensive Requirements & Dependency Specification
# ==============================================================================
# DocsSynth is a full-stack AI Document Synthesis & Active Recall Study Platform.
# This specification documents all runtime, framework, backend, frontend,
# and optional tooling requirements.

# ------------------------------------------------------------------------------
# 1. System & Runtime Requirements
# ------------------------------------------------------------------------------
# Node.js: >= 18.18.0 (Node 20.x or 22.x recommended for native fetch & crypto)
# npm:     >= 9.0.0 (or pnpm >= 8.0.0 / yarn >= 1.22.0)
# MongoDB: >= 6.0.0 (MongoDB Atlas with Vector Search index or local MongoDB)

# ------------------------------------------------------------------------------
# 2. Backend Dependencies (Node.js / Express.js / ES Module)
# Location: ./Backend/package.json
# ------------------------------------------------------------------------------
# Core Framework & Middleware
express==5.2.1
cors==2.8.6
dotenv==16.4.7
multer==2.2.0

# Document Ingestion, PDF Parsing & Chunking
@langchain/community==1.1.29
@langchain/core==1.2.8
@langchain/textsplitters==1.0.1
langchain==1.5.9
pdf-parse==2.4.5

# Database & Vector Store Connectors
mongodb==7.5.0
mongoose==9.9.2

# AI / LLM & Embedding Integrations
@openrouter/sdk==1.2.37

# ------------------------------------------------------------------------------
# 3. Frontend Dependencies (React 19 / Vite / Modern CSS)
# Location: ./frontend/package.json
# ------------------------------------------------------------------------------
# Core UI Framework
react==19.2.8
react-dom==19.2.8

# Icons & Visualization
lucide-react==1.31.0
canvas-confetti==1.9.4

# Markdown Parsing & Formatting
react-markdown==10.1.0

# Build Tooling & Linting (Dev Dependencies)
vite==8.2.0
@vitejs/plugin-react==6.0.4
oxlint==1.75.0
@types/react==19.2.17
@types/react-dom==19.2.3

# ------------------------------------------------------------------------------
# 4. External Services & Cloud APIs
# ------------------------------------------------------------------------------
# - OpenRouter API: Embeddings (nvidia/llama-nemotron-embed-vl-1b-v2:free)
#                   LLMs (google/gemma-4-31b-it:free, openai/gpt-oss-20b:free,
#                         liquid/lfm-2.5-2.6b:free, nvidia/nemotron-3-nano-30b-a3b:free)
# - MongoDB Atlas: Cluster with vectorSearch collection "DocsSynth.Private_DOCS"
# - Web Speech API: Browser-native SpeechSynthesis for Audio Podcast Briefings

# ------------------------------------------------------------------------------
# 5. Optional Python Utility Tooling (If utilizing Python scripts for data prep)
# ------------------------------------------------------------------------------
# langchain>=0.2.0
# pymongo>=4.6.0
# pypdf>=4.0.0
# sentence-transformers>=2.2.0
# numpy>=1.24.0
# python-dotenv>=1.0.0
