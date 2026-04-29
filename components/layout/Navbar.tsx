"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Shield, Brain } from "lucide-react";
import toast from "react-hot-toast";

interface NavbarProps {
  fullName: string;
  isAdmin: boolean;
}

export default function Navbar({ fullName, isAdmin }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <nav style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: "0 24px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(10px)",
    }}>
      {/* Left: Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 15px rgba(99,102,241,0.35)",
        }}>
          <Brain size={20} color="white" strokeWidth={1.8} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          Brain Workout
        </span>
      </Link>

      {/* Right: User info + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {isAdmin && (
          <Link href="/admin" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: pathname.startsWith("/admin")
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(99,102,241,0.12)",
            color: "white",
            textDecoration: "none",
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid rgba(99,102,241,0.3)",
            transition: "all 0.2s",
            boxShadow: pathname.startsWith("/admin") ? "0 0 15px rgba(99,102,241,0.4)" : "none",
          }}>
            <Shield size={14} />
            Admin
          </Link>
        )}

        {/* User avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "white",
            boxShadow: "0 0 10px rgba(99,102,241,0.3)",
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600 }}>
            {fullName}
          </span>
        </div>

        {/* Logout */}
        <button
          id="btn-logout"
          onClick={handleLogout}
          title="Sign Out"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            color: "#ef4444",
            cursor: "pointer",
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
