"use client";

import { useState } from "react";
import { Users as UsersIcon, Clock } from "lucide-react";
import AdminUsersClient from "./AdminUsersClient";
import AdminLeaderboardClient from "./AdminLeaderboardClient";

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
  difficulty: string;
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
          Daily Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 400 }}>
        {activeTab === "sessions" ? (
          <div className="animate-fade-in">
            <AdminLeaderboardClient sessions={recentSessions} />
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
