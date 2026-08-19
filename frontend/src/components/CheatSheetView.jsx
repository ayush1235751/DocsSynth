import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Zap,
  Download,
  Copy,
  Check,
  RotateCw,
  Printer,
  Volume2,
  Loader2,
  BookMarked
} from "lucide-react";
import { fetchSummary, fetchCheatSheet } from "../services/api";

export default function CheatSheetView({ activeDoc }) {
  const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'cheatsheet'
  const [summaryContent, setSummaryContent] = useState("");
  const [cheatSheetContent, setCheatSheetContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (activeTab === "summary") {
        const text = await fetchSummary({ fileName: activeDoc });
        setSummaryContent(text);
      } else {
        const text = await fetchCheatSheet({ fileName: activeDoc });
        setCheatSheetContent(text);
      }
    } catch (err) {
      console.error("Notes load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeDoc, activeTab]);

  const activeContent = activeTab === "summary" ? summaryContent : cheatSheetContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${(activeDoc || "DocsSynth_Notes").replace(/\.pdf$/i, "")}_${activeTab}.md`;
    const blob = new Blob([activeContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = activeContent.replace(/[#*`_\[\]()|:-]/g, " ").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      {/* Top Header Bar */}
      <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-input)", padding: "4px", borderRadius: "var(--radius-sm)" }}>
            <button
              onClick={() => setActiveTab("summary")}
              style={{
                background: activeTab === "summary" ? "var(--primary)" : "transparent",
                color: activeTab === "summary" ? "#FFF" : "var(--text-secondary)",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              <FileText size={16} />
              <span>Full Study Guide</span>
            </button>

            <button
              onClick={() => setActiveTab("cheatsheet")}
              style={{
                background: activeTab === "cheatsheet" ? "var(--primary)" : "transparent",
                color: activeTab === "cheatsheet" ? "#FFF" : "var(--text-secondary)",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              <Zap size={16} />
              <span>Rapid Cheat Sheet</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={handleSpeak} className="btn-secondary" title="Listen with Text-to-Speech" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <Volume2 size={15} />
            <span>Listen</span>
          </button>
          <button onClick={handleCopy} className="btn-secondary" title="Copy to clipboard" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            {copied ? <Check size={15} color="#10B981" /> : <Copy size={15} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button onClick={handleDownload} className="btn-secondary" title="Download Markdown" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <Download size={15} />
            <span>Export .md</span>
          </button>
          <button onClick={handlePrint} className="btn-secondary" title="Print Notes" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button onClick={loadContent} className="btn-secondary" title="Regenerate Synthesis" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-card animate-fade-in" style={{ padding: "32px", minHeight: "500px" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <Loader2 size={36} className="pulse-glow" style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Synthesizing Comprehensive Study Notes...</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Extracting formulas, definitions, workflows, and core learning goals</p>
          </div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{activeContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
