"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Lock, User, Hash, Loader2, Calculator } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { toast.error("Full name is required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);

    try {
      // Step 1: Create user via server API
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName.trim(),
          batchNumber: batchNumber.trim() || null,
        }),
      });

      let result: { error?: string; success?: boolean } = {};
      try {
        result = await res.json();
      } catch {
        console.error("Failed to parse API response");
        toast.error("Server error — check the console");
        setLoading(false);
        return;
      }

      if (!res.ok || result.error) {
        toast.error(result.error ?? `Server error (${res.status})`);
        setLoading(false);
        return;
      }

      // Step 2: Sign in with the new credentials
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        toast.error("Account created but sign-in failed: " + signInError.message);
        setLoading(false);
        router.push("/login");
        return;
      }

      toast.success("Account created! Welcome aboard 🎉");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Network error — is the server running?");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>
      {/* Animated background */}
      <div className="animated-bg">
        <div className="dot" style={{ width: 300, height: 300, top: "-10%", left: "-5%", animationDelay: "0s" }} />
        <div className="dot" style={{ width: 200, height: 200, top: "60%", right: "-5%", animationDelay: "3s" }} />
        <div className="dot" style={{ width: 150, height: 150, bottom: "10%", left: "30%", animationDelay: "5s" }} />
      </div>

      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: 440, padding: 40, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: "0 0 30px rgba(99,102,241,0.4)",
          }}>
            <Calculator size={30} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
            Join the Math Workout program
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Full Name */}
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name"
              required
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Email */}
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              required
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Batch Number */}
          <div style={{ position: "relative" }}>
            <Hash size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="signup-batch"
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="Batch number (optional)"
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <button
            id="btn-signup"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15 }}
          >
            {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 14, marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
