"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Users, Settings, Clock, ArrowLeft } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart2, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      padding: "24px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      flexShrink: 0,
    }}>
      <div style={{ padding: "4px 12px 16px", marginBottom: 4 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Admin Panel
        </p>
      </div>

      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: active ? "rgba(99,102,241,0.15)" : "transparent",
            color: active ? "var(--accent-primary)" : "var(--text-secondary)",
            textDecoration: "none", fontWeight: active ? 600 : 500,
            fontSize: 14, transition: "all 0.2s",
            borderLeft: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
          }}>
            <Icon size={16} />
            {label}
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        color: "var(--text-muted)", textDecoration: "none",
        fontSize: 13, transition: "all 0.2s",
      }}>
        <ArrowLeft size={14} />
        Back to App
      </Link>
    </aside>
  );
}
