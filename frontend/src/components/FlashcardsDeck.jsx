import React, { useState, useEffect } from "react";
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  Shuffle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Trophy,
  Volume2
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchFlashcards } from "../services/api";

export default function FlashcardsDeck({ activeDoc, onUpdateMastery }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [reviewIds, setReviewIds] = useState(new Set());
  const [cardCount, setCardCount] = useState(6);

  const loadCards = async () => {
    setLoading(true);
    setIsFlipped(false);
    try {
      const data = await fetchFlashcards({ fileName: activeDoc, count: cardCount });
      setCards(data);
      setCurrentIndex(0);
      setMasteredIds(new Set());
      setReviewIds(new Set());
    } catch (err) {
      console.error("Flashcards load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [activeDoc, cardCount]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || cards.length === 0) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards.length, loading]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  };

  const handleMarkMastered = (cardId) => {
    const nextMastered = new Set(masteredIds);
    nextMastered.add(cardId);
    setMasteredIds(nextMastered);

    const nextReview = new Set(reviewIds);
    nextReview.delete(cardId);
    setReviewIds(nextReview);

    if (onUpdateMastery) {
      onUpdateMastery(nextMastered.size);
    }

    if (nextMastered.size === cards.length) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    handleNext();
  };

  const handleMarkReview = (cardId) => {
    const nextReview = new Set(reviewIds);
    nextReview.add(cardId);
    setReviewIds(nextReview);

    const nextMastered = new Set(masteredIds);
    nextMastered.delete(cardId);
    setMasteredIds(nextMastered);

    handleNext();
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isAllMastered = cards.length > 0 && masteredIds.size === cards.length;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <Loader2 size={36} className="pulse-glow" style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
        <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Generating Active Recall Flashcards...</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Extracting high-yield exam concepts from "{activeDoc || "document"}"</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>No flashcards generated yet for this document.</p>
        <button onClick={loadCards} className="btn-primary" style={{ marginTop: "16px" }}>
          Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      {/* Top Header & Controls */}
      <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Layers size={20} color="var(--primary-light)" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Active Recall Flashcards</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              Space to flip • Left/Right arrows to navigate
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={handleShuffle} className="btn-secondary" title="Shuffle Deck" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <Shuffle size={14} />
            <span>Shuffle</span>
          </button>
          <button onClick={loadCards} className="btn-secondary" title="Regenerate Flashcards" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <RotateCw size={14} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>
            <span style={{ color: "#10B981", fontWeight: 700 }}>{masteredIds.size} Mastered</span> •{" "}
            <span style={{ color: "#F59E0B", fontWeight: 700 }}>{reviewIds.size} In Review</span>
          </span>
        </div>
        <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "var(--primary-gradient)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* 3D Flashcard Deck Container */}
      <div className="perspective-1000" style={{ width: "100%", height: "360px" }}>
        <div
          className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of Card */}
          <div
            className="flip-card-front glass-card"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
          >
            {/* Top row: Topic & Difficulty */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-indigo">{currentCard?.topic || "Core Concept"}</span>
              <span className={`badge ${currentCard?.difficulty === "Hard" ? "badge-amber" : "badge-cyan"}`}>
                {currentCard?.difficulty || "Medium"}
              </span>
            </div>

            {/* Middle: Question */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 20px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--primary-light)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "8px" }}>
                Question
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>
                {currentCard?.question}
              </h3>
            </div>

            {/* Bottom: Click to reveal hint */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(currentCard?.question);
                }}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Volume2 size={15} />
                <span>Listen</span>
              </button>
              <span>Click or press Space to reveal answer ➔</span>
            </div>
          </div>

          {/* Back of Card */}
          <div
            className="flip-card-back glass-card"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "var(--shadow-glow)",
              cursor: "pointer",
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge badge-emerald">Answer & Key Takeaways</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Click to flip back</span>
            </div>

            {/* Middle: Answer content */}
            <div style={{ overflowY: "auto", padding: "10px 10px", textAlign: "left" }}>
              <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.6, marginBottom: "12px" }}>
                {currentCard?.answer}
              </p>
              {currentCard?.keyPoints && currentCard.keyPoints.length > 0 && (
                <div style={{ background: "var(--bg-input)", padding: "10px 14px", borderRadius: "var(--radius-sm)", marginTop: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-light)", textTransform: "uppercase" }}>Exam Memory Points:</span>
                  <ul style={{ margin: "4px 0 0 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {currentCard.keyPoints.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(currentCard?.answer);
                }}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
              >
                <Volume2 size={15} />
                <span>Listen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation and Mastery Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="btn-secondary"
          style={{ padding: "10px 16px" }}
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleMarkReview(currentCard?.id || currentIndex)}
            className="btn-secondary"
            style={{ borderColor: "rgba(245, 158, 11, 0.4)", color: "#F59E0B" }}
          >
            <XCircle size={18} />
            <span>Still Learning</span>
          </button>

          <button
            onClick={() => handleMarkMastered(currentCard?.id || currentIndex)}
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)" }}
          >
            <CheckCircle2 size={18} />
            <span>Mastered!</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="btn-secondary"
          style={{ padding: "10px 16px" }}
        >
          <span>Next</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Celebration Banner when all cards are mastered */}
      {isAllMastered && (
        <div className="glass-card animate-fade-in" style={{ padding: "20px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", textAlign: "center" }}>
          <Trophy size={32} color="#10B981" style={{ margin: "0 auto 8px auto" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10B981" }}>Congratulations! All Cards Mastered!</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            You have successfully reviewed every active recall flashcard in this deck.
          </p>
          <button onClick={loadCards} className="btn-primary" style={{ marginTop: "12px" }}>
            Start New Round
          </button>
        </div>
      )}
    </div>
  );
}
