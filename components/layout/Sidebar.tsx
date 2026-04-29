"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  BarChart2, 
  Settings, 
  Clock, 
  ArrowLeft, 
  Menu, 
  X, 
  Brain, 
  LogOut, 
  Shield,
  LayoutDashboard
} from "lucide-react";
import toast from "react-hot-toast";

interface SidebarProps {
  fullName: string;
  isAdmin: boolean;
  batchNumber?: string | null;
  role?: string;
}

export default function Sidebar({ fullName, isAdmin, batchNumber, role }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard, exact: true },
    ...(isAdmin ? [
      { href: "/admin", label: "Admin Dashboard", icon: Shield, exact: true },
      { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
    ] : []),
  ];

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] sticky top-0 z-50">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={18} color="white" />
          </div>
          <div style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Math Workout
          </div>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50 
        w-[280px] md:w-[240px] 
        bg-[var(--bg-secondary)] border-r border-[var(--border-color)] 
        p-6 flex flex-col gap-4 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo Section */}
        <div className="hidden md:flex flex-col gap-4 mb-6">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 15px rgba(99,102,241,0.35)",
            }}>
              <Brain size={24} color="white" strokeWidth={2} />
            </div>
            <div style={{ 
              color: "var(--text-primary)", 
              fontSize: 20, 
              fontWeight: 800, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em"
            }}>
              Math Workout
            </div>
          </div>
        </div>

        {/* User Profile Summary */}
        <div style={{ 
          padding: "12px", 
          borderRadius: 12, 
          background: "rgba(0,0,0,0.02)", 
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "white",
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {fullName}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>
              {isAdmin 
                ? "Administrator" 
                : role === "visitor" 
                  ? "Visitor" 
                  : `Trainee${batchNumber ? ` • Batch ${batchNumber}` : ""}`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link 
                key={href} 
                href={href} 
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                  color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                  textDecoration: "none", fontWeight: active ? 600 : 500,
                  fontSize: 14, transition: "all 0.2s",
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <button 
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 10,
            color: "#ef4444", 
            textDecoration: "none",
            fontSize: 14, 
            fontWeight: 600,
            transition: "all 0.2s",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            cursor: "pointer",
            width: "100%",
            textAlign: "left"
          }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  );
}
