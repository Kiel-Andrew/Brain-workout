"use client";

import { useState } from "react";
import { Trophy, Calendar, Filter, User } from "lucide-react";

type Session = {
  score: number;
  duration_seconds: number | null;
  created_at: string;
  difficulty: string;
  users: {
    full_name: string;
    batch_number: string | null;
  } | {
    full_name: string;
    batch_number: string | null;
  }[];
};

interface AdminLeaderboardClientProps {
  sessions: Session[];
}

export default function AdminLeaderboardClient({ sessions }: AdminLeaderboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  function formatDuration(secs: number | null) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  // Filter sessions by date and difficulty
  const filteredSessions = sessions.filter(s => {
    const sessionDate = new Date(s.created_at).toISOString().split("T")[0];
    const dateMatch = sessionDate === selectedDate;
    const diffMatch = difficultyFilter === "all" || s.difficulty === difficultyFilter;
    return dateMatch && diffMatch;
  });

  // Group by user to get the BEST result for each user on that day
  const dailyBest = new Map<string, Session>();
  
  filteredSessions.forEach(s => {
    const user = Array.isArray(s.users) ? s.users[0] : s.users;
    if (!user) return;
    
    const userName = user.full_name || "Unknown";
    const existing = dailyBest.get(userName);
    
    if (!existing || 
        (s.duration_seconds ?? 9999) < (existing.duration_seconds ?? 9999) || 
        ((s.duration_seconds === existing.duration_seconds) && s.score > existing.score)) {
      dailyBest.set(userName, s);
    }
  });

  // Convert to array and sort by duration (asc) then score (desc)
  const rankedResults = Array.from(dailyBest.values()).sort((a, b) => {
    const durA = a.duration_seconds ?? 9999;
    const durB = b.duration_seconds ?? 9999;
    if (durA !== durB) return durA - durB;
    return b.score - a.score;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Date Picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Day</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Calendar size={14} style={{ position: "absolute", left: 10, color: "var(--text-muted)" }} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid var(--border-color)",
                  background: "rgba(0,0,0,0.02)", color: "var(--text-primary)", fontSize: 13,
                  fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer"
                }}
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Difficulty</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Filter size={14} style={{ position: "absolute", left: 10, color: "var(--text-muted)" }} />
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{
                  padding: "8px 12px 8px 32px", borderRadius: 8, border: "1px solid var(--border-color)",
                  background: "rgba(0,0,0,0.02)", color: "var(--text-primary)", fontSize: 13,
                  fontFamily: "Inter, sans-serif", outline: "none", cursor: "pointer", minWidth: 120
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(99,102,241,0.1)", padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.2)" }}>
          <span style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>{rankedResults.length} Participants Today</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Trainee</th>
              <th>Batch</th>
              <th>Difficulty</th>
              <th>Best Score</th>
              <th>Fastest Time</th>
              <th>Recorded At</th>
            </tr>
          </thead>
          <tbody>
            {rankedResults.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Trophy size={32} opacity={0.2} />
                    <span>No records found for this date and difficulty</span>
                  </div>
                </td>
              </tr>
            ) : rankedResults.map((s, i) => {
              const u = (Array.isArray(s.users) ? s.users[0] : s.users) as { full_name: string; batch_number: string | null } | null;
              const rank = i + 1;
              const isTop3 = rank <= 3;
              
              return (
                <tr key={i} style={{ 
                  background: rank === 1 ? "rgba(245,158,11,0.05)" : "transparent",
                  transition: "background 0.2s"
                }}>
                  <td>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: "50%", 
                      background: rank === 1 ? "#f59e0b" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : "rgba(0,0,0,0.05)",
                      color: isTop3 ? "white" : "var(--text-secondary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800
                    }}>
                      {rank}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={14} color="#6366f1" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{u?.full_name ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    {u?.batch_number ? (
                      <span className="badge badge-info">{u.batch_number}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      textTransform: "capitalize", fontSize: 12, fontWeight: 600,
                      color: s.difficulty === "hard" ? "#ef4444" : s.difficulty === "normal" ? "#f59e0b" : "#10b981"
                    }}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.score >= 18 ? "#10b981" : s.score >= 10 ? "#f59e0b" : "#ef4444" }}>
                      {s.score}/20
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{formatDuration(s.duration_seconds)}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
