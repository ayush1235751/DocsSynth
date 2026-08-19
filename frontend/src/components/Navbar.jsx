import React from "react";
import {
  Sparkles,
  BookOpen,
  Flame,
  Moon,
  Sun,
  Layers,
  CheckCircle2,
  AlertCircle,
  Volume2
} from "lucide-react";

export default function Navbar({
  documents = [],
  activeDoc,
  onSelectDoc,
  theme,
  onToggleTheme,
  studyStats,
  backendStatus,
  onOpenAudioModal,
}) {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      backgroundColor: "var(--bg-card)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "12px 24px",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--primary-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)",
            color: "#FFF"
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                letterSpacing: "-0.02em",
                background: "var(--primary-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                DocsSynth
              </span>
              <span className="badge badge-indigo">Student AI</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              AI Document Intelligence & Study Assistant
            </p>
          </div>
        </div>

        {/* Active Document Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-input)",
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)"
          }}>
            <BookOpen size={16} color="var(--primary-light)" />
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Active Doc:</span>
            <select
              value={activeDoc || ""}
              onChange={(e) => onSelectDoc(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                maxWidth: "200px",
                textOverflow: "ellipsis"
              }}
            >
              {documents.length === 0 && <option value="">No documents uploaded</option>}
              {documents.map((doc) => (
                <option key={doc.fileName} value={doc.fileName} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                  {doc.fileName} ({doc.chunkCount} chunks)
                </option>
              ))}
            </select>
          </div>

          {/* Audio Study Brief Button */}
          <button
            onClick={onOpenAudioModal}
            className="btn-secondary"
            title="Listen to synthesized audio summary"
            style={{ padding: "7px 12px", fontSize: "0.82rem" }}
          >
            <Volume2 size={16} color="var(--accent-cyan)" />
            <span>Audio Study</span>
          </button>
        </div>

        {/* Right Section: Gamification & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Study Streak */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(245, 158, 11, 0.12)",
            padding: "5px 10px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(245, 158, 11, 0.25)"
          }}>
            <Flame size={16} color="#F59E0B" />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F59E0B" }}>
              {studyStats.streakDays || 3} Day Streak
            </span>
          </div>

          {/* Cards Mastered */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(16, 185, 129, 0.12)",
            padding: "5px 10px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(16, 185, 129, 0.25)"
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10B981" }}>
              {studyStats.masteredCount || 0} Mastered
            </span>
          </div>

          {/* Server Connection Status */}
          <div
            title={backendStatus.status === "ok" ? "Backend connected and ready" : "Backend offline"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "var(--text-muted)"
            }}
          >
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: backendStatus.status === "ok" ? "#10B981" : "#EF4444",
              boxShadow: backendStatus.status === "ok" ? "0 0 8px #10B981" : "0 0 8px #EF4444"
            }} />
            <span style={{ fontSize: "0.75rem" }}>
              {backendStatus.status === "ok" ? "Online" : "Offline"}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
          </button>
        </div>
      </div>
    </header>
  );
}
