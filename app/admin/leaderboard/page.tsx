import { createClient } from "@/lib/supabase/server";
import { Trophy, Target, TrendingUp, Zap } from "lucide-react";
import AdminLeaderboardClient from "@/components/admin/AdminLeaderboardClient";

export default async function AdminLeaderboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allResults } = await supabase.from("workout_results")
    .select("score, duration_seconds, created_at, difficulty, users:user_id(full_name, batch_number, role)")
    .order("created_at", { ascending: false });

  const results = allResults ?? [];
  const todayResults = results.filter(r => r.created_at.startsWith(today));
  
  const totalSessions = todayResults.length;
  const avgScore = todayResults.length > 0 
    ? (todayResults.reduce((acc, r) => acc + r.score, 0) / todayResults.length).toFixed(1)
    : "—";
  
  const bestScore = todayResults.length > 0
    ? Math.max(...todayResults.map(r => r.score))
    : "—";

  const stats = [
    { label: "Sessions Today", value: totalSessions, icon: Zap, color: "#6366f1" },
    { label: "Avg. Score Today", value: avgScore, icon: Target, color: "#10b981" },
    { label: "Highest Score", value: bestScore, icon: TrendingUp, color: "#f59e0b" },
    { label: "Total All-Time", value: results.length, icon: Trophy, color: "#94a3b8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Daily Leaderboard</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Real-time performance tracking for all trainees</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card animate-fade-in" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="animate-fade-in">
        <AdminLeaderboardClient sessions={(results as any) ?? []} />
      </div>
    </div>
  );
}
