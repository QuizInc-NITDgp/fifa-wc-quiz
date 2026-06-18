"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser, QuizUser } from "@/lib/firestore/user";
import { useRouter } from "next/navigation";

function StatCard({ label, value, accent, span }: { label: string; value: string; accent?: string; span?: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 flex flex-col gap-1.5 border border-white/[0.06] transition-all hover:border-white/10 ${span ? "col-span-2" : ""}`}
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/30">{label}</span>
      <span
        className="text-2xl font-black font-mono tracking-wide"
        style={{
          background: accent || "linear-gradient(135deg, #3b82f6, #ef4444)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </span>
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
      setTimeout(() => setConfetti(true), 400);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-10 h-10 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
      </main>
    );
  }

  const answeredCount = user?.answers.filter((a) => a !== null).length ?? 0;
  const totalSec = Math.round((user?.cumulativeTimeMs ?? 0) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const skipped = 15 - answeredCount;
  const firstName = user?.displayName?.split(" ")[0] ?? "Champ";

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes trophyBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%     { transform: translateY(-6px) rotate(-3deg); }
          75%     { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes statIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .panel-in { animation: panelIn 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .trophy   { animation: trophyBounce 2s ease-in-out infinite; display:inline-block; }
        .stat-in  { animation: statIn 0.4s ease-out both; }
        .stat-in:nth-child(1) { animation-delay: 0.3s; }
        .stat-in:nth-child(2) { animation-delay: 0.4s; }
        .stat-in:nth-child(3) { animation-delay: 0.5s; }
        .confetti-piece {
          position: fixed;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 50;
        }
      `}</style>

      {/* Confetti */}
      {confetti && Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}px`,
            background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#ef4444" : "#F5C518",
            animationDuration: `${2 + Math.random() * 2.5}s`,
            animationDelay: `${Math.random() * 0.8}s`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            opacity: 0.9,
          }}
        />
      ))}

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        {/* BG */}
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[100px] -z-10" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-700/20 blur-[100px] -z-10" />

        <div className="panel-in w-full max-w-3xl rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{ background: "rgba(6,9,26,0.9)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)" }}>

          {/* Top bar */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          <div className="p-7 md:p-10 flex flex-col gap-8">

            {/* Logo */}
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc" width={70} height={26} className="object-contain opacity-70" />
              <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">FIFA WC Quiz</span>
            </div>

            {/* Hero */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="trophy text-3xl md:text-4xl  text-amber-300 ">🏆FIFA WC QUIZ🏆</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Full Time!
                </h1>
                <p className="text-white/40 text-sm mt-1.5">
                  Great match,{" "}
                  <span className="text-white/70 font-semibold">{firstName}</span>
                  {" "}— your answers are in.
                </p>
              </div>

              {/* Score bar */}
              <div className="w-full max-w-xs h-2 rounded-full overflow-hidden mt-1"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(answeredCount / 15) * 100}%`,
                    background: "linear-gradient(90deg, #2563eb, #dc2626)",
                    boxShadow: "0 0 10px rgba(37,99,235,0.5)",
                  }}
                />
              </div>
              <p className="text-[11px] text-white/25 -mt-1 font-mono">{answeredCount} of 15 answered</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="stat-in">
                <StatCard label="Answered" value={`${answeredCount} / 15`} />
              </div>
              <div className="stat-in">
                <StatCard label="Skipped" value={`${skipped}`} accent="linear-gradient(135deg,#f59e0b,#ef4444)" />
              </div>
              <div className="stat-in col-span-2">
                <StatCard label="Time Taken" value={`${mm}:${ss}`} span />
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-xl px-5 py-4 border border-blue-500/10 text-center"
              style={{ background: "rgba(59,130,246,0.04)" }}>
              <p className="text-white/35 text-xs leading-relaxed">
                🔍 Your answers have been recorded and will be verified by our team.
                Results and leaderboard will be announced shortly.
              </p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}