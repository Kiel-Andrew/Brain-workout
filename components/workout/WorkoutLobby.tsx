"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trophy, Clock, Brain, ChevronLeft, Delete } from "lucide-react";

type LeaderboardEntry = { name: string; score: number; duration: number; batch: string | null };
type Difficulty = "easy" | "normal" | "hard";
type GameState = "lobby" | "playing" | "finished";
type Question = { text: string; answer: number };

const MEDALS = ["🥇", "🥈", "🥉"];
const PENALTY_SECONDS = 5;

const DIFF_CONFIG = {
  easy:   { label: "Easy",   color: "#10b981", desc: "Addition & Subtraction (1–20)",  ops: ["+", "-"] as const,       maxA: 20, maxB: 10 },
  normal: { label: "Normal", color: "#f59e0b", desc: "All four operations (1–50)",      ops: ["+", "-", "×", "÷"] as const, maxA: 50, maxB: 12 },
  hard:   { label: "Hard",   color: "#ef4444", desc: "Advanced operations (1–100)",     ops: ["+", "-", "×", "÷"] as const, maxA: 100, maxB: 20 },
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
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [saving, setSaving] = useState(false);

  const scoreRef = useRef(0);
  const penaltyRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { penaltyRef.current = penalty; }, [penalty]);

  const filtered = batchFilter
    ? leaderboard.filter(e => e.batch === batchFilter)
    : leaderboard;

  // ── Save result and show finish screen ──
  const finishGame = useCallback(async (timedOut = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setGameState("finished");
    setSaving(true);
    const realElapsed = Math.round((Date.now() - startRef.current) / 1000);
    const finalDuration = realElapsed + penaltyRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("workout_results").insert({
        user_id: user.id,
        score: scoreRef.current,
        duration_seconds: finalDuration,
      });
      if (error) toast.error("Failed to save: " + error.message);
    }
    setSaving(false);
    if (timedOut) toast.error("Time's up!");
  }, [supabase]);

  // ── Timers while playing ──
  useEffect(() => {
    if (gameState !== "playing") return;
    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { finishGame(true); return 0; } return t - 1; });
    }, 1000);
    // Elapsed counter
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [gameState, finishGame]);

  function startGame() {
    const qs = generateQuestions(difficulty);
    setQuestions(qs);
    setCurrent(0); setScore(0); scoreRef.current = 0;
    setPenalty(0); penaltyRef.current = 0;
    setInput(""); setElapsed(0);
    setTimeLeft(timerSeconds); startRef.current = Date.now();
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
      setTimeLeft(t => Math.max(0, t - PENALTY_SECONDS)); // also deduct from countdown
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Brain size={26} color="#6366f1" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Math Workout</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" }}>

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
                    background: active ? `${cfg.color}22` : "rgba(255,255,255,0.03)",
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
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={18} color="#f59e0b" />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Top 10 Rankings</h2>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>— best time wins</span>
              </div>
              {batches.length > 0 && (
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)",
                  borderRadius: 8, color: batchFilter ? "var(--text-primary)" : "var(--text-muted)",
                  padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 14 }}>
                      No scores yet — be the first! 🏆
                    </td>
                  </tr>
                ) : filtered.map((e, i) => (
                  <tr key={i}>
                    <td>{i < 3 ? <span style={{ fontSize: 18 }}>{MEDALS[i]}</span> : <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</span>}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {e.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: e.score >= 18 ? "#10b981" : e.score >= 10 ? "#f59e0b" : "var(--text-primary)" }}>
                        {e.score}<span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 400 }}>/20</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatDur(e.duration)}</td>
                    <td><span className={`badge ${e.score >= 18 ? "badge-success" : e.score >= 10 ? "badge-warning" : "badge-danger"}`}>{Math.round((e.score / 20) * 100)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, gap: 24 }}>
        <div className="glass-card animate-fade-in" style={{ padding: "40px 48px", textAlign: "center", maxWidth: 440, width: "100%" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 28 }}>
            {accuracy >= 80 ? "🎉 Excellent!" : accuracy >= 50 ? "👍 Good Job!" : "💪 Keep Practicing!"}
          </h2>

          {/* TIME — primary metric */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>Final Time</div>
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(16,185,129,0.4)",
            }}>
              <Clock size={20} color="white" style={{ marginBottom: 4 }} />
              <span style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-1px", lineHeight: 1 }}>
                {formatDur(finalTime)}
              </span>
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
            <button id="btn-go-home" onClick={() => router.push("/")} style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid var(--border-color)",
              background: "transparent", color: "var(--text-primary)", fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              Home
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
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const pctTime = (timeLeft / timerSeconds) * 100;
  const KEYS = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], ["C", "0", "⌫"]];

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header: back / timer / score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); if (elapsedRef.current) clearInterval(elapsedRef.current); setGameState("lobby"); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
            <ChevronLeft size={16} /> Back
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: pctTime < 20 ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.12)",
            border: `1px solid ${pctTime < 20 ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.2)"}`,
            borderRadius: 10, padding: "6px 14px",
            color: pctTime < 20 ? "#ef4444" : "var(--text-primary)",
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
          <div style={{ textAlign: "center", padding: "20px 10px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 }}>Solve</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-2px", lineHeight: 1 }}>{q.text} =</div>
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
                        background: isAction ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.04)",
                        color: isAction ? "var(--accent-primary)" : "var(--text-primary)",
                        fontSize: key === "⌫" ? 18 : 22, fontWeight: 700, cursor: "pointer",
                        fontFamily: "Inter, sans-serif", transition: "all 0.12s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; (e.currentTarget as HTMLButtonElement).style.background = isAction ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.12)"; }}
                      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = isAction ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.04)"; }}
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
            SUBMIT  =
          </button>
        </div>
      </div>
    </div>
  );
}
