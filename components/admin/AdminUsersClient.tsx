"use client";

import { useState, useMemo } from "react";
import { Search, Shield, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  batch_number: string | null;
  role: string;
  created_at: string;
};

export default function AdminUsersClient({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");

  const batches = useMemo(() => [...new Set(users.map(u => u.batch_number).filter(Boolean))] as string[], [users]);

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = !search || (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchBatch = !batchFilter || u.batch_number === batchFilter;
    return matchSearch && matchBatch;
  }), [users, search, batchFilter]);

  async function updateRole(userId: string, newRole: string) {
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role updated to ${newRole}`);
  }

  function getRoleBadge(role: string) {
    const r = (role || "visitor").toLowerCase();
    switch (r) {
      case "admin": return <span className="badge badge-warning">Admin</span>;
      case "trainee": return <span className="badge badge-info">Trainee</span>;
      case "visitor": return <span className="badge" style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-muted)" }}>Visitor</span>;
      default: return <span className="badge" style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-muted)" }}>Trainee</span>;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div className="glass-card" style={{ padding: "14px 16px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" className="input-field" style={{ paddingLeft: 34, fontSize: 14, padding: "9px 12px 9px 34px" }} />
        </div>
        {batches.length > 0 && (
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: 10, color: batchFilter ? "var(--text-primary)" : "var(--text-muted)", padding: "9px 14px", fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif", minWidth: 140 }}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Batch</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No users found</td></tr>
            ) : filtered.map(u => {
              const r = (u.role || "visitor").toLowerCase();
              const isEditable = r !== "visitor";
              
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ 
                        width: 30, height: 30, borderRadius: "50%", 
                        background: r === "admin" ? "linear-gradient(135deg, #f59e0b, #d97706)" : 
                                   r === "trainee" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : 
                                   "rgba(0,0,0,0.1)", 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 
                      }}>
                        {(u.full_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{u.full_name ?? "—"}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{u.email ?? "—"}</td>
                  <td>{u.batch_number ? <span className="badge badge-info">{u.batch_number}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {isEditable ? (
                      <select 
                        value={r}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        style={{
                          background: r === "admin" ? "rgba(245,158,11,0.05)" : "rgba(99,102,241,0.05)",
                          border: `1px solid ${r === "admin" ? "#f59e0b33" : "#6366f133"}`,
                          color: r === "admin" ? "#d97706" : "#6366f1",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                          fontSize: 12, fontWeight: 600, outline: "none"
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="trainee">Trainee</option>
                      </select>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500, fontStyle: "italic" }}>
                        Locked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
