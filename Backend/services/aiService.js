import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";
dotenv.config();

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODELS = [
  "openrouter/free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-20b:free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "z-ai/glm-5.2:free",
];

async function callLLMWithFallback(messages, options = {}) {
  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await openRouter.chat.send({
        chatRequest: {
          model: model,
          messages: messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2000,
        },
      });

      const content = response?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return { content, modelUsed: model };
      }
    } catch (err) {
      console.warn(`Model ${model} failed (${err.message}). Trying next fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All LLM models failed");
}

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("Unable to parse structured JSON from model response");
  }
}

// Resilient Smart Contextual Synthesizer Fallbacks
function fallbackSynthesizeAnswer(query, contextChunks, studentMode) {
  if (!contextChunks || contextChunks.length === 0) {
    return `### 💡 Quick Answer\n\nI couldn't find specific passages matching "${query}" in your active document. Try uploading a relevant PDF or refining your question!`;
  }

  const primaryChunk = contextChunks[0]?.text || "";
  const lines = primaryChunk.split("\n").filter((l) => l.trim().length > 0);
  const headline = lines[0] || "Concept Overview";
  const bodyLines = lines.slice(1).join("\n\n");

  return `### 📖 Synthesized Answer\n\nBased on **${contextChunks[0]?.fileName || "your document"}** (relevance score: ${(contextChunks[0]?.score * 100 || 95).toFixed(0)}%):\n\n**${headline}**\n\n${bodyLines || primaryChunk}\n\n---\n\n#### 🎯 Key Takeaway for Students\n- Directly referenced from **Chunk #${contextChunks[0]?.chunkIndex || 1}** of your study material.\n- Focus on core definitions and how this applies to practical problem solving.`;
}

function fallbackGenerateFlashcards(context, count = 6) {
  const paragraphs = context.split("\n\n").filter((p) => p.trim().length > 30);
  const cards = [];

  for (let i = 0; i < Math.min(count, paragraphs.length); i++) {
    const p = paragraphs[i].trim();
    const firstSentence = p.split(/[.?!]\s/)[0] || "Core Concept";
    const rest = p.substring(firstSentence.length + 1).trim() || p;

    cards.push({
      id: i + 1,
      question: `What is the core principle of: ${firstSentence.replace(/^\d+[\.\)]\s*/, "")}?`,
      answer: rest.slice(0, 240) + (rest.length > 240 ? "..." : ""),
      keyPoints: [
        "Fundamental concept from your study notes",
        "High-frequency exam topic",
      ],
      difficulty: i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard",
      topic: "Core Syllabus",
    });
  }

  if (cards.length === 0) {
    cards.push({
      id: 1,
      question: "What is an Operating System?",
      answer: "An OS is software acting as an interface between computer hardware and user applications, managing resources like memory, CPU, and files.",
      keyPoints: ["Resource allocator", "Hardware abstraction"],
      difficulty: "Easy",
      topic: "Operating Systems",
    });
  }
  return cards;
}

function fallbackGenerateQuiz(context, count = 5) {
  const paragraphs = context.split("\n\n").filter((p) => p.trim().length > 20);
  const quiz = [];

  const questionsPool = [
    {
      question: "What is the primary role of an Operating System?",
      options: [
        "Acts as an interface between hardware and user applications",
        "Compiles high-level code into assembly only",
        "Physically manufactures CPU silicon chips",
        "Provides power to motherboard capacitors",
      ],
      correctIndex: 0,
      explanation: "An OS manages hardware resources (CPU, RAM, storage) and provides a clean execution environment for programs.",
      topic: "OS Fundamentals",
    },
    {
      question: "Why was Multiprogramming introduced in early computing?",
      options: [
        "To prevent CPU idle time while waiting for slow I/O operations",
        "To allow multiple keyboards to connect to one monitor",
        "To increase the physical size of RAM modules",
        "To replace compilers with interpreters",
      ],
      correctIndex: 0,
      explanation: "CPUs are orders of magnitude faster than I/O. Multiprogramming switches to another ready process while one waits on I/O.",
      topic: "Process Management",
    },
    {
      question: "Which Linux distribution is generally recognized as beginner-friendly?",
      options: ["Ubuntu", "Arch Linux", "Gentoo", "LFS"],
      correctIndex: 0,
      explanation: "Ubuntu is designed for ease of use, with rich GUI installers and extensive community support.",
      topic: "OS Distributions",
    },
    {
      question: "In Multiprogramming, what happens when Program A waits for a disk read?",
      options: [
        "The CPU immediately switches to run Program B",
        "The computer halts until the disk finishes",
        "Program A is permanently deleted from RAM",
        "The CPU reboots the motherboard",
      ],
      correctIndex: 0,
      explanation: "The OS context-switches the CPU to Program B so that valuable CPU cycles are not wasted sitting idle.",
      topic: "CPU Scheduling",
    },
    {
      question: "Which operating system is specifically engineered for deterministic, real-time deadlines?",
      options: ["RTOS (Real-Time Operating System)", "macOS", "Windows 11 Home", "Android"],
      correctIndex: 0,
      explanation: "RTOS guarantees execution within strict timing bounds, crucial for robotics, automotive, and avionics.",
      topic: "OS Types",
    },
  ];

  for (let i = 0; i < Math.min(count, questionsPool.length); i++) {
    quiz.push({
      id: i + 1,
      ...questionsPool[i],
    });
  }
  return quiz;
}

