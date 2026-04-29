"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

type ScoreEntry = {
  score: number;
  duration_seconds: number | null;
  created_at: string;
  profiles: { full_name: string; batch: string | null } | null;
};

interface LeaderboardClientProps {
  scores: ScoreEntry[];
  batches?: string[];
}

export default function LeaderboardClient({ scores, batches = [] }: LeaderboardClientProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  // Group by user — best score per person
  const bestScores = useMemo(() => {
    const map = new Map<string, ScoreEntry>();
    for (const s of scores) {
      const name = s.profiles?.full_name ?? "Unknown";
      const existing = map.get(name);
      if (!existing || s.score > existing.score || (s.score === existing.score && (s.duration_seconds ?? 9999) < (existing.duration_seconds ?? 9999))) {
        map.set(name, s);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.score - a.score || (a.duration_seconds ?? 9999) - (b.duration_seconds ?? 9999))
      .slice(0, 10);
  }, [scores]);

  const filtered = useMemo(() => bestScores.filter(s => {
    const matchName = !nameFilter || (s.profiles?.full_name ?? "").toLowerCase().includes(nameFilter.toLowerCase());
    const matchBatch = !batchFilter || s.profiles?.batch === batchFilter;
    return matchName && matchBatch;
  }), [bestScores, nameFilter, batchFilter]);

  function formatDuration(secs: number | null) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60); const s = secs % 60;
    return `${m}m ${s}s`;
  }

  const medalIcons = ["🥇", "🥈", "🥉"];
  const medalColors = ["#f59e0b", "#9ca3af", "#cd7c32"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <div className="glass-card animate-fade-in" style={{ padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="filter-name"
            type="text"
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            placeholder="Filter by name…"
            className="input-field"
            style={{ paddingLeft: 34, fontSize: 14, padding: "9px 12px 9px 34px" }}
          />
        </div>
        {batches.length > 0 && (
          <select
            id="filter-batch"
            value={batchFilter}
            onChange={e => setBatchFilter(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 10, color: batchFilter ? "var(--text-primary)" : "var(--text-muted)", padding: "9px 14px", fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif", minWidth: 160 }}
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        {(nameFilter || batchFilter) && (
          <button onClick={() => { setNameFilter(""); setBatchFilter(""); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Clear</button>
        )}
      </div>

      {/* Podium — top 3 */}
      {!nameFilter && !batchFilter && filtered.length >= 3 && (
        <div className="animate-fade-in" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[1, 0, 2].map(rank => {
            const entry = filtered[rank];
            if (!entry) return null;
            const isFirst = rank === 0;
            return (
              <div key={rank} className="glass-card" style={{ padding: "24px 20px", textAlign: "center", flex: "0 0 160px", order: isFirst ? -1 : rank, borderColor: isFirst ? "rgba(245,158,11,0.3)" : undefined, boxShadow: isFirst ? "0 0 30px rgba(245,158,11,0.15)" : undefined }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{medalIcons[rank]}</div>
                <div style={{ fontWeight: 800, fontSize: 28, color: medalColors[rank] }}>{entry.score}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6 }}>/ 20</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{entry.profiles?.full_name ?? "—"}</div>
                {entry.profiles?.batch && <div className="badge badge-info" style={{ marginTop: 6, fontSize: 10 }}>{entry.profiles.batch}</div>}
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>{formatDuration(entry.duration_seconds)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Name</th>
              <th>Batch</th>
              <th>Score</th>
              <th>Duration</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No results found</td></tr>
            ) : filtered.map((entry, idx) => (
              <tr key={idx} className="animate-slide-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                <td>
                  {idx < 3 && !nameFilter && !batchFilter
                    ? <span style={{ fontSize: 18 }}>{medalIcons[idx]}</span>
                    : <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{idx + 1}</span>
                  }
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {(entry.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{entry.profiles?.full_name ?? "Unknown"}</span>
                  </div>
                </td>
                <td>{entry.profiles?.batch ? <span className="badge badge-info">{entry.profiles.batch}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td><span style={{ fontWeight: 700, fontSize: 16, color: entry.score >= 18 ? "#10b981" : entry.score >= 15 ? "#f59e0b" : "var(--text-primary)" }}>{entry.score}<span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 400 }}>/20</span></span></td>
                <td style={{ color: "var(--text-secondary)" }}>{formatDuration(entry.duration_seconds)}</td>
                <td><span className={`badge ${entry.score >= 18 ? "badge-success" : entry.score >= 10 ? "badge-warning" : "badge-danger"}`}>{Math.round((entry.score / 20) * 100)}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
