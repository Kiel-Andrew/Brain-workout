"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Users, Settings, Clock, ArrowLeft, Menu, X } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart2, exact: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header with Hamburger (Three Lines) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] sticky top-0 z-50">
        <div style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Math Workout
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-[var(--border-color)] rounded-lg transition-colors"
          aria-label="Toggle Menu"
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
        w-[280px] md:w-[220px] 
        bg-[var(--bg-secondary)] border-r border-[var(--border-color)] 
        p-6 flex flex-col gap-4 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="hidden md:block px-3 pb-4 mb-2">
          <p style={{
            color: "var(--text-primary)",
            fontSize: 20,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.8
          }}>
            Math Workout
          </p>
        </div>

        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: "none", fontWeight: active ? 600 : 500,
                fontSize: 14, transition: "all 0.2s",
                borderLeft: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="flex-1" />

        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 10,
          color: "var(--text-primary)",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--border-color)",
          marginTop: "auto",
        }}>
          <ArrowLeft size={14} />
          Back to App
        </Link>
      </aside>
    </>
  );
}
