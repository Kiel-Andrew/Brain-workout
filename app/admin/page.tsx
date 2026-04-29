import { createClient } from "@/lib/supabase/server";
import { Users, BarChart2, CheckSquare, TrendingUp } from "lucide-react";
import DashboardTabs from "@/components/admin/DashboardTabs";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: todaySessions },
    { data: recentResults },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("workout_results").select("*", { count: "exact", head: true }),
    supabase.from("workout_results").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("workout_results")
      .select("score, duration_seconds, created_at, difficulty, users:user_id(full_name, batch_number, role)")
      .order("created_at", { ascending: false }),
    supabase.from("users")
      .select("id, full_name, email, batch_number, role, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const avgScore = recentResults && recentResults.length > 0
    ? (recentResults.reduce((acc, s) => acc + s.score, 0) / recentResults.length).toFixed(1)
    : "—";

  const stats = [
    { label: "Total Trainees", value: totalUsers ?? 0, icon: Users, color: "#6366f1", glow: "rgba(99,102,241,0.3)" },
    { label: "Total Sessions", value: totalSessions ?? 0, icon: BarChart2, color: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
    { label: "Sessions Today", value: todaySessions ?? 0, icon: CheckSquare, color: "#10b981", glow: "rgba(16,185,129,0.3)" },
    { label: "Avg. Score (Recent)", value: avgScore, icon: TrendingUp, color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: 10 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Admin Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Overview of engagement and trainee performance</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {stats.map(({ label, value, icon: Icon, color, glow }) => (
          <div key={label} className="glass-card animate-fade-in" style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${color}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 15px ${glow}`,
              }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color, letterSpacing: "-1px" }}>{value}</div>
          </div>
        ))}
      </div>

      <DashboardTabs 
        users={allUsers ?? []} 
        recentSessions={(recentResults as any) ?? []} 
      />
    </div>
  );
}
