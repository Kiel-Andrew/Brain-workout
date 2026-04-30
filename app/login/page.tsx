"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Loader2, Brain } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Welcome back!");
    router.push("/");
    router.refresh();
  }

  function handleLarkLogin() {
    toast("Lark login coming soon!", { icon: "🦅" });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>
      {/* Animated background */}
      <div className="animated-bg">
        <div className="dot" style={{ width: 300, height: 300, top: "-10%", left: "-5%", animationDelay: "0s" }} />
        <div className="dot" style={{ width: 200, height: 200, top: "60%", right: "-5%", animationDelay: "3s" }} />
        <div className="dot" style={{ width: 150, height: 150, bottom: "10%", left: "30%", animationDelay: "5s" }} />
      </div>

      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: 420, padding: 40, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: "0 0 30px rgba(99,102,241,0.4)"
          }}>
            <Brain size={30} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Brain Workout
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
            Sign in to start your daily session
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15 }}
          >
            {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
        </div>

        {/* Lark Login Button */}
        <button
          id="btn-lark-login"
          onClick={handleLarkLogin}
          style={{
            width: "100%",
            padding: "12px 24px",
            borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "rgba(0,0,0,0.02)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 0.3s ease",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.4)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
          }}
        >
          {/* Lark Bird Icon (SVG) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#00d6a1"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1664FF"/>
          </svg>
          Continue with Lark
        </button>

        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, marginTop: 24 }}>
          Don&apos;t have an account?{" "}
          <a href="/signup" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
