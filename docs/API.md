# 📡 DocsSynth REST API Documentation

<div align="center">

**DocsSynth API Specification — Version 1.0.0**  
Base URL: `http://localhost:5000` (Local) / `https://your-domain.com` (Production)

</div>

---

## 📑 Endpoints Overview

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | [`/api/health`](#1-health-check) | System and database connection status |
| `GET` | [`/api/documents`](#2-list-documents) | Retrieve all indexed documents & chunk counts |
| `POST` | [`/api/documents/upload`](#3-upload-pdf-document) | Ingest, parse, and vector-index a PDF |
| `GET` | [`/api/documents/:fileName/chunks`](#4-get-document-chunks) | Retrieve individual text chunks for a document |
| `DELETE` | [`/api/documents/:fileName`](#5-delete-document) | Delete a document and its vector embeddings |
| `POST` | [`/api/documents/preload-sample`](#6-preload-sample-document) | Index the built-in sample "Operating System" PDF |
| `POST` | [`/api/chat`](#7-rag-study-chat) | Ask questions with vector search & tone selection |
| `POST` | [`/api/study/flashcards`](#8-generate-flashcards) | Generate active recall flashcards |
| `POST` | [`/api/study/quiz`](#9-generate-mock-quiz) | Generate a practice multiple-choice quiz |
| `POST` | [`/api/study/summary`](#10-generate-study-guide) | Generate an executive study guide |
| `POST` | [`/api/study/cheatsheet`](#11-generate-cheat-sheet) | Generate a high-density quick revision cheat sheet |

---

## 1. Health Check
`GET /api/health`

Checks if the server is running and verifies MongoDB database connectivity and total indexed chunk count.

#### Sample Request
```bash
curl -X GET http://localhost:5000/api/health
```

#### Sample Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-08-20T05:00:00.000Z",
  "service": "DocsSynth AI Backend API",
  "database": "connected",
  "totalChunksIndexed": 34
}
```

---

## 2. List Documents
`GET /api/documents`

Returns an aggregated list of all uploaded PDF documents, their total chunk count, preview text snippet, and initial upload timestamp.

#### Sample Request
```bash
curl -X GET http://localhost:5000/api/documents
```

#### Sample Response (200 OK)
```json
{
  "success": true,
  "count": 1,
  "documents": [
    {
      "fileName": "Operating System .pdf",
      "chunkCount": 34,
      "preview": "Operating System (OS) is a software that acts as an interface between computer hardware components and the user...",
      "uploadedAt": "2026-08-20T04:30:00.000Z"
    }
  ]
}
```

---

## 3. Upload PDF Document
`POST /api/documents/upload`

Uploads a new PDF file, extracts text pages using LangChain PDFLoader, splits text into 900-character chunks with 180-character overlap, generates 1024-dimensional embeddings via OpenRouter, and stores them in MongoDB.

- **Content-Type**: `multipart/form-data`
- **File Field**: `file` (Max 25MB, PDF only)

#### Sample Request
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@/path/to/Lecture_Notes.pdf"
```

#### Sample Response (201 Created)
```json
{
  "success": true,
  "message": "Document \"Lecture_Notes.pdf\" indexed successfully into 18 chunks.",
  "document": {
    "fileName": "Lecture_Notes.pdf",
    "chunkCount": 18,
    "size": 1048576
  }
}
```

---

## 4. Get Document Chunks
`GET /api/documents/:fileName/chunks`

Retrieves all individual text chunks and their indices for a specified document.

#### Sample Request
```bash
curl -X GET "http://localhost:5000/api/documents/Operating%20System%20.pdf/chunks"
```

#### Sample Response (200 OK)
```json
{
  "success": true,
  "count": 34,
  "chunks": [
    {
      "_id": "66c3e981f...",
      "fileName": "Operating System .pdf",
      "text": "An Operating System (OS) acts as an intermediary...",
      "chunkIndex": 1,
      "totalChunks": 34,
      "createdAt": "2026-08-20T04:30:00.000Z"
    }
  ]
}
```

---

## 5. Delete Document
`DELETE /api/documents/:fileName`

Deletes all chunks and vector embeddings associated with the specified document from MongoDB.

#### Sample Request
```bash
curl -X DELETE "http://localhost:5000/api/documents/Operating%20System%20.pdf"
```

#### Sample Response (200 OK)
```json
{
  "success": true,
  "message": "Deleted 34 chunks.",
  "result": {
    "fileName": "Operating System .pdf",
    "deletedCount": 34,
    "success": true
  }
}
```

---

## 6. Preload Sample Document
`POST /api/documents/preload-sample`

Indexes the local `Opreating System .pdf` file bundled with the repository into MongoDB.

#### Sample Request
```bash
curl -X POST http://localhost:5000/api/documents/preload-sample
```

---

## 7. RAG Study Chat
`POST /api/chat`

Executes a semantic vector search across document chunks and prompts the multi-model LLM pool with custom student persona tuning.

#### Request Body
```json
{
  "message": "Explain how multiprogramming reduces CPU idle time.",
  "fileName": "Operating System .pdf",
  "conversationHistory": [
    { "role": "user", "content": "What is an OS?" },
    { "role": "assistant", "content": "An OS is a resource manager..." }
  ],
  "studentMode": "exam"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `message` | `string` | **Yes** | The student's question or prompt |
| `fileName` | `string` | No | Scope search to a specific document |
| `conversationHistory` | `array` | No | Previous turns for conversational context |
| `studentMode` | `string` | No | `standard` \| `simple` (ELI5) \| `exam` \| `deep` |

#### Sample Response (200 OK)
```json
{
  "success": true,
  "query": "Explain how multiprogramming reduces CPU idle time.",
  "answer": "### Multiprogramming & CPU Utilization\n\nIn early uniprogramming architectures, when a running process initiated an I/O request (such as reading from a disk), the CPU sat idle waiting for the mechanical drive.\n\n**Multiprogramming solves this by keeping multiple jobs in memory simultaneously.** When Process A blocks on I/O, the OS context-switches the CPU to Process B, keeping CPU utilization near 100%.",
  "model": "google/gemma-4-31b-it:free",
  "sources": [
    {
      "chunkIndex": 3,
      "fileName": "Operating System .pdf",
      "snippet": "Multiprogramming increases CPU utilization by organizing jobs so that the CPU always has one to execute...",
      "score": 0.94
    }
  ]
}
```

---

## 8. Generate Flashcards
`POST /api/study/flashcards`

Generates structured, active recall flashcards with question, answer, exam memory points, and difficulty ratings.

#### Request Body
```json
{
  "fileName": "Operating System .pdf",
  "count": 6
}
```

#### Sample Response (200 OK)
```json
{
  "success": true,
  "count": 6,
  "flashcards": [
    {
      "id": 1,
      "question": "What is the primary role of an Operating System?",
      "answer": "An OS acts as an intermediary between computer hardware and applications, managing CPU, memory, and I/O resources.",
      "keyPoints": [
        "Hardware abstraction layer",
        "Resource allocator and scheduler"
      ],
      "difficulty": "Easy",
      "topic": "OS Fundamentals"
    }
  ]
}
```

---

## 9. Generate Mock Quiz
`POST /api/study/quiz`

Generates multiple-choice questions with 4 options, a correct answer index, and conceptual explanations.

#### Request Body
```json
{
  "fileName": "Operating System .pdf",
  "count": 5,
  "difficulty": "Medium"
}
```

#### Sample Response (200 OK)
```json
{
  "success": true,
  "count": 5,
  "quiz": [
    {
      "id": 1,
      "question": "Which operating system architecture guarantees execution within strict deterministic deadlines?",
      "options": [
        "RTOS (Real-Time Operating System)",
        "Windows 11",
        "macOS",
        "Android"
      ],
      "correctIndex": 0,
      "explanation": "RTOS is specifically designed for deterministic hard and soft deadline compliance in embedded and industrial systems.",
      "topic": "OS Architectures"
    }
  ]
}
```

---

## 10. Generate Study Guide
`POST /api/study/summary`

Generates an executive Markdown study guide with core concepts, high-yield exam tips, and architectural overviews.

#### Request Body
```json
{
  "fileName": "Operating System .pdf"
}
```

---

## 11. Generate Cheat Sheet
`POST /api/study/cheatsheet`

Generates a high-density Markdown cheat sheet with comparison tables, workflows, and key formulas.

#### Request Body
```json
{
  "fileName": "Operating System .pdf"
}
```
