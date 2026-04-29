"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trophy, Clock, Brain, ChevronLeft, Delete } from "lucide-react";

type LeaderboardEntry = { name: string; score: number; duration: number; batch: string | null; difficulty: string };
type Difficulty = "easy" | "normal" | "hard";
type GameState = "lobby" | "playing" | "finished";
type Question = { text: string; answer: number };

const MEDALS = ["🥇", "🥈", "🥉"];
const PENALTY_SECONDS = 5;

const DIFF_CONFIG = {
  easy:   { label: "Easy",   color: "#10b981", desc: "Addition & Subtraction",  ops: ["+", "-"] as const,       maxA: 20, maxB: 10 },
  normal: { label: "Normal", color: "#f59e0b", desc: "All four operations",      ops: ["+", "-", "×", "÷"] as const, maxA: 50, maxB: 12 },
  hard:   { label: "Hard",   color: "#ef4444", desc: "Advanced operations",     ops: ["+", "-", "×", "÷"] as const, maxA: 100, maxB: 20 },
};

function generateQuestions(difficulty: Difficulty, count = 20): Question[] {
  const cfg = DIFF_CONFIG[difficulty];
  const qs: Question[] = [];
  for (let i = 0; i < count; i++) {
    const op = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
    let a: number, b: number, answer: number, text: string;
    switch (op) {
      case "+": a = rand(cfg.maxA); b = rand(cfg.maxA); answer = a + b; text = `${a} + ${b}`; break;
      case "-": a = rand(cfg.maxA) + 5; b = rand(a - 1) + 1; answer = a - b; text = `${a} − ${b}`; break;
      case "×": a = rand(cfg.maxB) + 1; b = rand(cfg.maxB) + 1; answer = a * b; text = `${a} × ${b}`; break;
      default:  b = rand(cfg.maxB - 1) + 2; answer = rand(10) + 1; a = b * answer; text = `${a} ÷ ${b}`; break;
    }
    qs.push({ text: text!, answer: answer! });
  }
  return qs;
}
function rand(n: number) { return Math.floor(Math.random() * n) + 1; }
function formatDur(s: number) { const m = Math.floor(s / 60); return `${m > 0 ? m + "m " : ""}${s % 60}s`; }

