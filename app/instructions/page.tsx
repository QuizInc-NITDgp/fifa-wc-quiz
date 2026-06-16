"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function InstructionsPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const fetchAndStartTimer = async () => {
      const snap = await getDoc(doc(db, "config", "quizWindow"));

      if (!snap.exists()) return;

      const endTime = snap.data().endTime.toDate(); // Firestore Timestamp → JS Date

      const interval = setInterval(() => {
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft("00:00:00");
          setExpired(true);
          clearInterval(interval);
          return;
        }

        const h = Math.floor(diff / 1000 / 60 / 60);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);

        setTimeLeft(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      }, 1000);

      return () => clearInterval(interval);
    };

    fetchAndStartTimer();
  }, []);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-40 -z-10" priority />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />

      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl overflow-hidden border border-blue-500/30 p-8 flex flex-col gap-6"
        style={{ background: "rgba(10, 10, 30, 0.85)", backdropFilter: "blur(12px)" }}
      >
        {/* Logo + Timer */}
        <div className="flex items-center justify-between">
          <Image src="/logo.jpg" alt="QuizInc logo" width={80} height={36} className="object-contain" />

          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 border ${expired ? "bg-red-900/30 border-red-700/40" : "bg-red-500/10 border-red-500/30"}`}>
            <span className="text-red-400 text-lg">⏱️</span>
            <div className="flex flex-col items-center">
              <span className="text-red-400 text-xs font-medium tracking-wide uppercase">Quiz Window</span>
              <span className={`font-bold text-lg leading-none ${expired ? "text-red-500" : "text-white"}`}>
                {expired ? "EXPIRED" : timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-[#F5C518] text-4xl font-extrabold tracking-wide uppercase">
            How to Play
          </h1>
          <p className="text-red-400 text-sm mt-1 font-medium">
            Read the instructions carefully before you start!
          </p>
        </div>

        {/* Instructions */}
        <ul className="text-gray-200 text-sm space-y-3 list-disc list-inside leading-relaxed">
          <li>There are 15 questions in total. Each question must be answered within the quiz window.</li>
          <li>Questions may include text, images, or video formats. Read/watch carefully before answering.</li>
          <li>You cannot go back to a previous question once answered or skipped.</li>
          <li>The quiz must be completed in one sitting. Closing the tab will not save your progress.</li>
          <li>Your cumulative time will be recorded and used for leaderboard ranking.</li>
        </ul>

        {/* Warning badges */}
        <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex-wrap">
          <span>⚠️ <span className="text-yellow-400 font-semibold">No skipping questions</span></span>
          <span>🔄 <span className="text-blue-400 font-semibold">No going back</span></span>
          <span>✅ <span className="text-green-400 font-semibold">One attempt per quiz</span></span>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => !expired && router.push("/quiz")}
            disabled={expired}
            className={`flex-1 py-3 rounded-full font-bold text-sm tracking-widest border hover:border-2 transition-all
              ${expired
                ? "text-gray-500 border-gray-700 cursor-not-allowed"
                : "text-[#F5C518] border-[#F5C518]/40 hover:bg-[#F5C518]/10 cursor-pointer "
              }`}
            style={{ background: "rgba(20, 20, 60, 0.8)" }}
          >
            {expired ? "QUIZ CLOSED" : "START QUIZ"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-3 rounded-full cursor-pointer hover:border-2 font-bold text-gray-300 text-sm tracking-widest border border-white/20 hover:bg-white/5 transition-all"
            style={{ background: "rgba(30, 30, 30, 0.8)" }}
          >
            GO BACK
          </button>
        </div>

      </div>
    </main>
  );
}