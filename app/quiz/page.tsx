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
import { createUser, getUser, saveAnswer, submitQuiz } from "@/lib/firestore/user";
import QuestionCard from "@/app/components/QuestionCard";
import ProgressBar from "@/app/components/ProgressBar";
import Timer from "@/app/components/Timer";

const FALLBACK_PER_Q_SECONDS = 45;
type QuizState = "loading" | "closed" | "active" | "done" | "no-questions";

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
      <style>{`
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex flex-col items-center gap-5" style={{ animation: "fadeUp 0.5s ease-out" }}>
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid transparent",
              borderTopColor: "#3b82f6",
              borderRightColor: "rgba(239,68,68,0.4)",
              animation: "spinRing 0.9s linear infinite",
            }}
          />
          <div className="absolute inset-3 flex items-center justify-center text-xl">⚽</div>
        </div>
        <p className="text-white/30 text-xs font-mono tracking-widest uppercase">{message}</p>
      </div>
    </main>
  );
}

function ClosedScreen({ openTime, closeTime }: { openTime: string; closeTime: string }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundLayers />
      <div className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center border border-blue-500/20 shadow-2xl"
        style={{ background: "rgba(6,9,26,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="text-5xl mb-5 animate-bounce">⏰</div>
        <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-widest uppercase mb-4">
          Window Closed
        </div>
        <h1 className="text-white text-xl font-black mb-3">Quiz Not Available</h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Available between{" "}
          <span className="text-blue-400 font-semibold">{openTime}</span> and{" "}
          <span className="text-red-400 font-semibold">{closeTime}</span>.
        </p>
      </div>
    </main>
  );
}

function NoQuestionsScreen() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundLayers />
      <div className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center border border-blue-500/20 shadow-2xl"
        style={{ background: "rgba(6,9,26,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="text-5xl mb-5">📋</div>
        <h1 className="text-[#F5C518] text-lg font-black mb-2">No Questions Yet</h1>
        <p className="text-white/40 text-sm">
          Add questions to the <span className="text-white/70 font-mono">"questions"</span> Firestore collection.
        </p>
      </div>
    </main>
  );
}

function BackgroundLayers() {
  return (
    <>
      <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.25] -z-10" priority />
      {/* Pitch-line overlay */}
      <div className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.6) 60px, rgba(255,255,255,0.6) 61px)",
        }}
      />
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/25 blur-[80px] -z-10" />
      <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-600/25 blur-[80px] -z-10" />
      {/* Center circle hint */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03] -z-10" />
    </>
  );
}

export default function QuizPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("loading");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const questionStartMs = useRef<number>(Date.now());
  const cumulativeMs = useRef<number>(0);
  const [perQSeconds, setPerQSeconds] = useState(FALLBACK_PER_Q_SECONDS);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }
      setUid(user.uid);
      try {
        let userData = await getUser(user.uid);
        const [fetchedQuestions, fetchedConfig] = await Promise.all([
          fetchQuestions(),
          fetchQuizConfig(),
        ]);

        if (!userData && fetchedQuestions) {
          await createUser(user.uid, user.displayName || "Anonymous", user.email || "");
          userData = await getUser(user.uid);
        }

        if (userData?.isAttended) { router.replace("/final"); return; }

        if (fetchedConfig) {
          setPerQSeconds(fetchedConfig.perQuestionSeconds ?? FALLBACK_PER_Q_SECONDS);
          if (!isWindowOpen(fetchedConfig)) {
            setConfig(fetchedConfig);
            setQuizState("closed");
            return;
          }
        }

        if (!fetchedQuestions || fetchedQuestions.length === 0) {
          setQuizState("no-questions");
          return;
        }

        setQuestions(fetchedQuestions);
        setConfig(fetchedConfig);

        if (userData?.cumulativeTimeMs) cumulativeMs.current = userData.cumulativeTimeMs;

        if (userData?.answers && userData.answers.length > 0) {
          setAnswers(userData.answers);
          const first = userData.answers.findIndex((a) => a === null);
          setCurrentIdx(Math.max(0, Math.min(first === -1 ? fetchedQuestions.length - 1 : first, fetchedQuestions.length - 1)));
        } else {
          setAnswers(Array(fetchedQuestions.length).fill(null));
          setCurrentIdx(0);
        }

        questionStartMs.current = Date.now();
        setTimerKey((k) => k + 1);
        setQuizState("active");
      } catch (err) {
        console.error("Quiz init error:", err);
      }
    });
    return () => unsub();
  }, [router]);

  const advanceOrFinish = useCallback(async (chosenAnswer: string | null) => {
    if (!uid || questions.length === 0) return;
    const elapsedMs = Date.now() - questionStartMs.current;
    cumulativeMs.current += elapsedMs;

    await saveAnswer(uid, currentIdx, chosenAnswer, elapsedMs);

    const updatedAnswers = [...answers];
    updatedAnswers[currentIdx] = chosenAnswer;
    setAnswers(updatedAnswers);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      await submitQuiz(uid, updatedAnswers, cumulativeMs.current);
      setQuizState("done");
      router.replace("/final");
    } else {
      setSelectedOption(null);
      setIsLocked(false);
      setCurrentIdx(nextIdx);
      setCardKey((k) => k + 1);
      questionStartMs.current = Date.now();
      setTimerKey((k) => k + 1);
      setQuizState("active");
    }
  }, [uid, currentIdx, answers, questions.length, router]);

  const handleSubmit = useCallback(() => {
    if (isLocked || !selectedOption) return;
    setIsLocked(true);
    advanceOrFinish(selectedOption);
  }, [isLocked, selectedOption, advanceOrFinish]);

  const handleSkip = useCallback(() => {
    if (isLocked) return;
    setIsLocked(true);
    advanceOrFinish(null);
  }, [isLocked, advanceOrFinish]);

  const handleTimeUp = useCallback(() => {
    if (isLocked) return;
    setIsLocked(true);
    advanceOrFinish(selectedOption);
  }, [isLocked, selectedOption, advanceOrFinish]);

  if (quizState === "loading") return <LoadingScreen message="Setting up your quiz..." />;
  if (quizState === "no-questions") return <NoQuestionsScreen />;
  if (quizState === "closed") {
    const fmt = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return <ClosedScreen openTime={config ? fmt(config.windowStart) : "--"} closeTime={config ? fmt(config.windowEnd) : "--"} />;
  }

  const currentQuestion: QuizQuestion | undefined = questions[currentIdx];
  if (!currentQuestion) return <LoadingScreen message="Loading question..." />;

  const answeredCount = answers.filter((a) => a !== null).length;
  const mediaType = currentQuestion.mediaType || (currentQuestion as any).mideaType;
  const hasMedia = !!mediaType && mediaType !== "none" && !!currentQuestion.mediaUrl;
  const canSubmit = !isLocked && selectedOption;
  const isLastQuestion = currentIdx === questions.length - 1;

  return (
    <>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes questionSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .panel-in { animation: panelIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .q-slide  { animation: questionSlide 0.3s ease-out both; }
        .btn-submit:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.35), 0 4px 12px rgba(239,68,68,0.2); }
        .btn-submit:not(:disabled):active { transform: translateY(0); }
        .btn-skip:not(:disabled):hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <main className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 overflow-x-hidden">
        <BackgroundLayers />

        <div className="panel-in w-full max-w-3xl flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          style={{
            background: "rgba(6,9,26,0.88)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.7), 0 0 80px rgba(59,130,246,0.06)",
          }}>

          {/* Top accent line */}
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #3b82f6, #ef4444, #3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          {/* Header */}
          <div className="grid grid-cols-3 items-center px-6 pt-5 pb-3 md:px-8">
            <div className="flex justify-start">
              <Image src="/quizinc.jpg" alt="QuizInc" width={90} height={32} className="object-contain opacity-90" />
            </div>

            <div className="flex justify-center">
              <div className="relative px-4 py-1.5 rounded-full border border-white/10"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-[10px] md:text-xs font-black font-mono tracking-widest text-white/60 uppercase">
                  Q.<span className="text-[#F5C518]">{currentIdx + 1}</span> / {questions.length}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Timer key={timerKey} durationSeconds={perQSeconds} onTimeUp={handleTimeUp} isRunning={!isLocked} />
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 pb-4 md:px-8">
            <ProgressBar current={currentIdx + 1} total={questions.length} answered={answeredCount} />
          </div>

          {/* Divider */}
          <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

          {/* Body */}
          <div className="p-6 md:p-8 flex flex-col flex-1">

            {/* Question */}
            <div
              key={`q-${cardKey}`}
              className="q-slide w-full rounded-xl p-5 md:p-6 mb-5 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Subtle corner accent */}
              <div className="absolute top-0 left-0 w-12 h-12 rounded-br-3xl opacity-30"
                style={{ background: "radial-gradient(circle at top left, rgba(59,130,246,0.4), transparent)" }} />
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-tl-3xl opacity-20"
                style={{ background: "radial-gradient(circle at bottom right, rgba(239,68,68,0.5), transparent)" }} />

              <p className="text-white text-base md:text-lg font-semibold leading-relaxed text-center relative z-10">
                {currentQuestion.text || "⚠️ Question text missing — check that the field is named 'text' in Firestore."}
              </p>
            </div>

            {/* Media */}
            {hasMedia && (
              <div className="w-full mb-5 rounded-xl overflow-hidden border border-white/[0.06]"
                style={{ background: "rgba(0,0,0,0.4)" }}>
                {mediaType === "video" ? (
                  <video src={currentQuestion.mediaUrl} controls className="w-full aspect-video object-contain" preload="metadata" />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-black/30 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentQuestion.mediaUrl!} alt="Context" className="max-w-full max-h-full object-contain rounded-lg" loading="lazy" />
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div key={`opts-${cardKey}`} className="w-full">
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                selectedAnswer={selectedOption}
                onSelect={setSelectedOption}
                isLocked={isLocked}
              />
            </div>

            <div className="w-full h-px my-6" style={{ background: "rgba(255,255,255,0.05)" }} />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
              {/* Skip */}
              <button
                onClick={handleSkip}
                disabled={isLocked}
                className="btn-skip w-full sm:w-auto sm:flex-[0_0_auto] order-2 sm:order-1 py-3.5 px-7 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all duration-150 border border-white/10"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: isLocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.45)",
                  cursor: isLocked ? "not-allowed" : "pointer",
                }}
              >
                Skip
              </button>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-submit w-full sm:flex-1 order-1 sm:order-2 py-3.5 px-6 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all duration-200"
                style={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)"
                    : "rgba(255,255,255,0.05)",
                  border: canSubmit
                    ? "1px solid rgba(59,130,246,0.4)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: canSubmit ? "#ffffff" : "rgba(255,255,255,0.2)",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  boxShadow: canSubmit ? "0 4px 16px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                }}
              >
                {isLastQuestion ? "⚽ Submit Quiz" : "Lock In Answer →"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}