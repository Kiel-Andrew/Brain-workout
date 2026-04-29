import { createClient } from "@/lib/supabase/server";
import WorkoutLobby from "@/components/workout/WorkoutLobby";

export const dynamic = "force-dynamic";

export default async function WorkoutPage() {
  const supabase = await createClient();

  // Fetch results and join with users table
  const { data: results, error } = await supabase
    .from("workout_results")
    .select(`
      score,
      duration_seconds,
      created_at,
      user_id,
      difficulty,
      users:user_id (
        full_name,
        batch_number
      )
    `)
    .order("duration_seconds", { ascending: true })
    .order("score", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard:", error);
  }

  // 1. Group by user_id AND difficulty to get the best performance for each individual user in each mode
  const userBestMap = new Map<string, { name: string; score: number; duration: number; batch: string | null; difficulty: string }>();

  for (const r of results ?? []) {
    const user = Array.isArray(r.users) ? r.users[0] : r.users;
    if (!user) continue;

    const diff = r.difficulty || "normal";
    const userId = `${r.user_id}-${diff}`;
    const name = user.full_name || "Unknown User";
    const batch = user.batch_number;
    const score = Number(r.score);
    const duration = Number(r.duration_seconds);

    const existing = userBestMap.get(userId);

    // If we haven't seen this user for this difficulty, or if this result is better
    if (!existing || duration < existing.duration || (duration === existing.duration && score > existing.score)) {
      userBestMap.set(userId, {
        name,
        score,
        duration,
        batch,
        difficulty: diff
      });
    }
  }

  // 2. Convert to array and sort globally
  // Faster duration (lower number) first, then higher score
  const leaderboard = Array.from(userBestMap.values())
    .sort((a, b) => {
      if (a.duration !== b.duration) return a.duration - b.duration;
      return b.score - a.score;
    });

  // 3. Extract unique batches for the filter dropdown
  const batches = [...new Set(leaderboard.map(e => e.batch).filter(Boolean))]
    .sort((a, b) => (a as string).localeCompare(b as string, undefined, { numeric: true, sensitivity: 'base' })) as string[];

  // 4. Fetch system settings for timer
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
