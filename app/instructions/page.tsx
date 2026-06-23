"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getUser } from "@/lib/firestore/user";

const RULES = [
  { icon: "📋", text: "There are 15 questions in total — all must be answered within the quiz window." },
  { icon: "🎬", text: "Questions may include text, images, or video. Read and watch carefully before answering." },
  { icon: "🔒", text: "You cannot go back to a previous question once answered or skipped." },
  { icon: "⚡", text: "Complete the quiz in one sitting. Closing the tab will not save your progress." },
  { icon: "⏱️", text: "Your cumulative time is recorded and used for leaderboard ranking." },
];



export default function InstructionsPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [expired, setExpired] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Guard: must be signed in, and must not have already attempted the quiz.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      const userData = await getUser(user.uid);
      if (userData?.isAttended) { router.replace("/final"); return; }
      setCheckingAccess(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (checkingAccess) return;
    const fetchAndStartTimer = async () => {
      const snap = await getDoc(doc(db, "config", "quizWindow"));
      if (!snap.exists()) return;
      const endTime = snap.data().endTime.toDate();
      const interval = setInterval(() => {
        const diff = endTime.getTime() - Date.now();
        if (diff <= 0) { setTimeLeft("00:00:00"); setExpired(true); clearInterval(interval); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      }, 1000);
      return () => clearInterval(interval);
    };
    fetchAndStartTimer();
  }, [checkingAccess]);

  if (checkingAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <div className="w-9 h-9 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ruleIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes timerTick {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.04); }
        }
        .panel-in  { animation: panelIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .rule-item { animation: ruleIn 0.4s ease-out both; }
        ${RULES.map((_,i) => `.rule-item:nth-child(${i+1}) { animation-delay: ${0.1 + i*0.07}s; }`).join("\n")}
        .timer-tick { animation: timerTick 1s ease-in-out infinite; }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        {/* BG */}
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[100px] -z-10" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-700/20 blur-[100px] -z-10" />

        <div className="panel-in relative w-full max-w-3xl rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{ background: "rgba(6,9,26,0.9)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)" }}>

          {/* Top gradient bar */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          <div className="p-7 md:p-9 flex flex-col gap-7">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <Image src="/logo.jpg" alt="QuizInc" width={80} height={34} className="object-contain opacity-85" />

              {/* Countdown */}
              <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all ${expired ? "bg-red-900/20 border-red-700/30" : "bg-white/[0.03] border-white/10"}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: expired ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)" }}>
                  ⏱️
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-white/30">Quiz Window</span>
                  <span className={`font-black text-base leading-tight font-mono timer-tick ${expired ? "text-red-500" : "text-white"}`}>
                    {expired ? "CLOSED" : timeLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-2xl">⚽</span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-400">FIFA World Cup Quiz</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                How to
                <span className="ml-2" style={{
                  background: "linear-gradient(135deg, #3b82f6, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>Play</span>
              </h1>
              <p className="text-red-400/80 text-xs mt-2 font-medium tracking-wide">
                ⚠ Read all instructions before you kick off
              </p>
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-2.5">
              {RULES.map((rule, i) => (
                <div key={i} className="rule-item flex items-start gap-3.5 rounded-xl px-4 py-3.5 border border-white/[0.05] group hover:border-blue-500/20 hover:bg-blue-500/[0.03] transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-base flex-shrink-0 mt-0.5">{rule.icon}</span>
                  <p className="text-white/55 text-sm leading-relaxed group-hover:text-white/70 transition-colors">{rule.text}</p>
                </div>
              ))}
            </div>

            

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wider border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 hover:bg-white/[0.03] transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                ← Go Back
              </button>
              <button
                onClick={() => !expired && router.push("/quiz")}
                disabled={expired}
                className="flex-[2] py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all duration-200"
                style={{
                  background: expired
                    ? "rgba(255,255,255,0.04)"
                    : "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)",
                  border: expired ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(59,130,246,0.3)",
                  color: expired ? "rgba(255,255,255,0.2)" : "#ffffff",
                  cursor: expired ? "not-allowed" : "pointer",
                  boxShadow: expired ? "none" : "0 4px 20px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                {expired ? "Quiz Closed" : "⚽ Kick Off →"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}