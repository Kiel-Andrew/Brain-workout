import { createClient } from "@/lib/supabase/server";
import { Users as UsersIcon, Shield, GraduationCap, Clock } from "lucide-react";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: allUsers } = await supabase.from("users")
    .select("id, full_name, email, batch_number, role, created_at")
    .order("created_at", { ascending: false });

  const users = allUsers ?? [];
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "admin").length;
  const traineeCount = users.filter(u => u.role === "trainee").length;
  const visitorCount = users.filter(u => u.role === "visitor").length;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: UsersIcon, color: "#6366f1" },
    { label: "Active Trainees", value: traineeCount, icon: GraduationCap, color: "#10b981" },
    { label: "Administrators", value: adminCount, icon: Shield, color: "#f59e0b" },
    { label: "Visitors", value: visitorCount, icon: Clock, color: "#94a3b8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UsersIcon size={20} color="#6366f1" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Users List</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Manage trainee accounts and profile information</p>
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
        <AdminUsersClient users={users} />
      </div>
    </div>
  );
}
