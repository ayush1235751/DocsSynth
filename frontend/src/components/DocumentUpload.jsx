import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  Layers,
  Sparkles,
  Eye
} from "lucide-react";
import { uploadDocument, deleteDocument, preloadSampleDocument, getDocumentChunks } from "../services/api";

export default function DocumentUpload({
  documents = [],
  activeDoc,
  onSelectDoc,
  onRefreshDocs,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [selectedChunkDoc, setSelectedChunkDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a valid PDF document.");
      return;
    }

    setUploading(true);
    setUploadProgressMsg(`Parsing "${file.name}" & extracting text chunks...`);

    try {
      setTimeout(() => setUploadProgressMsg(`Generating vector embeddings & indexing in database...`), 800);
      const res = await uploadDocument(file);
      await onRefreshDocs();
      if (res.document?.fileName) {
        onSelectDoc(res.document.fileName);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgressMsg("");
    }
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}" and all its vector embeddings?`)) {
      return;
    }
    try {
      await deleteDocument(fileName);
      await onRefreshDocs();
      if (selectedChunkDoc === fileName) {
        setSelectedChunkDoc(null);
        setChunks([]);
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handlePreloadSample = async () => {
    setUploading(true);
    setUploadProgressMsg("Preloading sample Operating System PDF...");
    try {
      await preloadSampleDocument();
      await onRefreshDocs();
    } catch (err) {
      alert(`Preload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgressMsg("");
    }
  };

  const handleViewChunks = async (fileName) => {
    setSelectedChunkDoc(fileName);
    setLoadingChunks(true);
    try {
      const data = await getDocumentChunks(fileName);
      setChunks(data);
    } catch (err) {
      alert(`Could not load chunks: ${err.message}`);
    } finally {
      setLoadingChunks(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
      {/* Upload Drag & Drop Box */}
      <div
        className="glass-card"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          padding: "48px 24px",
          textAlign: "center",
          border: dragActive ? "2px dashed var(--primary)" : "2px dashed var(--border-subtle)",
          background: dragActive ? "rgba(99, 102, 241, 0.08)" : "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.25s ease",
        }}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
            height: "100%",
          }}
        />

        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          background: "var(--primary-gradient)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          boxShadow: "var(--shadow-glow)"
        }}>
          {uploading ? (
            <Loader2 size={32} className="pulse-glow" style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <UploadCloud size={32} />
          )}
        </div>

        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            {uploading ? "Indexing Your Document..." : "Drop your Course PDF or Lecture Slides here"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "6px 0 0 0" }}>
            {uploading ? uploadProgressMsg : "Supports PDF textbooks, research papers, lecture handouts up to 25MB"}
          </p>
        </div>

        {!uploading && (
          <button className="btn-primary" style={{ pointerEvents: "none" }}>
            <span>Browse Files</span>
          </button>
        )}
      </div>

      {/* Preload Sample Action if no docs */}
      {documents.length === 0 && !uploading && (
        <div className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", background: "rgba(99, 102, 241, 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={18} color="var(--primary-light)" />
            <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Want to try right away? Load our pre-indexed <strong>Operating Systems Course Notes</strong>
            </span>
          </div>
          <button onClick={handlePreloadSample} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
            Load Sample PDF
          </button>
        </div>
      )}

      {/* Indexed Documents Library */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FolderOpen size={20} color="var(--primary-light)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              Indexed Document Library ({documents.length})
            </h3>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Stored in MongoDB Vector DB
          </span>
        </div>

        {documents.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>
            No documents indexed yet. Upload a PDF above to get started!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {documents.map((doc) => {
              const isActive = activeDoc === doc.fileName;
              return (
                <div
                  key={doc.fileName}
                  style={{
                    background: isActive ? "rgba(99, 102, 241, 0.12)" : "var(--bg-input)",
                    border: `1px solid ${isActive ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-sm)",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "240px" }}>
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: isActive ? "var(--primary)" : "var(--bg-elevated)",
                      color: isActive ? "#FFF" : "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                          {doc.fileName}
                        </span>
                        {isActive && <span className="badge badge-indigo">Active Study Doc</span>}
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        {doc.chunkCount} Vector Chunks • {doc.preview ? `"${doc.preview.slice(0, 70)}..."` : "Ready for study"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {!isActive && (
                      <button
                        onClick={() => onSelectDoc(doc.fileName)}
                        className="btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleViewChunks(doc.fileName)}
                      className="btn-secondary"
                      title="Inspect extracted chunks"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      <Eye size={14} />
                      <span>Chunks</span>
                    </button>
                    <button
                      onClick={() => handleDelete(doc.fileName)}
                      className="btn-secondary"
                      title="Delete document"
                      style={{ padding: "6px 10px", color: "var(--accent-rose)", borderColor: "rgba(244, 63, 94, 0.3)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chunks Inspector Drawer */}
      {selectedChunkDoc && (
        <div className="glass-card animate-fade-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                Extracted Chunks for "{selectedChunkDoc}" ({chunks.length})
              </h4>
            </div>
            <button
              onClick={() => setSelectedChunkDoc(null)}
              className="btn-secondary"
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            >
              Close
            </button>
          </div>

          {loadingChunks ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto" }}>
              {chunks.map((c, idx) => (
                <div
                  key={c._id || idx}
                  style={{
                    background: "var(--bg-input)",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--primary-light)", fontWeight: 600, marginBottom: "6px" }}>
                    <span>Chunk #{c.chunkIndex || idx + 1}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {c.text ? `${c.text.length} chars` : ""}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
