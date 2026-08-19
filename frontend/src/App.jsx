import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ChatInterface from "./components/ChatInterface";
import FlashcardsDeck from "./components/FlashcardsDeck";
import QuizMode from "./components/QuizMode";
import CheatSheetView from "./components/CheatSheetView";
import DocumentUpload from "./components/DocumentUpload";
import AudioStudyBrief from "./components/AudioStudyBrief";
import {
  MessageSquare,
  Layers,
  HelpCircle,
  FileText,
  UploadCloud,
  Sparkles,
  Flame,
  CheckCircle2,
  BookOpen,
  Zap,
  Target
} from "lucide-react";
import { getDocuments, checkBackendHealth } from "./services/api";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState("");
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'flashcards' | 'quiz' | 'notes' | 'upload'
  const [theme, setTheme] = useState(() => localStorage.getItem("docssynth_theme") || "dark");
  const [backendStatus, setBackendStatus] = useState({ status: "checking" });
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const [studyStats, setStudyStats] = useState(() => {
    const saved = localStorage.getItem("docssynth_stats");
    return saved ? JSON.parse(saved) : { streakDays: 4, masteredCount: 8, quizScoreAvg: "92%" };
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("docssynth_theme", theme);
  }, [theme]);

  // Load backend status and documents
  const loadInitialData = async () => {
    const health = await checkBackendHealth();
    setBackendStatus(health);

    try {
      const docs = await getDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !activeDoc) {
        setActiveDoc(docs[0].fileName);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleUpdateMastery = (count) => {
    setStudyStats((prev) => {
      const updated = { ...prev, masteredCount: (prev.masteredCount || 0) + 1 };
      localStorage.setItem("docssynth_stats", JSON.stringify(updated));
      return updated;
    });
  };

  const tabs = [
    { id: "chat", label: "AI Study Chat", icon: MessageSquare, badge: "RAG" },
    { id: "flashcards", label: "Active Recall Flashcards", icon: Layers, badge: "3D Deck" },
    { id: "quiz", label: "Exam Mock Quiz", icon: HelpCircle, badge: "Test Mode" },
    { id: "notes", label: "Smart Notes & Cheat Sheet", icon: FileText, badge: "Exportable" },
    { id: "upload", label: "Document Library", icon: UploadCloud, count: documents.length },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Header */}
      <Navbar
        documents={documents}
        activeDoc={activeDoc}
        onSelectDoc={setActiveDoc}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        studyStats={studyStats}
        backendStatus={backendStatus}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
      />

      {/* Main Content Hub Container */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px", width: "100%", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Student Study Motivation Banner */}
        <div className="glass-card" style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(6, 182, 212, 0.08) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "var(--primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)"
            }}>
              <Target size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Active Course: <span style={{ color: "var(--primary-light)" }}>{activeDoc ? activeDoc.replace(/\.pdf$/i, "") : "Operating System"}</span>
              </h1>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                AI-Powered Document Synthesis • Active Recall • Exam Readiness
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Flame size={18} color="#F59E0B" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Study Streak</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F59E0B" }}>{studyStats.streakDays} Days 🔥</div>
              </div>
            </div>

            <div style={{ width: "1px", height: "28px", background: "var(--border-subtle)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={18} color="#10B981" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Cards Mastered</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#10B981" }}>{studyStats.masteredCount} Concepts</div>
              </div>
            </div>

            <div style={{ width: "1px", height: "28px", background: "var(--border-subtle)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={18} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Library</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-cyan)" }}>{documents.length} Documents</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs Bar */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "8px",
          overflowX: "auto",
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? "var(--primary)" : "var(--bg-card)",
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--primary)" : "var(--border-subtle)"}`,
                  padding: "10px 18px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none",
                }}
              >
                <Icon size={17} color={isActive ? "#FFFFFF" : "var(--primary-light)"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "var(--bg-input)",
                      color: isActive ? "#FFFFFF" : "var(--primary-light)",
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span
                    style={{
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "var(--bg-input)",
                      color: isActive ? "#FFFFFF" : "var(--text-muted)",
                      fontSize: "0.75rem",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        <div style={{ flex: 1 }}>
          {activeTab === "chat" && (
            <ChatInterface
              activeDoc={activeDoc}
              onSwitchToFlashcards={() => setActiveTab("flashcards")}
              onSwitchToQuiz={() => setActiveTab("quiz")}
            />
          )}

          {activeTab === "flashcards" && (
            <FlashcardsDeck
              activeDoc={activeDoc}
              onUpdateMastery={handleUpdateMastery}
            />
          )}

          {activeTab === "quiz" && (
            <QuizMode
              activeDoc={activeDoc}
            />
          )}

          {activeTab === "notes" && (
            <CheatSheetView
              activeDoc={activeDoc}
            />
          )}

          {activeTab === "upload" && (
            <DocumentUpload
              documents={documents}
              activeDoc={activeDoc}
              onSelectDoc={(name) => {
                setActiveDoc(name);
                setActiveTab("chat");
              }}
              onRefreshDocs={loadInitialData}
            />
          )}
        </div>
      </main>

      {/* Spoken Audio Study Briefing Modal */}
      <AudioStudyBrief
        activeDoc={activeDoc}
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </div>
  );
}