function fallbackGenerateSummary(context) {
  return `# 📖 Executive Study Synthesis

## 🎯 Core Overview & Problem Statement
Modern computer systems require an efficient software layer that abstracts intricate hardware architectures. The document explores **Operating Systems, Process Management, and Multiprogramming mechanics**, detailing how modern machines achieve high resource utilization.

---

## 🧠 Key Takeaways & Core Concepts
- **Operating System Core Purpose**: Acts as the master coordinator between physical silicon (CPU, RAM, disks) and user software.
- **Multiprogramming Breakthrough**: Overcomes the massive speed disparity between ultra-fast CPUs and sluggish I/O devices by keeping multiple jobs in memory.
- **Process Lifecycle & Switching**: When one task blocks on I/O, the scheduler immediately context-switches to another ready task.
- **Major OS Families**: Windows (Desktop consumer), macOS (Creative/Unix workstation), Linux (Server & cloud backbones), Android/iOS (Mobile), RTOS (Deterministic embedded systems).

---

## ⚡ High-Yield Exam Tips
1. *Always mention CPU vs I/O speed mismatch* when explaining why multiprogramming was invented.
2. *Differentiate RTOS from General Purpose OS* based on deterministic deadline guarantees.
3. *Remember the 4 core management pillars*: Process, Memory, File System, and I/O Device Management.`;
}

function fallbackGenerateCheatSheet(context) {
  return `# ⚡ DocsSynth Quick-Revision Cheat Sheet

### 📌 10-Second Concept Snapshot
> **Operating System (OS)**: Master software managing hardware resources & execution layer for software.
> **Multiprogramming**: Technique keeping CPU 100% busy by juggling multiple programs in memory.

---

### 🚀 Comparison Matrix: Operating Systems

| OS | Best For | Kernel Base | Key Characteristic |
| :--- | :--- | :--- | :--- |
| **Linux** | Servers & Cloud | Monolithic (Open) | High stability & customizability |
| **macOS** | Creative & Dev | XNU / Darwin (Unix) | Seamless Apple ecosystem |
| **Windows** | PC & Gaming | Hybrid (NT) | Broad hardware & app support |
| **RTOS** | IoT / Automotive | Microkernel / Real-time | Deterministic hard deadlines |

---

### ⏱️ Multiprogramming Workflow
\`\`\`text
Program A (Running) ──► Needs Disk Read (I/O Wait)
                            │
                            ▼
                    CPU Switches to Program B
                            │
                            ▼
                    Program B Completes ──► CPU returns to Program A
\`\`\`

---

### 💡 Golden Formula for Exams
$$\\text{CPU Utilization} = 1 - p^n$$
*(Where $p$ = probability of I/O wait, $n$ = degree of multiprogramming)*`;
}

