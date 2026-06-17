"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser, QuizUser } from "@/lib/firestore/user";
import { useRouter } from "next/navigation";

export default function FinalPage() {
  const router = useRouter();
  const [user, setUser] = useState<QuizUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }
      const data = await getUser(firebaseUser.uid);
      if (!data?.isAttended) {
        // Shouldn't be here without completing quiz
        router.replace("/quiz");
        return;
      }
      setUser(data);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-[#F5C518] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </main>
    );
  }

  const answeredCount = user?.answers.filter((a) => a !== null).length ?? 0;
  const totalSec = Math.round((user?.cumulativeTimeMs ?? 0) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <Image
        src="/bg.jpg"
        alt="background"
        fill
        className="object-cover brightness-40 -z-10"
        priority
      />

      {/* Ambient blobs — same as login */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />

      <div
        className="flex max-w-3xl w-full mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10, 10, 30, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(245,197,24,0.25)",
        }}
      >
        {/* Left — poster panel */}
        <div className="relative flex-1 min-h-[420px] hidden sm:block">
          <Image src="/poster.jpg" alt="football legends" fill className="object-cover" />
          <div className="absolute inset-0 border-2 border-[#F5C518]/30 rounded-l-2xl" />
          {/* Gold shimmer overlay */}
          <div
            className="absolute inset-0 rounded-l-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,197,24,0.08) 0%, transparent 60%)",
            }}
          />
        </div>

        {/* Right — result panel */}
        <div className="flex-1 flex flex-col justify-center gap-6 p-8">
          {/* Logo */}
          <Image
            src="/quizinc.jpg"
            alt="QuizInc logo"
            width={100}
            height={36}
            className="object-contain"
          />

          {/* Trophy + headline */}
          <div>
            <div className="text-5xl mb-2">🏆</div>
            <h1
              className="text-3xl font-extrabold tracking-wide drop-shadow-lg"
              style={{ color: "#F5C518" }}
            >
              QUIZ COMPLETE!
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Great effort, {user?.displayName?.split(" ")[0] ?? "champ"}!
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Answered" value={`${answeredCount} / 15`} />
            <StatCard label="Skipped" value={`${15 - answeredCount}`} />
            <StatCard label="Time taken" value={`${mm}:${ss}`} span />
          </div>

          {/* Admin check notice */}
          <div
            className="rounded-lg px-4 py-3 text-xs text-white/50 leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Your answers have been recorded. Results will be verified by our
            team and announced shortly. Stay tuned!
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 flex flex-col gap-1 ${span ? "col-span-2" : ""}`}
      style={{
        background: "rgba(245,197,24,0.07)",
        border: "1px solid rgba(245,197,24,0.15)",
      }}
    >
      <span className="text-white/40 text-xs uppercase tracking-widest font-mono">
        {label}
      </span>
      <span className="text-[#F5C518] text-xl font-extrabold font-mono">
        {value}
      </span>
    </div>
  );
}