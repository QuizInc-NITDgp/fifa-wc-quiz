"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  fetchQuestions,
  fetchQuizConfig,
  isWindowOpen,
  QuizQuestion,
  QuizConfig,
} from "@/lib/firestore/questions";
import { getUser, saveAnswer, submitQuiz } from "@/lib/firestore/user";
import QuestionCard from "@/app/components/QuestionCard";
import ProgressBar from "@/app/components/ProgressBar";
import Timer from "@/app/components/Timer";

// ─── Per-question time limit (seconds) ────────────────────────────────────────
// Pulled from Firestore config; fallback to 45s
const FALLBACK_PER_Q_SECONDS = 45;

type QuizState = "loading" | "closed" | "ready" | "active" | "done";

export default function QuizPage() {
  const router = useRouter();

  // ── Auth + user ──────────────────────────────────────────────────────────
  const [uid, setUid] = useState<string | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("loading");

  // ── Progress ─────────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0); // 0-based
  const [answers, setAnswers] = useState<(string | null)[]>(Array(15).fill(null));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false); // locked after submit/skip/timeout

  // ── Timing ───────────────────────────────────────────────────────────────
  const questionStartMs = useRef<number>(Date.now());
  const cumulativeMs = useRef<number>(0);
  const [perQSeconds, setPerQSeconds] = useState(FALLBACK_PER_Q_SECONDS);
  const [timerKey, setTimerKey] = useState(0); // bump to reset timer

  // ─── 1. Auth gate ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      setUid(user.uid);

      // If user already attended → send to final
      const userData = await getUser(user.uid);
      if (userData?.isAttended) {
        router.replace("/final");
        return;
      }
      // Restore cumulative time if they refreshed mid-quiz
      if (userData?.cumulativeTimeMs) {
        cumulativeMs.current = userData.cumulativeTimeMs;
      }
      // Restore answers if they refreshed mid-quiz
      if (userData?.answers) {
        setAnswers(userData.answers);
        // Find first unanswered question
        const firstUnanswered = userData.answers.findIndex((a) => a === null);
        setCurrentIdx(firstUnanswered === -1 ? 14 : firstUnanswered);
      }
    });
    return () => unsub();
  }, [router]);

  // ─── 2. Load questions + config ───────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const [qs, cfg] = await Promise.all([fetchQuestions(), fetchQuizConfig()]);
      setQuestions(qs);
      setConfig(cfg);

      if (cfg) {
        setPerQSeconds(cfg.perQuestionSeconds ?? FALLBACK_PER_Q_SECONDS);
        if (!isWindowOpen(cfg)) {
          setQuizState("closed");
          return;
        }
      }

      setQuizState("ready");
    })();
  }, [uid]);

  // ─── Start quiz ───────────────────────────────────────────────────────────
  const startQuiz = useCallback(() => {
    questionStartMs.current = Date.now();
    setTimerKey((k) => k + 1);
    setQuizState("active");
  }, []);

  // ─── Advance to next question or finish ───────────────────────────────────
  const advanceOrFinish = useCallback(
    async (chosenAnswer: string | null) => {
      if (!uid) return;

      const elapsedMs = Date.now() - questionStartMs.current;
      cumulativeMs.current += elapsedMs;

      // Persist this answer
      await saveAnswer(uid, currentIdx, chosenAnswer, elapsedMs);

      const updatedAnswers = [...answers];
      updatedAnswers[currentIdx] = chosenAnswer;
      setAnswers(updatedAnswers);

      const nextIdx = currentIdx + 1;

      if (nextIdx >= questions.length) {
        // ── All questions done → submit ──────────────────────────────────
        await submitQuiz(uid, updatedAnswers, cumulativeMs.current);
        setQuizState("done");
        router.replace("/final");
      } else {
        // ── Next question ────────────────────────────────────────────────
        setSelectedOption(null);
        setIsLocked(false);
        setCurrentIdx(nextIdx);
        questionStartMs.current = Date.now();
        setTimerKey((k) => k + 1); // reset timer
      }
    },
    [uid, currentIdx, answers, questions.length, router]
  );

  // ─── User clicks Submit ───────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isLocked || !selectedOption) return;
    setIsLocked(true);
    advanceOrFinish(selectedOption);
  }, [isLocked, selectedOption, advanceOrFinish]);

  // ─── User clicks Skip ─────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (isLocked) return;
    setIsLocked(true);
    advanceOrFinish(null);
  }, [isLocked, advanceOrFinish]);

  // ─── Timer runs out ───────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (isLocked) return;
    setIsLocked(true);
    advanceOrFinish(selectedOption); // whatever was selected (possibly null)
  }, [isLocked, selectedOption, advanceOrFinish]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const answeredCount = answers.filter((a) => a !== null).length;
  const currentQuestion: QuizQuestion | undefined = questions[currentIdx];

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER ──────────────────────────────────────────────────────────────────

  // Loading
  if (quizState === "loading" || (quizState === "ready" && !currentQuestion)) {
    return (
      <LoadingScreen message="Setting up your quiz…" />
    );
  }

  // Quiz window closed
  if (quizState === "closed") {
    const openTime = config ? new Date(config.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
    const closeTime = config ? new Date(config.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
    return (
      <ClosedScreen openTime={openTime} closeTime={closeTime} />
    );
  }

  // Splash before starting
  if (quizState === "ready") {
    return (
      <ReadyScreen
        total={questions.length}
        perQSeconds={perQSeconds}
        onStart={startQuiz}
      />
    );
  }

  // Active quiz
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      {/* Background image */}
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-[0.15] -z-10" priority />

      {/* Ambient blobs */}
      <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <header
        className="w-full max-w-2xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between gap-4"
      >
        <div className="flex-1">
          <ProgressBar
            current={currentIdx + 1}
            total={questions.length}
            answered={answeredCount}
          />
        </div>

        <Timer
          key={timerKey}
          durationSeconds={perQSeconds}
          onTimeUp={handleTimeUp}
          isRunning={!isLocked}
        />
      </header>

      {/* ── Question card ────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mx-auto px-4 flex-1">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            selectedAnswer={selectedOption}
            onSelect={setSelectedOption}
            isLocked={isLocked}
          />
        )}
      </div>

      {/* ── Action buttons ───────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mx-auto px-4 py-6 flex gap-3">
        {/* Skip */}
        <button
          onClick={handleSkip}
          disabled={isLocked}
          className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: isLocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
            cursor: isLocked ? "not-allowed" : "pointer",
          }}
        >
          Skip →
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLocked || !selectedOption}
          className="flex-[2] py-3 rounded-lg text-sm font-bold transition-all"
          style={{
            background:
              !isLocked && selectedOption
                ? "#F5C518"
                : "rgba(245,197,24,0.12)",
            color:
              !isLocked && selectedOption
                ? "#0A0F1E"
                : "rgba(245,197,24,0.3)",
            cursor:
              isLocked || !selectedOption ? "not-allowed" : "pointer",
            border: "1px solid transparent",
            boxShadow:
              !isLocked && selectedOption
                ? "0 0 16px rgba(245,197,24,0.25)"
                : "none",
          }}
        >
          {currentIdx === questions.length - 1 ? "Submit Quiz" : "Confirm Answer"}
        </button>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Sub-screens ────────────────────────────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-[#F5C518] border-r-transparent border-b-transparent border-l-transparent animate-spin"
        />
        <p className="text-white/40 text-sm font-mono">{message}</p>
      </div>
    </main>
  );
}

