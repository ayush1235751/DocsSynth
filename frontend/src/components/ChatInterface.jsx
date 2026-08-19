import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  Copy,
  Check,
  Volume2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  GraduationCap,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { sendChatMessage } from "../services/api";

const PRESET_PROMPTS = [
  { label: "💡 Explain Core Concepts", prompt: "Explain the core concepts and primary functions of this document in simple terms." },
  { label: "🎯 5 High-Yield Exam Questions", prompt: "Generate 5 likely exam questions based on this document with model answers." },
  { label: "⚡ Real-World Analogy", prompt: "Explain how multiprogramming / process switching works using a fun everyday analogy." },
  { label: "📝 Key Formulas & Terms", prompt: "List all critical definitions, properties, and formulas that students must remember." },
];

export default function ChatInterface({ activeDoc, onSwitchToFlashcards, onSwitchToQuiz }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `### 👋 Welcome to DocsSynth AI Study Assistant!\n\nI have indexed your document **"${activeDoc || "Operating System .pdf"}"** and I am ready to help you master this material.\n\nYou can:\n- Ask **any homework or concept question**\n- Request **analogies, cheat sheets, or step-by-step breakdowns**\n- Click the student prompt chips below to get started instantly!`,
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentMode, setStudentMode] = useState("standard"); // 'standard' | 'simple' | 'exam' | 'deep'
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage({
        message: textToSend.trim(),
        fileName: activeDoc,
        conversationHistory: history,
        studentMode,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        sources: res.sources || [],
        model: res.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ **Study Assistant Notice**: ${err.message || "Could not retrieve answer. Please verify backend connection."}`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    // Clean markdown hashes/asterisks for natural speech
    const cleanText = text.replace(/[#*`_\[\]()]/g, " ").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSourceExpand = (messageId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: `### 🔄 Chat cleared!\n\nReady for your next study questions on **"${activeDoc || "your document"}"**.`,
        sources: [],
      },
    ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: "600px", gap: "16px" }}>
      {/* Learning Mode Bar & Quick Actions */}
      <div className="glass-card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GraduationCap size={18} color="var(--primary-light)" />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Study Mode:</span>
          
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-input)", padding: "3px", borderRadius: "var(--radius-sm)" }}>
            {[
              { id: "standard", label: "Standard" },
              { id: "simple", label: "ELI5 (Simple)" },
              { id: "exam", label: "Exam Prep" },
              { id: "deep", label: "Deep Dive" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setStudentMode(mode.id)}
                style={{
                  background: studentMode === mode.id ? "var(--primary)" : "transparent",
                  color: studentMode === mode.id ? "#FFFFFF" : "var(--text-secondary)",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={clearChat}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            title="Clear Chat History"
          >
            <RefreshCw size={14} />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="animate-fade-in"
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
              maxWidth: msg.role === "user" ? "80%" : "90%",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: msg.role === "user" ? "var(--primary-gradient)" : "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#FFF",
              }}
            >
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} color="#818CF8" />}
            </div>

            {/* Message Bubble */}
            <div
              style={{
                background: msg.role === "user" ? "var(--primary)" : "var(--bg-elevated)",
                color: msg.role === "user" ? "#FFFFFF" : "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                borderTopRightRadius: msg.role === "user" ? "4px" : "var(--radius-md)",
                borderTopLeftRadius: msg.role === "assistant" ? "4px" : "var(--radius-md)",
                padding: "16px 20px",
                boxShadow: "var(--shadow-sm)",
                fontSize: "0.95rem",
                wordBreak: "break-word",
              }}
            >
              <div className="markdown-body">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Citations / Sources Accordion */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                  <button
                    onClick={() => toggleSourceExpand(msg.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-cyan)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <BookOpen size={14} />
                    <span>{msg.sources.length} Document Citations</span>
                    {expandedSources[msg.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expandedSources[msg.id] && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            background: "var(--bg-input)",
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.8rem",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "var(--primary-light)", fontWeight: 600 }}>
                            <span>Chunk #{src.chunkIndex || sIdx + 1} ({src.fileName})</span>
                            <span>Match: {((src.score || 0.8) * 100).toFixed(0)}%</span>
                          </div>
                          <p style={{ color: "var(--text-secondary)", margin: 0, fontStyle: "italic", fontSize: "0.78rem" }}>
                            "{src.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                  <button
                    onClick={() => handleSpeak(msg.content)}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
                    title="Read Aloud"
                  >
                    <Volume2 size={14} />
                    <span>Listen</span>
                  </button>
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
                    title="Copy to clipboard"
                  >
                    {copiedId === msg.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="animate-fade-in" style={{ display: "flex", gap: "14px", alignItems: "center", alignSelf: "flex-start" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818CF8" }}>
              <Bot size={18} />
            </div>
            <div style={{ background: "var(--bg-elevated)", padding: "12px 18px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "8px", border: "1px solid var(--border-subtle)" }}>
              <Loader2 size={16} className="pulse-glow" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Synthesizing answer from document chunks...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.prompt)}
            className="btn-secondary"
            disabled={loading}
            style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap", borderRadius: "var(--radius-full)" }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="glass-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={`Ask anything about "${activeDoc || "your document"}"...`}
          disabled={loading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            outline: "none",
            fontFamily: "var(--font-main)",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: "9px 18px", borderRadius: "var(--radius-sm)" }}
        >
          {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
}
