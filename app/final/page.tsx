"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser, QuizUser } from "@/lib/firestore/user";
import { useRouter } from "next/navigation";

function StatCard({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div
      className={`rounded-xl px-5 py-4 flex flex-col gap-1 border transition-all ${span ? "col-span-2" : ""}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/30">{label}</span>
      <span className="text-xl font-bold font-mono tracking-wide text-white/90">{value}</span>
    </div>
  );
}

export default function FinalPage() {
  const router = useRouter();
  const [user, setUser] = useState<QuizUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/"); return; }
      const data = await getUser(firebaseUser.uid);
      if (!data?.isAttended) { router.replace("/quiz"); return; }
      setUser(data);
      setLoading(false);
      setTimeout(() => setConfetti(true), 300);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-9 h-9 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
      </main>
    );
  }

  const answeredCount = user?.answers.filter((a) => a !== null).length ?? 0;
  const totalSec = Math.round((user?.cumulativeTimeMs ?? 0) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const skipped = 15 - answeredCount;
  const firstName = user?.displayName?.split(" ")[0] ?? "Champ";
  const completionPct = Math.round((answeredCount / 15) * 100);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .panel-in { animation: panelIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .stat-in  { animation: statIn 0.4s ease-out both; }
        .stat-in:nth-child(1) { animation-delay: 0.25s; }
        .stat-in:nth-child(2) { animation-delay: 0.32s; }
        .stat-in:nth-child(3) { animation-delay: 0.39s; }
        .confetti-piece {
          position: fixed;
          border-radius: 2px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 50;
        }
      `}</style>

      {/* Celebration confetti on load */}
      {confetti && Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}px`,
            background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#ef4444" : "#F5C518",
            animationDuration: `${2.2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.6}s`,
            width: `${5 + Math.random() * 5}px`,
            height: `${5 + Math.random() * 5}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            opacity: 0.85,
          }}
        />
      ))}

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        {/* BG */}
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.18] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-blue-700/10 blur-[110px] -z-10" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-red-700/10 blur-[110px] -z-10" />

        <div className="panel-in w-full max-w-lg rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl"
          style={{ background: "rgba(7,10,24,0.92)", backdropFilter: "blur(28px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.85)" }}>

          {/* Top bar */}
          <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,#3b82f6,#ef4444,transparent)", backgroundSize: "200% 100%", animation: "shimmer 5s linear infinite" }} />

          <div className="px-7 md:px-10 pt-8 pb-9 flex flex-col gap-9">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc" width={64} height={24} className="object-contain opacity-50" />
              <span className="text-[9px] text-white/25 font-mono uppercase tracking-[0.25em]">FIFA WC Quiz</span>
            </div>

            {/* Hero: progress bar + headline */}
            <div className="flex flex-col items-center gap-5 w-full">

              {/* Completion progress bar */}
              <div className="w-full max-w-xs flex flex-col gap-1.5">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${completionPct}%`,
                      background: "linear-gradient(90deg, #2563eb, #dc2626)",
                      boxShadow: "0 0 10px rgba(37,99,235,0.5)",
                    }}
                  />
                </div>
                <p className="text-[11px] text-white/25 font-mono text-center">{completionPct}% complete</p>
              </div>

              <div className="text-center">
                <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2"
                  style={{
                    background: "linear-gradient(135deg, #60a5fa, #f87171)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                  🏆 FIFA WC Quiz
                </div>
                <h1 className="text-2xl md:text-[1.75rem] font-bold text-white tracking-tight leading-snug">
                  Nice work, <span style={{
                    background: "linear-gradient(135deg, #60a5fa, #f87171)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>{firstName}</span>
                </h1>
                <p className="text-white/35 text-[13px] mt-1.5 leading-relaxed">
                  Your answers have been submitted for review.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <div className="stat-in">
                <StatCard label="Answered" value={`${answeredCount} / 15`} />
              </div>
              <div className="stat-in">
                <StatCard label="Skipped" value={`${skipped}`} />
              </div>
              <div className="stat-in col-span-2">
                <StatCard label="Time Taken" value={`${mm}:${ss}`} span />
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-xl px-5 py-3.5 border text-center"
              style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-white/30 text-[12px] leading-relaxed">
                Results will be verified by our team and the leaderboard announced shortly.
              </p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}