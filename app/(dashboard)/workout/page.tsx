import { createClient } from "@/lib/supabase/server";
import WorkoutLobby from "@/components/workout/WorkoutLobby";

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
      users:user_id (
        full_name,
        batch_number
      )
    `)
    .order("score", { ascending: false })
    .order("duration_seconds", { ascending: true });

  if (error) {
    console.error("Error fetching leaderboard:", error);
  }

  // 1. Group by user_id to get the best score for each individual user
  // (Using user_id is safer than name to avoid collisions)
  const userBestMap = new Map<string, { name: string; score: number; duration: number; batch: string | null }>();

  for (const r of results ?? []) {
    // Correctly handle the join result which might be an object or array depending on Supabase version/config
    const user = Array.isArray(r.users) ? r.users[0] : r.users;
    
    if (!user) continue; // Skip if user record is missing

    const userId = r.user_id;
    const name = user.full_name || "Unknown User";
    const batch = user.batch_number;
    const score = Number(r.score);
    const duration = Number(r.duration_seconds);

    const existing = userBestMap.get(userId);

    // If we haven't seen this user, or if this score is better (higher score, or same score with faster time)
    if (!existing || score > existing.score || (score === existing.score && duration < existing.duration)) {
      userBestMap.set(userId, {
        name,
        score,
        duration,
        batch
      });
    }
  }

  // 2. Convert to array and sort globally
  // Higher score first, then shorter duration
  const leaderboard = Array.from(userBestMap.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.duration - b.duration;
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
