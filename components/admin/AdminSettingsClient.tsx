"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Clock, Timer, ToggleLeft, ToggleRight, Save, Layers, PlusCircle, Trash2 } from "lucide-react";

type SystemSettings = {
  id: number;
  is_workout_open: boolean;
  start_time: string | null;
  end_time: string | null;
  timer_duration_seconds: number;
};

type BatchSchedule = {
  batch_number: string;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
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

  // Global settings state
  const [isOpen, setIsOpen] = useState(initial.is_workout_open);
  const [startTime, setStartTime] = useState(initial.start_time ?? "08:00");
  const [endTime, setEndTime] = useState(initial.end_time ?? "17:00");
  const [timerMins, setTimerMins] = useState(Math.floor((initial.timer_duration_seconds ?? 300) / 60));
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // Batch and Saving state
  const [batchSchedules, setBatchSchedules] = useState<BatchSchedule[]>([]);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBatchSchedules();
    fetchAvailableBatches();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const remaining = availableBatches.filter(b => !batchSchedules.some(s => s.batch_number === b));
      if (remaining.length > 0) {
        setNewBatchName(remaining[0]);
      }
    }
  }, [isModalOpen, availableBatches, batchSchedules]);

  async function fetchAvailableBatches() {
    // Fetch unique batch numbers from users table
    const { data, error } = await supabase
      .from("users")
      .select("batch_number");
    
    if (error) {
      toast.error("Could not load batches from users");
    } else {
      // Get unique non-null batch numbers
      const uniqueBatches = Array.from(new Set(
        data
          .map(u => u.batch_number)
          .filter(b => b !== null && b !== "")
      )) as string[];
      setAvailableBatches(uniqueBatches.sort());
    }
  }

  async function fetchBatchSchedules() {
    const { data, error } = await supabase
      .from("batch_schedules")
      .select("*")
      .order("batch_number", { ascending: true });
    
    if (error) {
      toast.error("Could not load batch schedules");
    } else {
      setBatchSchedules(data || []);
    }
  }

  function handleAddSchedule() {
    if (!newBatchName.trim()) {
      toast.error("Please enter a batch name");
      return;
    }

    // Check if batch name already exists
    if (batchSchedules.some(b => b.batch_number.toLowerCase() === newBatchName.toLowerCase())) {
      toast.error("A schedule for this batch already exists");
      return;
    }

    const newBatch: BatchSchedule = {
      batch_number: newBatchName,
      is_open: true,
      start_time: newStart,
      end_time: newEnd
    };

    setBatchSchedules([...batchSchedules, newBatch]);
    setIsModalOpen(false);
    setNewBatchName("");
    toast.success(`Schedule for ${newBatchName} added`);
  }

  async function removeBatch(batchNum: string) {
    const { error } = await supabase
      .from("batch_schedules")
      .delete()
      .eq("batch_number", batchNum);
    
    if (error) {
      toast.error(error.message);
    } else {
      setBatchSchedules(prev => prev.filter(b => b.batch_number !== batchNum));
      toast.success(`Schedule for ${batchNum} removed`);
    }
  }

  async function saveSettings() {
    setSaving(true);
    
    // 1. Save global settings
    const { error: globalError } = await supabase
      .from("system_settings")
      .upsert({
        id: 1,
        is_workout_open: isOpen,
        start_time: startTime,
        end_time: endTime,
        timer_duration_seconds: timerMins * 60,
      });

    if (globalError) {
      toast.error(`Global Settings: ${globalError.message}`);
      setSaving(false);
      return;
    }

    // 2. Save batch schedules (upsert all)
    if (batchSchedules.length > 0) {
      const { error: batchError } = await supabase
        .from("batch_schedules")
        .upsert(batchSchedules, { onConflict: 'batch_number' });
      
      if (batchError) {
        toast.error(`Batch Schedules: ${batchError.message}`);
        setSaving(false);
        return;
      }
    }

    toast.success("All settings saved successfully!");
    setSaving(false);
  }

  const updateBatch = (batchNum: string, updates: Partial<BatchSchedule>) => {
    setBatchSchedules(prev => prev.map(b => 
      b.batch_number === batchNum ? { ...b, ...updates } : b
    ));
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    color: "var(--text-primary)",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    width: "100%",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

      {/* ── Global Access Control ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Clock size={18} color="#6366f1" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Global Access Control</h2>
          </div>

          <div className="glass-card" style={{
            padding: "16px 18px",
            display: "flex", alignItems: "center", justifySelf: "stretch", justifyContent: "space-between",
            marginBottom: 20,
            borderColor: isOpen ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
          }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Global Workout Status</div>
              <div style={{ color: isOpen ? "#10b981" : "#ef4444", fontSize: 13, marginTop: 2 }}>
                {isOpen ? "✓ System Open" : "✗ System Closed"}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: isOpen ? "#10b981" : "#ef4444" }}
            >
              {isOpen ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Global Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Global End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>
          
          <div style={{ padding: "12px", borderRadius: 10, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)", display: "flex", gap: 10 }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>
              <strong>Note:</strong> Global settings apply to any user who doesn't have a specific batch schedule assigned.
            </p>
          </div>
        </div>

        {/* ── Timer Configuration ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Timer size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Timer Duration</h2>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Duration (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={timerMins}
              onChange={e => setTimerMins(parseInt(e.target.value) || 5)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setTimerMins(p.seconds / 60)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: timerMins === p.seconds / 60 ? "1px solid rgba(139,92,246,0.5)" : "1px solid var(--border-color)",
                  background: timerMins === p.seconds / 60 ? "rgba(139,92,246,0.15)" : "rgba(0,0,0,0.02)",
                  color: timerMins === p.seconds / 60 ? "#8b5cf6" : "var(--text-secondary)",
                  fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trainees Specific Schedule ── */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Layers size={18} color="#10b981" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Trainees Specific Schedule</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s"
            }}
          >
            <PlusCircle size={14} />
            Add Schedule
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {batchSchedules.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              border: "2px dashed var(--border-color)",
              borderRadius: 16,
              color: "var(--text-muted)" 
            }}>
              <Layers size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No trainee schedules found.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Click "Add Schedule" to create one.</p>
            </div>
          ) : batchSchedules.map(b => (
            <div key={b.batch_number} style={{ 
              padding: "16px", 
              borderRadius: 12, 
              background: "rgba(0,0,0,0.02)", 
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "relative"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>Batch {b.batch_number}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => updateBatch(b.batch_number, { is_open: !b.is_open })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: b.is_open ? "#10b981" : "rgba(0,0,0,0.2)" }}
                  >
                    {b.is_open ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                  <button
                    onClick={() => removeBatch(b.batch_number)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", opacity: 0.5 }}
                    title="Remove Schedule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Start</label>
                  <input 
                    type="time" 
                    value={b.start_time || "08:00"} 
                    onChange={e => updateBatch(b.batch_number, { start_time: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase" }}>End</label>
                  <input 
                    type="time" 
                    value={b.end_time || "17:00"} 
                    onChange={e => updateBatch(b.batch_number, { end_time: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Schedule Modal ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          padding: 20
        }}>
          <div className="glass-card animate-scale-in" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 24 }}>Add Trainee Schedule</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
              <div>
                <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Select Batch</label>
                {availableBatches.filter(b => !batchSchedules.some(s => s.batch_number === b)).length > 0 ? (
                  <select
                    value={newBatchName}
                    onChange={e => setNewBatchName(e.target.value)}
                    style={{ ...inputStyle, padding: "12px 14px", fontSize: 14, cursor: "pointer" }}
                  >
                    <option value="" disabled>Select a batch...</option>
                    {availableBatches
                      .filter(b => !batchSchedules.some(s => s.batch_number === b))
                      .map(b => (
                        <option key={b} value={b}>Batch {b}</option>
                      ))}
                  </select>
                ) : (
                  <div style={{ padding: "12px", borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 13 }}>
                    All existing batches already have schedules.
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Start Time</label>
                  <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>End Time</label>
                  <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ ...inputStyle, padding: "12px 14px", fontSize: 14 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSchedule}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save button — spans full width */}
      <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, padding: "14px 28px", width: "100%", justifyContent: "center" }}
        >
          <Save size={16} />
          {saving ? "Saving All Settings…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
