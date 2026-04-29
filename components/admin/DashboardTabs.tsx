"use client";

import { useState } from "react";
import { Users as UsersIcon, Clock } from "lucide-react";
import AdminUsersClient from "./AdminUsersClient";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  batch_number: string | null;
  role: string;
  created_at: string;
};

type Session = {
  score: number;
  duration_seconds: number | null;
  created_at: string;
  users: {
    full_name: string;
    batch_number: string | null;
  } | {
    full_name: string;
    batch_number: string | null;
  }[];
};

interface DashboardTabsProps {
  users: User[];
  recentSessions: Session[];
}

export default function DashboardTabs({ users, recentSessions }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "users">("users");

  function formatDuration(secs: number | null) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  function getColorRow(score: number) {
    return score >= 18 ? "rgba(16,185,129,0.1)" : score >= 10 ? "rgba(245,158,11,0.1)" : "transparent";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Tab Switcher */}
      <div className="glass-card" style={{ padding: "6px", display: "inline-flex", width: "fit-content", gap: 4 }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.2s",
            background: activeTab === "users" ? "rgba(99,102,241,0.15)" : "transparent",
            color: activeTab === "users" ? "#6366f1" : "var(--text-secondary)",
          }}
        >
          <UsersIcon size={16} />
          Users List
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.2s",
            background: activeTab === "sessions" ? "rgba(99,102,241,0.15)" : "transparent",
            color: activeTab === "sessions" ? "#6366f1" : "var(--text-secondary)",
          }}
        >
          <Clock size={16} />
          Recent Sessions
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 400 }}>
        {activeTab === "sessions" ? (
          <div className="glass-card animate-fade-in" style={{ overflowX: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", minWidth: 600 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Recent Activity</h2>
            </div>
            <table className="data-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Batch</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No sessions recorded</td></tr>
                ) : recentSessions.map((s, i) => {
                  const u = (Array.isArray(s.users) ? s.users[0] : s.users) as { full_name: string; batch_number: string | null } | null;
                  return (
                    <tr key={i} style={{ background: getColorRow(s.score) }}>
                      <td style={{ fontWeight: 600 }}>{u?.full_name ?? "—"}</td>
                      <td>{u?.batch_number ? <span className="badge badge-info">{u.batch_number}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td><span style={{ fontWeight: 700, color: s.score >= 18 ? "#10b981" : s.score >= 10 ? "#f59e0b" : "#ef4444" }}>{s.score}/20</span></td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatDuration(s.duration_seconds)}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13, whiteSpace: "nowrap" }}>{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="animate-fade-in">
            <AdminUsersClient users={users} />
          </div>
        )}
      </div>
    </div>
  );
}