function ClosedScreen({ openTime, closeTime }: { openTime: string; closeTime: string }) {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-[0.15] -z-10" />
      <div
        className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center"
        style={{
          background: "rgba(10, 10, 30, 0.85)",
          border: "1px solid rgba(245,197,24,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-[#F5C518] text-xl font-extrabold tracking-wide mb-2">
          QUIZ WINDOW CLOSED
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          The quiz is only available between{" "}
          <span className="text-white font-semibold">{openTime}</span> and{" "}
          <span className="text-white font-semibold">{closeTime}</span>.
          <br />Check back during the next session.
        </p>
      </div>
    </main>
  );
}

function ReadyScreen({
  total,
  perQSeconds,
  onStart,
}: {
  total: number;
  perQSeconds: number;
  onStart: () => void;
}) {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-[0.15] -z-10" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/30 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl -z-10" />

      <div
        className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center"
        style={{
          background: "rgba(10, 10, 30, 0.85)",
          border: "1px solid rgba(245,197,24,0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p className="text-[#F5C518] text-xs font-mono uppercase tracking-widest mb-3">
          Match of the Match
        </p>
        <h1 className="text-white text-3xl font-extrabold tracking-wide mb-1">
          Ready to play?
        </h1>
        <p className="text-white/40 text-sm mb-6">
          {total} questions · {perQSeconds}s per question
        </p>

        <ul className="text-left text-white/60 text-sm space-y-2 mb-8">
          {[
            "Each question has a countdown timer.",
            "You can skip a question — it counts as no answer.",
            "Once you confirm an answer you cannot go back.",
            "Your time is tracked across all questions.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: "#F5C518" }}
              />
              {tip}
            </li>
          ))}
        </ul>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-95"
          style={{
            background: "#F5C518",
            color: "#0A0F1E",
            boxShadow: "0 0 20px rgba(245,197,24,0.3)",
          }}
        >
          Start Quiz
        </button>
      </div>
    </main>
  );
}
