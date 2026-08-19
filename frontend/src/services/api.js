const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    return { status: "offline", error: error.message };
  }
}

export async function getDocuments() {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  const data = await res.json();
  return data.documents || [];
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to upload document");
  }
  return data;
}

export async function deleteDocument(fileName) {
  const res = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(fileName)}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete document");
  }
  return data;
}

export async function getDocumentChunks(fileName) {
  const res = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(fileName)}/chunks`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch document chunks");
  }
  return data.chunks || [];
}

export async function sendChatMessage({ message, fileName, conversationHistory = [], studentMode = "standard" }) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, fileName, conversationHistory, studentMode }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to get AI answer");
  }
  return data;
}

export async function fetchFlashcards({ fileName, count = 6 }) {
  const res = await fetch(`${API_BASE_URL}/study/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, count }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to generate flashcards");
  }
  return data.flashcards || [];
}

export async function fetchQuiz({ fileName, count = 5, difficulty = "Medium" }) {
  const res = await fetch(`${API_BASE_URL}/study/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, count, difficulty }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to generate quiz");
  }
  return data.quiz || [];
}

export async function fetchSummary({ fileName }) {
  const res = await fetch(`${API_BASE_URL}/study/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to generate summary");
  }
  return data.summary || "";
}

export async function fetchCheatSheet({ fileName }) {
  const res = await fetch(`${API_BASE_URL}/study/cheatsheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to generate cheat sheet");
  }
  return data.cheatsheet || "";
}

export async function preloadSampleDocument() {
  const res = await fetch(`${API_BASE_URL}/documents/preload-sample`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to preload sample");
  }
  return data;
}
