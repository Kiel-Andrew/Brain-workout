import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("system_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Settings size={20} color="#6366f1" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Time Scheduling</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Workout access control and timer configuration</p>
        </div>
      </div>
      <AdminSettingsClient settings={settings ?? { id: 1, is_workout_open: true, start_time: "08:00", end_time: "17:00", timer_duration_seconds: 300 }} />
    </div>
  );
}
