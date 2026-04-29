"use client";

import Link from "next/link";
import { Brain } from "lucide-react";

interface WorkoutButtonProps {
  isAccessOpen: boolean;
  windowLabel?: string;
}

export default function WorkoutButton({ isAccessOpen, windowLabel }: WorkoutButtonProps) {
  if (!isAccessOpen) {
    return (
      <div style={{
        width: 220, height: 220, borderRadius: 28,
        background: "var(--bg-card)",
        border: "2px dashed var(--border-color)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <Brain size={52} color="var(--text-muted)" strokeWidth={1.5} />
        <div style={{ textAlign: "center", padding: "0 20px" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 700 }}>Brain Workout</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
            Not available right now. Check the schedule.
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href="/workout" style={{ textDecoration: "none" }}>
      <button
        id="btn-math-workout"
        style={{
          width: 220, height: 220, borderRadius: 28,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          boxShadow: "0 10px 30px rgba(99,102,241,0.25), 0 5px 15px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          position: "relative", overflow: "hidden",
        }}
        onMouseEnter={e => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.transform = "scale(1.05) translateY(-4px)";
          btn.style.boxShadow = "0 20px 40px rgba(99,102,241,0.35), 0 10px 20px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={e => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.transform = "scale(1) translateY(0)";
          btn.style.boxShadow = "0 10px 30px rgba(99,102,241,0.25), 0 5px 15px rgba(0,0,0,0.1)";
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <Brain size={64} color="white" strokeWidth={1.5} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "white", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Math Workout
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}>
            Tap to Begin
          </div>
        </div>
      </button>
    </Link>
  );
}
