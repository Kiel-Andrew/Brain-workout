import { createClient } from "@/lib/supabase/server";
import WorkoutButton from "@/components/WorkoutButton";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, batch_number, role")
    .eq("id", user!.id)
    .single();

  // 1. Fetch system settings (global fallback)
  const { data: globalSettings } = await supabase
    .from("system_settings")
    .select("is_workout_open, start_time, end_time")
    .eq("id", 1)
    .single();

  // 2. Fetch batch-specific settings
  const { data: batchSettings } = profile?.batch_number 
    ? await supabase
        .from("batch_schedules")
        .select("is_open, start_time, end_time")
        .eq("batch_number", profile.batch_number)
        .single()
    : { data: null };

  // Determine if workout is currently accessible
  let isAccessOpen = false; // Default to closed if schedule exists
  let windowLabel: string | undefined;
  const currentSettings = batchSettings || globalSettings;

  if (currentSettings) {
    // 1. Check status toggle (Batch overrides Global)
    const isStatusOpen = batchSettings 
      ? batchSettings.is_open 
      : (globalSettings?.is_workout_open ?? true);

    if (isStatusOpen) {
      if (currentSettings.start_time && currentSettings.end_time) {
        const now = new Date();
        // Standardize current time as HH:mm
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                          now.getMinutes().toString().padStart(2, '0');
        
        // Ensure database times are also in HH:mm format (removing any AM/PM if present)
        const start = currentSettings.start_time.substring(0, 5);
        const end = currentSettings.end_time.substring(0, 5);
        
        if (currentTime >= start && currentTime <= end) {
          isAccessOpen = true;
          windowLabel = `${currentSettings.start_time} – ${currentSettings.end_time}`;
        }
      } else {
        // If no time window set, it's just open
        isAccessOpen = true;
      }
    }
  } else {
    // Fallback if no settings found at all
    isAccessOpen = true;
  }

  // 3. Role-based Access Control
  const isAdmin = profile?.role === "admin";
  const isVisitor = profile?.role === "visitor";
  
  // Admins and Visitors have unlimited access. 
  // ONLY Trainees follow the schedule.
  if (isAdmin || isVisitor) {
    isAccessOpen = true;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 40 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-1px" }}>
          Welcome back,{" "}
          <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {profile?.full_name?.split(" ")[0] ?? "User"}
          </span>!
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 16 }}>
          {isAdmin 
            ? "Administrator Access: Unlimited Play" 
            : isVisitor 
              ? "Visitor Access: Unlimited Play" 
              : "Ready for your daily mental workout?"}
        </p>
      </div>

      {/* Math Workout Button */}
      <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <WorkoutButton 
          isAccessOpen={isAccessOpen} 
          windowLabel={isAdmin || isVisitor ? "Always Open" : windowLabel} 
        />
      </div>

      {/* Access window status - Only show for Trainees who have a schedule */}
      {currentSettings && !isAdmin && !isVisitor && (
        <div
          className="glass-card animate-fade-in"
          style={{ padding: "12px 20px", display: "flex", gap: 8, alignItems: "center", animationDelay: "0.2s" }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isAccessOpen ? "var(--success)" : "var(--danger)",
          }} />
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {!(batchSettings ? batchSettings.is_open : globalSettings?.is_workout_open)
              ? "Math Workout is currently closed by admin"
              : isAccessOpen
                ? `Math Workout open: ${windowLabel}`
                : `Math Workout window: ${currentSettings.start_time} – ${currentSettings.end_time}`
            }
          </span>
        </div>
      )}
    </div>
  );
}
