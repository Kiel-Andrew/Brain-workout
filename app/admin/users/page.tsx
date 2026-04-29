import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name, email, batch_number, role, created_at")
    .order("created_at", { ascending: false });

  // Best score per user
  const { data: bestScores } = await supabase
    .from("workout_results")
    .select("user_id, score, duration_seconds")
    .order("score", { ascending: false });

  const bestByUser = new Map<string, { score: number; duration: number }>();
  for (const s of bestScores ?? []) {
    const existing = bestByUser.get(s.user_id);
    if (!existing || s.score > existing.score) {
      bestByUser.set(s.user_id, { score: s.score, duration: s.duration_seconds ?? 0 });
    }
  }

  const enriched = (allUsers ?? []).map(u => ({
    ...u,
    bestScore: bestByUser.get(u.id) ?? null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={20} color="#6366f1" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>User Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{enriched.length} registered trainee{enriched.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <AdminUsersClient users={enriched} />
    </div>
  );
}
