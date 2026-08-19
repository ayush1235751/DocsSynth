import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Clock,
  Award,
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchQuiz } from "../services/api";

export default function QuizMode({ activeDoc }) {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const loadQuiz = async () => {
    setLoading(true);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);

    try {
      const data = await fetchQuiz({ fileName: activeDoc, count: 5, difficulty });
      setQuestions(data);
    } catch (err) {
      console.error("Quiz load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [activeDoc, difficulty]);

  // Quiz timer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isSubmitted]);

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    setIsTimerRunning(false);

    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });

    const scorePct = (correct / questions.length) * 100;
    if (scorePct >= 75) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentQIndex];

  // Calculate final score
  let correctCount = 0;
  if (isSubmitted) {
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
  }
  const scorePercent = questions.length > 0 ? ((correctCount / questions.length) * 100).toFixed(0) : 0;

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <Loader2 size={36} className="pulse-glow" style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
        <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Generating Exam Mock Test...</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Formulating multiple-choice questions with answer explanations</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>No quiz questions available for this document.</p>
        <button onClick={loadQuiz} className="btn-primary" style={{ marginTop: "16px" }}>
          Generate Mock Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "840px", margin: "0 auto", width: "100%" }}>
      {/* Top Header & Difficulty Selector */}
      <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HelpCircle size={20} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Exam Practice & Mock Quiz</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              Test your knowledge and get instant explanations
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-input)", padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.85rem", fontWeight: 600 }}>
            <Clock size={15} color="var(--primary-light)" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Difficulty */}
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-input)", padding: "3px", borderRadius: "var(--radius-sm)" }}>
            {["Easy", "Medium", "Hard"].map((lvl) => (
              <button
                key={lvl}
                disabled={isSubmitted}
                onClick={() => setDifficulty(lvl)}
                style={{
                  background: difficulty === lvl ? "var(--primary)" : "transparent",
                  color: difficulty === lvl ? "#FFFFFF" : "var(--text-secondary)",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button onClick={loadQuiz} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scorecard Results Banner when Submitted */}
      {isSubmitted && (
        <div className="glass-card animate-fade-in" style={{ padding: "24px", background: scorePercent >= 70 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", border: `1px solid ${scorePercent >= 70 ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: scorePercent >= 70 ? "#10B981" : "#F59E0B", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trophy size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                Score: {correctCount} / {questions.length} ({scorePercent}%)
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                {scorePercent >= 80 ? "🌟 Outstanding Mastery! Ready for the exam." : scorePercent >= 60 ? "👍 Good effort! Review the missed questions below." : "📚 Keep practicing! Check the explanations to master the concepts."}
              </p>
            </div>
          </div>
          <button onClick={loadQuiz} className="btn-primary">
            Retake Quiz
          </button>
        </div>
      )}

      {/* Question Selector Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {questions.map((q, idx) => {
          const isAnswered = selectedAnswers[idx] !== undefined;
          const isCorrect = isSubmitted && selectedAnswers[idx] === q.correctIndex;
          const isWrong = isSubmitted && isAnswered && selectedAnswers[idx] !== q.correctIndex;

          let btnBg = "var(--bg-card)";
          let btnBorder = "var(--border-subtle)";
          let btnColor = "var(--text-primary)";

          if (currentQIndex === idx) {
            btnBorder = "var(--primary-light)";
            btnBg = "rgba(99, 102, 241, 0.2)";
          }
          if (isSubmitted) {
            if (isCorrect) {
              btnBg = "rgba(16, 185, 129, 0.25)";
              btnBorder = "#10B981";
              btnColor = "#10B981";
            } else if (isWrong) {
              btnBg = "rgba(244, 63, 94, 0.25)";
              btnBorder = "#F43F5E";
              btnColor = "#F43F5E";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => setCurrentQIndex(idx)}
              style={{
                background: btnBg,
                border: `1px solid ${btnBorder}`,
                color: btnColor,
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <span>Q{idx + 1}</span>
              {isSubmitted && (isCorrect ? <CheckCircle2 size={14} color="#10B981" /> : isWrong ? <XCircle size={14} color="#F43F5E" /> : null)}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      {currentQ && (
        <div className="glass-card animate-fade-in" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top metadata */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="badge badge-indigo">{currentQ.topic || "Core Subject"}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Question {currentQIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.5, color: "var(--text-primary)" }}>
            {currentQ.question}
          </h3>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQIndex] === optIdx;
              const isCorrectOpt = isSubmitted && optIdx === currentQ.correctIndex;
              const isWrongSelected = isSubmitted && isSelected && optIdx !== currentQ.correctIndex;

              let optionBg = "var(--bg-input)";
              let optionBorder = "var(--border-subtle)";
              let optionColor = "var(--text-primary)";

              if (isSelected && !isSubmitted) {
                optionBg = "rgba(99, 102, 241, 0.15)";
                optionBorder = "var(--primary-light)";
                optionColor = "var(--primary-light)";
              }

              if (isSubmitted) {
                if (isCorrectOpt) {
                  optionBg = "rgba(16, 185, 129, 0.18)";
                  optionBorder = "#10B981";
                  optionColor = "#34D399";
                } else if (isWrongSelected) {
                  optionBg = "rgba(244, 63, 94, 0.18)";
                  optionBorder = "#F43F5E";
                  optionColor = "#FB7185";
                }
              }

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQIndex, optIdx)}
                  style={{
                    background: optionBg,
                    border: `1px solid ${optionBorder}`,
                    color: optionColor,
                    padding: "14px 18px",
                    borderRadius: "var(--radius-sm)",
                    cursor: isSubmitted ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: isSelected || isCorrectOpt ? 600 : 500,
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{opt}</span>
                  {isSubmitted && isCorrectOpt && <CheckCircle2 size={18} color="#10B981" />}
                  {isSubmitted && isWrongSelected && <XCircle size={18} color="#F43F5E" />}
                </div>
              );
            })}
          </div>

          {/* Explanation Box when submitted */}
          {isSubmitted && currentQ.explanation && (
            <div style={{ background: "var(--bg-elevated)", padding: "16px 18px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--primary)", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary-light)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>
                <Sparkles size={16} />
                <span>Concept Explanation & Takeaway:</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom navigation & Submit */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", marginTop: "10px" }}>
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="btn-secondary"
            >
              Previous Question
            </button>

            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="btn-secondary"
              >
                <span>Next Question</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              !isSubmitted && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                >
                  <Award size={18} />
                  <span>Submit Exam</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
