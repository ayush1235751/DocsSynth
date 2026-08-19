import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  X,
  Radio
} from "lucide-react";
import { fetchSummary } from "../services/api";

export default function AudioStudyBrief({ activeDoc, isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [summaryText, setSummaryText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeDoc) {
      loadText();
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, activeDoc]);

  const loadText = async () => {
    setLoading(true);
    try {
      const text = await fetchSummary({ fileName: activeDoc });
      // Clean markdown for audio
      const clean = text
        .replace(/#+\s+/g, "")
        .replace(/[*_`]/g, "")
        .replace(/---/g, "")
        .replace(/\n+/g, ". ");
      setSummaryText(clean);
    } catch (e) {
      setSummaryText("Unable to generate audio brief for this document.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!("speechSynthesis" in window)) {
      alert("Web Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summaryText || "No text available");
    utterance.rate = speechRate;
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if ("speechSynthesis" in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleRateChange = (rate) => {
    setSpeechRate(rate);
    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "520px",
        width: "100%",
        background: "var(--bg-elevated)",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "var(--shadow-lg)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Radio size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Audio Study Briefing
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                Listen like a podcast while commuting or relaxing
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="btn-secondary"
            style={{ padding: "6px", borderRadius: "50%" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Audio Visualizer Pulse */}
        <div style={{
          height: "90px",
          background: "var(--bg-input)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          overflow: "hidden"
        }}>
          {isPlaying ? (
            [40, 70, 30, 90, 50, 80, 45, 95, 60, 35, 75, 40, 85].map((h, i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: `${h}%`,
                  background: "var(--primary-gradient)",
                  borderRadius: "99px",
                  animation: `pulseGlow ${0.8 + (i % 5) * 0.2}s infinite alternate ease-in-out`
                }}
              />
            ))
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <Volume2 size={18} />
              <span>{loading ? "Preparing audio text..." : isPaused ? "Paused" : "Ready to play briefing"}</span>
            </div>
          )}
        </div>

        {/* Speed Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Playback Speed:</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                style={{
                  background: speechRate === rate ? "var(--primary)" : "var(--bg-input)",
                  color: speechRate === rate ? "#FFF" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <button
            onClick={handleStop}
            className="btn-secondary"
            disabled={!isPlaying && !isPaused}
            title="Stop"
            style={{ padding: "10px", borderRadius: "50%" }}
          >
            <RotateCcw size={18} />
          </button>

          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={loading}
              className="btn-primary"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                padding: 0,
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)"
              }}
            >
              <Play size={24} style={{ marginLeft: "2px" }} />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="btn-primary"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                padding: 0,
                background: "var(--bg-elevated)",
                border: "2px solid var(--primary)",
                color: "var(--primary)"
              }}
            >
              <Pause size={24} />
            </button>
          )}

          <button
            onClick={handleStop}
            className="btn-secondary"
            disabled={!isPlaying && !isPaused}
            title="Mute / Stop"
            style={{ padding: "10px", borderRadius: "50%" }}
          >
            <VolumeX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
