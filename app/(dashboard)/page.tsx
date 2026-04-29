import { createClient } from "@/lib/supabase/server";
import WorkoutButton from "@/components/WorkoutButton";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  // Fetch system settings (single row, id = 1)
  const { data: settings } = await supabase
    .from("system_settings")
    .select("is_workout_open, start_time, end_time")
    .eq("id", 1)
    .single();

  // Determine if workout is currently accessible
  let isAccessOpen = true;
  let windowLabel: string | undefined;

  if (settings) {
    if (!settings.is_workout_open) {
      isAccessOpen = false;
    } else if (settings.start_time && settings.end_time) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
      isAccessOpen = currentTime >= settings.start_time && currentTime <= settings.end_time;
      if (isAccessOpen) {
        windowLabel = `${settings.start_time} – ${settings.end_time}`;
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 40 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-1px" }}>
          Welcome back,{" "}
          <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {profile?.full_name?.split(" ")[0] ?? "Trainee"}
          </span>!
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 16 }}>
          Ready for your daily mental workout?
        </p>
      </div>

      {/* Math Workout Button */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <WorkoutButton isAccessOpen={isAccessOpen} windowLabel={windowLabel} />
      </div>

    </div>
  );
}