export default function WorkoutLobby({ leaderboard, batches, timerSeconds }: {
  leaderboard: LeaderboardEntry[];
  batches: string[];
  timerSeconds: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [gameState, setGameState] = useState<GameState>("lobby");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [batchFilter, setBatchFilter] = useState("");

  // Game state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [penalty, setPenalty] = useState(0); // total seconds added for wrong answers
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0); // real seconds elapsed
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [saving, setSaving] = useState(false);

  const scoreRef = useRef(0);
  const penaltyRef = useRef(0);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { penaltyRef.current = penalty; }, [penalty]);

  const filteredByDifficulty = leaderboard.filter(e => e.difficulty === difficulty);

  const filtered = batchFilter
    ? filteredByDifficulty.filter(e => e.batch === batchFilter)
    : filteredByDifficulty;

  // ── Save result and show finish screen ──
  const finishGame = useCallback(async () => {
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setGameState("finished");
    setSaving(true);
    const realElapsed = Math.round((Date.now() - startRef.current) / 1000);
    const finalDuration = realElapsed + penaltyRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Check for existing best score for this difficulty
      const { data: bestRecords } = await supabase
        .from("workout_results")
        .select("id, duration_seconds")
        .eq("user_id", user.id)
        .eq("difficulty", difficulty)
        .order("duration_seconds", { ascending: true })
        .limit(1);

      const existing = bestRecords && bestRecords.length > 0 ? bestRecords[0] : null;

      if (!existing) {
        // First time finishing this difficulty
        const { error } = await supabase.from("workout_results").insert({
          user_id: user.id,
          score: scoreRef.current,
          duration_seconds: finalDuration,
          difficulty: difficulty,
        });
        if (error) toast.error("Failed to save: " + error.message);
        else router.refresh();
      } else if (finalDuration < existing.duration_seconds) {
        // New personal best time!
        const { error } = await supabase
          .from("workout_results")
          .update({
            score: scoreRef.current,
            duration_seconds: finalDuration,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        
        if (error) toast.error("Failed to save personal best: " + error.message);
        else {
          toast.success("New Personal Best!");
          router.refresh();
        }
      }
    }
    setSaving(false);
  }, [supabase, difficulty]);

  // ── Timer while playing ──
  useEffect(() => {
    if (gameState !== "playing") return;
    // Elapsed counter (progressive)
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [gameState, finishGame]);

  // ── Keyboard support ──
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input elsewhere (though not likely in this UI)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        pressKey(key);
      } else if (key === "Backspace") {
        pressKey("⌫");
      } else if (key === "Enter" || key === "=") {
        pressKey("=");
      } else if (key.toLowerCase() === "c") {
        pressKey("C");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, feedback, input, current]); // Re-bind when state changes to ensure pressKey has fresh context if needed (though pressKey uses state setters)


  function startGame() {
    const qs = generateQuestions(difficulty);
    setQuestions(qs);
    setCurrent(0); setScore(0); scoreRef.current = 0;
    setPenalty(0); penaltyRef.current = 0;
    setInput(""); setElapsed(0);
    startRef.current = Date.now();
    setGameState("playing");
  }

  function pressKey(key: string) {
    if (feedback) return;
    if (key === "⌫") { setInput(p => p.slice(0, -1)); return; }
    if (key === "C")  { setInput(""); return; }
    if (key === "=")  { submitAnswer(); return; }
    if (input.length < 6) setInput(p => p + key);
  }

  function submitAnswer() {
    if (!input || feedback) return;
    const ans = parseInt(input);
    const correct = ans === questions[current].answer;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore(s => { scoreRef.current = s + 1; return s + 1; });
    } else {
      // +5 second penalty for wrong answer
      setPenalty(p => { penaltyRef.current = p + PENALTY_SECONDS; return p + PENALTY_SECONDS; });
    }
    setTimeout(() => {
      setFeedback(null); setInput("");
      if (current + 1 >= questions.length) finishGame(false);
      else setCurrent(c => c + 1);
    }, 600);
  }

  // ═══════════════════════════════════════════════════════
  // LOBBY
  // ═══════════════════════════════════════════════════════
  if (gameState === "lobby") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Brain size={26} color="#6366f1" />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Math Workout</h1>
          </div>
          <button 
            onClick={() => router.push("/")}
            style={{
              display: "flex", alignItems: "center", gap: 6, 
              background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)",
              padding: "8px 16px", borderRadius: 10, color: "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            <ChevronLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="lobby-grid">

          {/* ── LEFT: Difficulty + Start ── */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Choose Difficulty</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 18 }}>Affects question complexity &amp; number range</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(["easy", "normal", "hard"] as Difficulty[]).map(d => {
                const cfg = DIFF_CONFIG[d];
                const active = difficulty === d;
                return (
                  <button key={d} id={`btn-diff-${d}`} onClick={() => setDifficulty(d)} style={{
                    padding: "14px 18px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    background: active ? `${cfg.color}22` : "rgba(0,0,0,0.02)",
                    border: active ? `2px solid ${cfg.color}66` : "1px solid var(--border-color)",
                    transition: "all 0.2s", fontFamily: "Inter, sans-serif",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: active ? cfg.color : "var(--text-muted)",
                        flexShrink: 0, boxShadow: active ? `0 0 8px ${cfg.color}` : "none",
                      }} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: active ? cfg.color : "var(--text-secondary)" }}>{cfg.label}</span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, marginLeft: 20 }}>{cfg.desc}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#f59e0b" }}>
              ⚠️ Wrong answers add <strong>+{PENALTY_SECONDS}s</strong> to your final time
            </div>

            <button id="btn-start-workout" onClick={startGame} className="btn-primary" style={{
              width: "100%", marginTop: 20, padding: "15px", fontSize: 16, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.3px",
            }}>
              <Brain size={18} /> Start Workout
            </button>
          </div>

          {/* ── RIGHT: Leaderboard ── */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            {/* Header with Filter */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={18} color="#f59e0b" />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Rankings</h2>
              </div>
              {batches.length > 0 && (
                <select 
                  value={batchFilter} 
                  onChange={e => setBatchFilter(e.target.value)} 
                  style={{
                    background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)",
                    borderRadius: 8, color: "var(--text-primary)",
                    padding: "4px 8px", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}
                >
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>

            {/* ── TOP 3 PODIUM ── */}
            {filtered.length > 0 && (
              <div style={{ 
                padding: "32px 20px", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "flex-end", 
                gap: 20,
                background: "linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 100%)",
                borderBottom: "1px solid var(--border-color)",
                flexWrap: "wrap"
              }}>
                {/* 2nd Place (Left) */}
                {filtered[1] && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, order: 1 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ 
                        width: 70, height: 70, borderRadius: "50%", 
                        border: "3px solid #94a3b8", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "white", boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                      }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: "#475569" }}>{filtered[1].name.charAt(0)}</span>
                      </div>
                      <div style={{ position: "absolute", bottom: -8, right: -4, width: 24, height: 24, borderRadius: "50%", background: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 900, border: "2px solid white" }}>2</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{filtered[1].name}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 2 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDur(filtered[1].duration)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: filtered[1].score >= 18 ? "var(--success)" : "var(--warning)" }}>{filtered[1].score}/20</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place (Middle) */}
                {filtered[0] && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, order: 2, transform: "translateY(-20px)" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ 
                        width: 90, height: 90, borderRadius: "50%", 
                        border: "4px solid #f59e0b", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "white", boxShadow: "0 15px 30px rgba(245,158,11,0.2)"
                      }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>{filtered[0].name.charAt(0)}</span>
                      </div>
                      <div style={{ position: "absolute", bottom: -10, right: -6, width: 32, height: 32, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 900, border: "3px solid white" }}>1</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>{filtered[0].name}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 2 }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{formatDur(filtered[0].duration)}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: filtered[0].score >= 18 ? "var(--success)" : "var(--warning)" }}>{filtered[0].score}/20</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {filtered[2] && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, order: 3 }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ 
                        width: 70, height: 70, borderRadius: "50%", 
                        border: "3px solid #cd7f32", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "white", boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                      }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: "#a16207" }}>{filtered[2].name.charAt(0)}</span>
                      </div>
                      <div style={{ position: "absolute", bottom: -8, right: -4, width: 24, height: 24, borderRadius: "50%", background: "#cd7f32", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 900, border: "2px solid white" }}>3</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{filtered[2].name}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 2 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDur(filtered[2].duration)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: filtered[2].score >= 18 ? "var(--success)" : "var(--warning)" }}>{filtered[2].score}/20</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="responsive-table-container">
              <table className="data-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Name</th>
                    <th>Batch</th>
                    <th>Score</th>
                    <th>Time</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 14 }}>
                        No scores yet — be the first! 🏆
                      </td>
                    </tr>
                  ) : filtered.length <= 3 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 13 }}>
                        The top users are on the podium! 🏆
                      </td>
                    </tr>
                  ) : filtered.slice(3).map((e, i) => {
                    const rank = i + 4;
                    return (
                      <tr key={i}>
                        <td><span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{rank}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>
                              {e.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{e.name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-info">{e.batch || "—"}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, color: e.score >= 18 ? "#10b981" : e.score >= 10 ? "#f59e0b" : "var(--text-primary)" }}>
                            {e.score}<span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 400 }}>/20</span>
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatDur(e.duration)}</td>
                        <td><span className={`badge ${e.score >= 18 ? "badge-success" : e.score >= 10 ? "badge-warning" : "badge-danger"}`}>{Math.round((e.score / 20) * 100)}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // FINISHED
  // ═══════════════════════════════════════════════════════
  if (gameState === "finished") {
    const finalTime = elapsed + penalty;
    const accuracy = Math.round((score / 20) * 100);

    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
        <div className="glass-card animate-scale-in" style={{ width: "100%", maxWidth: 400, padding: 40, textAlign: "center" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#10b98122", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trophy size={32} color="#10b981" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-1px" }}>Workout Complete!</h1>
            <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Excellent mental effort today.</p>
          </div>

          {/* FINAL TIME — main metric */}
          <div style={{ marginBottom: 32, padding: "24px", borderRadius: 20, background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>Final Time</div>
            <div style={{ 
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto", 
              background: "linear-gradient(135deg, #10b981, #059669)", 
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(16,185,129,0.4)"
            }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-1px", lineHeight: 1 }}>
                {formatDur(finalTime)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>TOTAL</span>
            </div>
            {penalty > 0 && (
              <p style={{ color: "#f59e0b", fontSize: 12, marginTop: 10 }}>
                Includes <strong>+{penalty}s</strong> penalty ({penalty / PENALTY_SECONDS} wrong {penalty / PENALTY_SECONDS === 1 ? "answer" : "answers"})
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border-color)", margin: "20px 0" }} />

          {/* SCORE — secondary metric */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>Score</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: score >= 16 ? "#10b981" : score >= 10 ? "#f59e0b" : "#ef4444" }}>
                {score}<span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}>/20</span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>Accuracy</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: accuracy >= 80 ? "#10b981" : accuracy >= 50 ? "#f59e0b" : "#ef4444" }}>
                {accuracy}<span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}>%</span>
              </div>
            </div>
          </div>

          {saving && <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 16 }}>Saving result…</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button id="btn-play-again" onClick={() => setGameState("lobby")} className="btn-primary" style={{ flex: 1 }}>
              Play Again
            </button>
            <button id="btn-go-home" onClick={() => setGameState("lobby")} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border-color)",
              background: "transparent", color: "var(--text-primary)", fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PLAYING — Calculator UI
  // ═══════════════════════════════════════════════════════
  const q = questions[current];
  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  const KEYS = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], ["C", "0", "⌫"]];

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header: back / timer / score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { if (elapsedRef.current) clearInterval(elapsedRef.current); setGameState("lobby"); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
            <ChevronLeft size={16} /> Back
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 10, padding: "6px 14px",
            color: "var(--text-primary)",
            fontWeight: 700, fontSize: 20, fontVariantNumeric: "tabular-nums",
          }}>
            <Clock size={16} />{mins}:{secs}
          </div>

          <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 14 }}>Score: {score}</span>
        </div>

        {/* Penalty indicator */}
        {penalty > 0 && (
          <div style={{ textAlign: "center", color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>
            ⚠️ +{penalty}s penalty accumulated
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Question {current + 1} of 20</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12, textTransform: "capitalize" }}>{difficulty}</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
            <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", width: `${(current / 20) * 100}%`, transition: "width 0.4s" }} />
          </div>
        </div>

        {/* Calculator card */}
        <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Equation */}
          <div style={{ textAlign: "center", padding: "20px 10px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>Solve</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-2px", lineHeight: 1 }}>{q.text}</div>
          </div>

          {/* Answer display */}
          <div style={{
            textAlign: "center", padding: "14px 20px", borderRadius: 12, minHeight: 60,
            background: feedback === "correct" ? "rgba(16,185,129,0.15)" : feedback === "wrong" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.08)",
            border: feedback === "correct" ? "1px solid rgba(16,185,129,0.4)" : feedback === "wrong" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}>
            {feedback === "wrong" && (
              <div style={{ position: "absolute", color: "#ef4444", fontSize: 11, fontWeight: 700, top: 4, right: 8 }}>+{PENALTY_SECONDS}s</div>
            )}
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: feedback === "correct" ? "#10b981" : feedback === "wrong" ? "#ef4444" : "var(--text-primary)" }}>
              {input || <span style={{ opacity: 0.3 }}>?</span>}
            </span>
          </div>

          {/* Number pad */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {KEYS.map((row, ri) => (
              <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {row.map(key => {
                  const isAction = key === "⌫" || key === "C";
                  return (
                    <button key={key} id={`key-${key}`} onClick={() => pressKey(key)} disabled={!!feedback}
                      style={{
                        height: 62, borderRadius: 12, border: "1px solid var(--border-color)",
                        background: isAction ? "rgba(99,102,241,0.08)" : "rgba(0,0,0,0.02)",
                        color: isAction ? "var(--accent-primary)" : "var(--text-primary)",
                        fontSize: key === "⌫" ? 18 : 22, fontWeight: 700, cursor: "pointer",
                        fontFamily: "Inter, sans-serif", transition: "all 0.12s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; (e.currentTarget as HTMLButtonElement).style.background = isAction ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.08)"; }}
                      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = isAction ? "rgba(99,102,241,0.08)" : "rgba(0,0,0,0.02)"; }}
                    >
                      {key === "⌫" ? <Delete size={18} /> : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Submit */}
          <button id="key-equals" onClick={() => pressKey("=")} disabled={!input || !!feedback}
            style={{
              height: 58, borderRadius: 12, border: "none",
              cursor: (!input || !!feedback) ? "not-allowed" : "pointer",
              background: (!input || !!feedback) ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: (!input || !!feedback) ? "var(--text-muted)" : "white",
              fontSize: 17, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.05em",
              transition: "all 0.2s",
              boxShadow: (!input || !!feedback) ? "none" : "0 0 20px rgba(99,102,241,0.35)",
            }}>
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
}
