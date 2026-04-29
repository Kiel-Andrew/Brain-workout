import { createClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import LeaderboardClient from "@/components/leaderboard/LeaderboardClient";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch all results joined with user info
  const { data: results } = await supabase
    .from("workout_results")
    .select(`
      score,
      duration_seconds,
      created_at,
      users:user_id (
        full_name,
        batch_number
      )
    `)
    .order("score", { ascending: false })
    .order("duration_seconds", { ascending: true })
    .limit(100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(245,158,11,0.4)",
        }}>
          <Trophy size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Leaderboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Top performers based on best scores</p>
        </div>
      </div>

      <LeaderboardClient
        scores={(results ?? []).map(r => ({
          score: r.score,
          duration_seconds: r.duration_seconds,
          created_at: r.created_at,
          profiles: (() => {
            const u = Array.isArray(r.users) ? r.users[0] ?? null : r.users as { full_name: string; batch_number: string | null } | null;
            return u ? { full_name: u.full_name, batch: u.batch_number } : null;
          })(),
        }))}
      />
    </div>
  );
}