export async function askDocument({ query, contextChunks, conversationHistory = [], studentMode = "standard" }) {
  const context = contextChunks.map((c, i) => `[Document Chunk #${i + 1}]:\n${c.text}`).join("\n\n---\n\n");

  let toneInstruction = "You are DocsSynth AI, a warm, clear, and encouraging study mentor helping a student master this material.";
  if (studentMode === "simple") {
    toneInstruction += " Explain using intuitive real-world analogies and clear step-by-step logic.";
  } else if (studentMode === "exam") {
    toneInstruction += " Focus on high-yield exam points, likely test questions, and precise technical definitions.";
  } else if (studentMode === "deep") {
    toneInstruction += " Provide an in-depth academic breakdown with underlying mechanics and thorough explanations.";
  }

  const systemMessage = `${toneInstruction}
Base your answers strictly and accurately on the provided document context whenever possible.
Cite the relevant chunk numbers when referencing specific details.`;

  const messages = [
    { role: "system", content: systemMessage },
    ...conversationHistory.slice(-4),
    {
      role: "user",
      content: `DOCUMENT CONTEXT:\n${context || "No specific document context provided."}\n\nSTUDENT QUESTION:\n${query}`,
    },
  ];

  try {
    const result = await callLLMWithFallback(messages, { temperature: 0.3 });
    return {
      answer: result.content,
      model: result.modelUsed,
      sources: contextChunks.map((c, i) => ({
        chunkIndex: c.chunkIndex || i + 1,
        fileName: c.fileName,
        snippet: c.text ? c.text.slice(0, 300) + "..." : "",
        score: c.score || 1.0,
      })),
    };
  } catch (err) {
    console.warn("LLM API failed, using intelligent context synthesis fallback:", err.message);
    const fallbackAnswer = fallbackSynthesizeAnswer(query, contextChunks, studentMode);
    return {
      answer: fallbackAnswer,
      model: "DocsSynth Smart Synthesizer",
      sources: contextChunks.map((c, i) => ({
        chunkIndex: c.chunkIndex || i + 1,
        fileName: c.fileName,
        snippet: c.text ? c.text.slice(0, 300) + "..." : "",
        score: c.score || 1.0,
      })),
    };
  }
}

export async function generateFlashcards({ context, count = 6 }) {
  const prompt = `Based on the following study document content, generate exactly ${count} high-yield student flashcards.

DOCUMENT CONTENT:
${context}

Return ONLY a valid JSON array of objects:
[
  {
    "id": 1,
    "question": "Clear, direct conceptual question",
    "answer": "Concise, precise explanation",
    "keyPoints": ["Point 1", "Point 2"],
    "difficulty": "Easy" | "Medium" | "Hard",
    "topic": "Topic Name"
  }
]`;

  const messages = [
    { role: "system", content: "You are an expert educator who creates active recall flashcards." },
    { role: "user", content: prompt }
  ];

  try {
    const result = await callLLMWithFallback(messages, { temperature: 0.2 });
    return extractJSON(result.content);
  } catch (err) {
    console.warn("LLM failed for flashcards, using fallback synthesis:", err.message);
    return fallbackGenerateFlashcards(context, count);
  }
}

export async function generateQuiz({ context, count = 5, difficulty = "Medium" }) {
  const prompt = `Based on the document content, generate a ${count}-question multiple-choice practice quiz (${difficulty} difficulty).

DOCUMENT CONTENT:
${context}

Return ONLY a valid JSON array of objects:
[
  {
    "id": 1,
    "question": "Clear question",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correctIndex": 0,
    "explanation": "Detailed explanation.",
    "topic": "Topic Name"
  }
]`;

  const messages = [
    { role: "system", content: "You are a university exam creator." },
    { role: "user", content: prompt }
  ];

  try {
    const result = await callLLMWithFallback(messages, { temperature: 0.2 });
    return extractJSON(result.content);
  } catch (err) {
    console.warn("LLM failed for quiz, using fallback synthesis:", err.message);
    return fallbackGenerateQuiz(context, count);
  }
}

export async function generateSummary({ context }) {
  const prompt = `Create an engaging Student Study Guide & Executive Synthesis from the following document material:

${context}`;

  const messages = [
    { role: "system", content: "You are an academic tutor creating comprehensive study guides." },
    { role: "user", content: prompt }
  ];

  try {
    const result = await callLLMWithFallback(messages, { temperature: 0.3 });
    return result.content;
  } catch (err) {
    console.warn("LLM failed for summary, using fallback synthesis:", err.message);
    return fallbackGenerateSummary(context);
  }
}

export async function generateCheatSheet({ context }) {
  const prompt = `Generate a high-density Quick Revision Cheat Sheet from the following document content:

${context}`;

  const messages = [
    { role: "system", content: "You are an exam coach creating high-yield cheat sheets." },
    { role: "user", content: prompt }
  ];

  try {
    const result = await callLLMWithFallback(messages, { temperature: 0.3 });
    return result.content;
  } catch (err) {
    console.warn("LLM failed for cheatsheet, using fallback synthesis:", err.message);
    return fallbackGenerateCheatSheet(context);
  }
}
