"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createUser, getUser } from "@/lib/firestore/user";

const RULES = [
  { icon: "", text: "1. The test consists of 20 questions, with 90 seconds allotted for each question" },
  { icon: "", text: "2. Questions may include text, images, or video. Read and watch carefully before answering" },
  { icon: "", text: "3. You cannot go back to a previous question once answered or skipped" },
  { icon: "", text: "4. Complete the quiz in one sitting. Closing the tab will not save your progress" },
  { icon: "", text: "5. In case of a tie, the participant with the lower cumulative time wins" },
  { icon: "", text: "6. Switching tabs or minimizing the window is not allowed. If detected, your quiz will be auto-submitted immediately" },
];

type WindowStatus = "loading" | "not_started" | "open" | "closed";

export default function InstructionsPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState("--:--:--");
  const [windowStatus, setWindowStatus] = useState<WindowStatus>("loading");
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      // Make sure the Firestore doc exists with the full schema before
      // we check any fields — prevents partial/broken docs.
      await createUser(user.uid, user.displayName || "Anonymous", user.email || "");
      const userData = await getUser(user.uid);
      if (userData?.isAttended) { router.replace("/final"); return; }
      // Profile guard
      if (!userData?.phone) { router.replace("/profile"); return; }
      setCheckingAccess(false);
    });
    return () => unsub();
  }, [router]);

  // Timer logic
  useEffect(() => {
    if (checkingAccess) return;

    let interval: ReturnType<typeof setInterval>;

    const fetchAndStartTimer = async () => {
      const snap = await getDoc(doc(db, "config", "quizWindow"));
      if (!snap.exists()) return;

      const data = snap.data();
      // Support both startTime and endTime in the config doc
      const startTime: Date | null = data.startTime ? data.startTime.toDate() : null;
      const endTime: Date = data.endTime.toDate();

      interval = setInterval(() => {
        const now = Date.now();
        const end = endTime.getTime();
        const start = startTime ? startTime.getTime() : null;

        if (now > end) {
          // Quiz window has closed
          setWindowStatus("closed");
          setTimeLeft("00:00:00");
          clearInterval(interval);
          return;
        }

        if (start && now < start) {
          // Quiz hasn't started yet — count down to start
          setWindowStatus("not_started");
          const diff = start - now;
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
          return;
        }

        // Quiz is live — count down to end
        setWindowStatus("open");
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }, 1000);
    };

    fetchAndStartTimer();
    return () => clearInterval(interval);
  }, [checkingAccess]);

  if (checkingAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-9 h-9 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
      </main>
    );
  }

  // Colors and labels per window status
  const statusConfig = {
    loading: { color: "#3b82f6", label: "Checking...", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
    not_started: { color: "#f59e0b", label: "Quiz goes live in", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    open: { color: "#22c55e", label: "Closes in", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" },
    closed: { color: "#ef4444", label: "Quiz Closed", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  }[windowStatus];

  const canStart = windowStatus === "open";

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
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .panel-in  { animation: panelIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .rule-item { animation: ruleIn 0.4s ease-out both; }
        ${RULES.map((_, i) => `.rule-item:nth-child(${i + 1}) { animation-delay: ${0.1 + i * 0.07}s; }`).join("\n")}
        .timer-tick { animation: timerTick 1s ease-in-out infinite; }
        .pulse-dot  { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[100px] -z-10" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-700/20 blur-[100px] -z-10" />

        <div className="panel-in relative w-full max-w-3xl rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{ background: "rgba(6,9,26,0.9)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)" }}>

          <div className="h-[2px]" style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          <div className="p-7 md:p-9 flex flex-col gap-7">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <Image src="/logo.jpg" alt="QuizInc" width={85} height={32} className="object-contain opacity-85" />

              {/* Status + Countdown badge */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all"
                style={{ background: statusConfig.bg, borderColor: statusConfig.border }}>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: statusConfig.color, opacity: 0.7 }}>
                    {statusConfig.label}
                  </span>
                  {windowStatus !== "closed" && (
                    <span className="font-black text-base leading-tight font-mono timer-tick" style={{ color: statusConfig.color }}>
                      {timeLeft}
                    </span>
                  )}
                  {windowStatus === "closed" && (
                    <span className="font-black text-sm leading-tight" style={{ color: statusConfig.color }}>
                      Ended
                    </span>
                  )}
                </div>
                {/* Live dot for open status */}
                {windowStatus === "open" && (
                  <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                )}
                {/* Waiting dot for not started */}
                {windowStatus === "not_started" && (
                  <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "#f59e0b", boxShadow: "0 0 6px #f59e0b" }} />
                )}
              </div>
            </div>

            {/* Not started banner */}
            {windowStatus === "not_started" && (
              <div className="rounded-xl px-5 py-4 border flex items-start gap-3"
                style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
                <div>
                  <p className="text-amber-400 font-bold text-sm">Quiz hasn't started yet</p>
                  <p className="text-amber-400/50 text-xs mt-0.5 leading-relaxed">
                    The quiz window opens soon. Stay on this page-the button will activate automatically when it begins.
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                RULES AND
                <span
                  className="ml-2 text-3xl md:text-4xl font-black tracking-tight leading-none" // Matches the exact size, tracking, and leading of RULES AND
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  REGULATIONS
                </span>
              </h1>
            </div>
            {/* Rules */}
            <div className="flex flex-col gap-2.5">
              {RULES.map((rule, i) => (
                <div key={i} className="rule-item flex items-start gap-3.5 rounded-xl px-4 py-3.5 border border-white/[0.05] group hover:border-blue-500/20 hover:bg-blue-500/[0.03] transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-white/55 text-sm leading-relaxed group-hover:text-white/70 transition-colors">{rule.text}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => canStart && router.push("/quiz")}
                disabled={!canStart}
                className="flex-[2] py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all duration-200"
                style={{
                  background: canStart
                    ? "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)"
                    : "rgba(255,255,255,0.04)",
                  border: canStart ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color: canStart ? "#ffffff" : "rgba(255,255,255,0.2)",
                  cursor: canStart ? "pointer" : "not-allowed",
                  boxShadow: canStart ? "0 4px 20px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                }}
              >
                {windowStatus === "not_started" && "⏳ Quiz Not Started"}
                {windowStatus === "open" && "⚽ Kick Off →"}
                {windowStatus === "closed" && "Quiz Closed"}
                {windowStatus === "loading" && "Loading..."}
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}