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

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role changed to ${newRole}`);
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
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {(u.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{u.full_name ?? "—"}</span>
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{u.email ?? "—"}</td>
                <td>{u.batch_number ? <span className="badge badge-info">{u.batch_number}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td><span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-info"}`}>{u.role === "admin" ? "Admin" : "Trainee"}</span></td>
                <td style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => toggleRole(u.id, u.role)} style={{ background: u.role === "admin" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)", border: `1px solid ${u.role === "admin" ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)"}`, color: u.role === "admin" ? "#ef4444" : "#6366f1", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                    {u.role === "admin" ? <><ShieldOff size={13} /> Revoke</> : <><Shield size={13} /> Make Admin</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
