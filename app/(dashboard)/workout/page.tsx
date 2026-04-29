import { createClient } from "@/lib/supabase/server";
import WorkoutLobby from "@/components/workout/WorkoutLobby";

export default async function WorkoutPage() {
  const supabase = await createClient();

  // Fetch leaderboard data server-side
  const { data: results } = await supabase
    .from("workout_results")
    .select(`score, duration_seconds, created_at, users:user_id(full_name, batch_number)`)
    .order("score", { ascending: false })
    .order("duration_seconds", { ascending: true })
    .limit(100);

  // Best score per person
  const bestMap = new Map<string, { name: string; score: number; duration: number; batch: string | null }>();
  for (const r of results ?? []) {
    const u = Array.isArray(r.users) ? r.users[0] : r.users as { full_name: string; batch_number: string | null } | null;
    const name = u?.full_name ?? "Unknown";
    const existing = bestMap.get(name);
    const dur = r.duration_seconds ?? 9999;
    if (!existing || r.score > existing.score || (r.score === existing.score && dur < existing.duration)) {
      bestMap.set(name, { name, score: r.score, duration: dur, batch: u?.batch_number ?? null });
    }
  }

  const leaderboard = Array.from(bestMap.values())
    .sort((a, b) => b.score - a.score || a.duration - b.duration)
    .slice(0, 10);

  const batches = [...new Set(leaderboard.map(e => e.batch).filter(Boolean))] as string[];

  // Timer setting
  const { data: settings } = await supabase
    .from("system_settings")
    .select("timer_duration_seconds")
    .eq("id", 1)
    .single();

  const timerSeconds = settings?.timer_duration_seconds ?? 300;

  return (
    <WorkoutLobby
      leaderboard={leaderboard}
      batches={batches}
      timerSeconds={timerSeconds}
    />
  );
}
