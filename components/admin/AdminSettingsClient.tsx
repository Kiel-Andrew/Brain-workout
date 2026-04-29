"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Clock, Timer, ToggleLeft, ToggleRight, Save } from "lucide-react";

type SystemSettings = {
  id: number;
  is_workout_open: boolean;
  start_time: string | null;
  end_time: string | null;
  timer_duration_seconds: number;
};

// Preset templates
const PRESETS = [
  { label: "PITX – 5 min", seconds: 300 },
  { label: "Express – 3 min", seconds: 180 },
  { label: "Standard – 10 min", seconds: 600 },
  { label: "Extended – 15 min", seconds: 900 },
];

export default function AdminSettingsClient({ settings: initial }: { settings: SystemSettings }) {
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(initial.is_workout_open);
  const [startTime, setStartTime] = useState(initial.start_time ?? "08:00");
  const [endTime, setEndTime] = useState(initial.end_time ?? "17:00");
  const [timerMins, setTimerMins] = useState(Math.floor((initial.timer_duration_seconds ?? 300) / 60));
  const [saving, setSaving] = useState(false);

  async function saveSettings() {
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .upsert({
        id: 1,
        is_workout_open: isOpen,
        start_time: startTime,
        end_time: endTime,
        timer_duration_seconds: timerMins * 60,
      });
    if (error) toast.error(error.message);
    else toast.success("Settings saved!");
    setSaving(false);
  }

  async function toggleWorkoutOpen() {
    const newVal = !isOpen;
    setIsOpen(newVal);
    const { error } = await supabase
      .from("system_settings")
      .update({ is_workout_open: newVal })
      .eq("id", 1);
    if (error) { toast.error(error.message); setIsOpen(!newVal); return; }
    toast.success(`Workout ${newVal ? "opened" : "closed"}`);
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    color: "var(--text-primary)",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    width: "100%",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

      {/* ── Access Control ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Clock size={18} color="#6366f1" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Access Control</h2>
          </div>

          {/* Master toggle */}
          <div className="glass-card" style={{
            padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20,
            borderColor: isOpen ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
          }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Workout Status</div>
              <div style={{ color: isOpen ? "#10b981" : "#ef4444", fontSize: 13, marginTop: 2 }}>
                {isOpen ? "✓ Currently Open" : "✗ Currently Closed"}
              </div>
            </div>
            <button
              id="btn-toggle-workout"
              onClick={toggleWorkoutOpen}
              style={{ background: "none", border: "none", cursor: "pointer", color: isOpen ? "#10b981" : "#ef4444" }}
            >
              {isOpen ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>

          {/* Time window */}
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 14 }}>
            Set the daily time window when trainees can access the workout.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Time</label>
              <input id="input-start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>End Time</label>
              <input id="input-end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ padding: "12px", borderRadius: 10, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)", display: "flex", gap: 10 }}>
            <div style={{ color: "var(--accent-primary)", marginTop: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>
              <strong>Scope:</strong> These restrictions only apply to the <strong>Math Workout</strong> session. The rest of the application remains accessible at all times.
            </p>
          </div>
        </div>
      </div>

      {/* ── Timer Configuration ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Timer size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Timer Duration</h2>
          </div>

          {/* Manual input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Duration (minutes)
            </label>
            <input
              id="input-timer-mins"
              type="number"
              min={1}
              max={60}
              value={timerMins}
              onChange={e => setTimerMins(parseInt(e.target.value) || 5)}
              style={inputStyle}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              = {timerMins * 60} seconds per workout session
            </p>
          </div>

          {/* Preset templates */}
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Quick Presets
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  id={`preset-${p.label.replace(/\s+/g, "-")}`}
                  onClick={() => setTimerMins(p.seconds / 60)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: timerMins === p.seconds / 60 ? "1px solid rgba(139,92,246,0.5)" : "1px solid var(--border-color)",
                    background: timerMins === p.seconds / 60 ? "rgba(139,92,246,0.15)" : "rgba(0,0,0,0.02)",
                    color: timerMins === p.seconds / 60 ? "#8b5cf6" : "var(--text-secondary)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save button — spans full width */}
      <div style={{ gridColumn: "1 / -1" }}>
        <button
          id="btn-save-settings"
          onClick={saveSettings}
          disabled={saving}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, padding: "14px 28px" }}
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
