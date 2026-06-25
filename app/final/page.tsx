"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser, QuizUser } from "@/lib/firestore/user";
import { useRouter } from "next/navigation";

const SOCIALS = [
  {
    label: "WhatsApp Group",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    href: "https://chat.whatsapp.com/GzKPpQmJYFV7ag5sAgwUqS?s=sw&p=a&mlu=1",
    color: "#25D366",
    bg: "rgba(37,211,102,0.08)",
    border: "rgba(37,211,102,0.2)",
  },
  {
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    href: "https://www.instagram.com/quizincnitdgp/",
    color: "#E1306C",
    bg: "rgba(225,48,108,0.08)",
    border: "rgba(225,48,108,0.2)",
  },
  {
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    href: "https://www.facebook.com/quizinc.nitd/",
    color: "#1877F2",
    bg: "rgba(24,119,242,0.08)",
    border: "rgba(24,119,242,0.2)",
  },
  {
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    href: "https://in.linkedin.com/company/quizinc",
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.08)",
    border: "rgba(10,102,194,0.2)",
  },
];

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

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-9 h-9 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
      </main>
    );
  }

  const totalQuestions = user?.answers?.length ?? 15;
  const answeredCount = user?.answers ? user.answers.filter((a) => a !== null).length : 0;
  const skipped = totalQuestions - answeredCount;

  const totalSec = Math.round((user?.cumulativeTimeMs ?? 0) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const firstName = user?.displayName?.split(" ")[0] ?? "Champ";

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
        @keyframes socialIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel-in { animation: panelIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .stat-in  { animation: statIn 0.4s ease-out both; }
        .stat-in:nth-child(1) { animation-delay: 0.25s; }
        .stat-in:nth-child(2) { animation-delay: 0.32s; }
        .stat-in:nth-child(3) { animation-delay: 0.39s; }
        .social-in { animation: socialIn 0.4s ease-out both; }
        .social-in:nth-child(1) { animation-delay: 0.45s; }
        .social-in:nth-child(2) { animation-delay: 0.50s; }
        .social-in:nth-child(3) { animation-delay: 0.55s; }
        .social-in:nth-child(4) { animation-delay: 0.60s; }
        .confetti-piece {
          position: fixed;
          border-radius: 2px;
          animation: confettiFall linear forwards;
          pointer-events: none;
          z-index: 50;
        }
        .social-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .social-btn:hover { transform: translateY(-2px); opacity: 0.85; }
      `}</style>

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
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.18] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-blue-700/10 blur-[110px] -z-10" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-red-700/10 blur-[110px] -z-10" />

        <div className="panel-in w-full max-w-lg rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl"
          style={{ background: "rgba(7,10,24,0.92)", backdropFilter: "blur(28px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 100px rgba(0,0,0,0.85)" }}>

          <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,#3b82f6,#ef4444,transparent)", backgroundSize: "200% 100%", animation: "shimmer 5s linear infinite" }} />

          <div className="px-7 md:px-10 pt-8 pb-9 flex flex-col gap-7">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc logo" width={85} height={32} className="object-contain opacity-85 bg-transparent" />
            </div>

            {/* Hero */}
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="text-center">
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
              <div className="stat-in"><StatCard label="Answered" value={`${answeredCount} / ${totalQuestions}`} /></div>
              <div className="stat-in"><StatCard label="Skipped" value={`${skipped}`} /></div>
              <div className="stat-in col-span-2"><StatCard label="Time Taken" value={`${mm}:${ss}`} span /></div>
            </div>

            {/* Notice */}
            <div className="rounded-xl px-5 py-4 border"
              style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-white/50 text-[12px] leading-relaxed text-center">
                Leaderboard will be announced shortly on our{" "}
                <a
                  href="https://chat.whatsapp.com/GzKPpQmJYFV7ag5sAgwUqS?s=sw&p=a&mlu=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 font-semibold hover:underline transition-all"
                >
                  WhatsApp Group
                </a>{" "}
                and{" "}
                <a
                  href="https://www.instagram.com/quizincnitdgp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 font-semibold hover:underline transition-all"
                >
                  Instagram Story
                </a>
                . Stay Qrious!
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest">Connect With Us</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Social links */}
            <div className="grid grid-cols-2 gap-2.5">
              {SOCIALS.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-in social-btn flex items-center gap-3 rounded-xl px-4 py-3 border"
                  style={{
                    background: s.bg,
                    borderColor: s.border,
                    color: s.color,
                    textDecoration: "none",
                  }}
                >
                  {s.icon}
                  <span className="text-[11px] font-bold tracking-wide">{s.label}</span>
                </a>
              ))}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full text-center text-white/25 hover:text-white/50 text-[11px] font-semibold uppercase tracking-[0.15em] py-1 transition-colors cursor-pointer"
            >
              Sign out
            </button>

          </div>
        </div>
      </main>
    </>
  );
}