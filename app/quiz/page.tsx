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
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#F5C518] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <p className="text-white/40 text-sm font-mono">{message}</p>
      </div>
    </main>
  );
}

function ClosedScreen({ openTime, closeTime }: { openTime: string; closeTime: string }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-40 -z-10" priority />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />
      <div
        className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center border border-blue-500/30"
        style={{ background: "rgba(10, 10, 30, 0.75)", backdropFilter: "blur(12px)" }}
      >
        <div className="text-4xl mb-4">⏰</div>
        <h1 className="text-[#F5C518] text-xl font-extrabold tracking-wide mb-2">QUIZ WINDOW CLOSED</h1>
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

function NoQuestionsScreen() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-40 -z-10" priority />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />
      <div
        className="max-w-sm w-full mx-4 rounded-2xl p-8 text-center border border-blue-500/30"
        style={{ background: "rgba(10, 10, 30, 0.75)", backdropFilter: "blur(12px)" }}
      >
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-[#F5C518] text-lg font-extrabold mb-2">Questions Not Set Up Yet</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          No questions found. Add them to the{" "}
          <span className="text-white font-mono">&quot;questions&quot;</span> collection in Firebase Console.
        </p>
      </div>
    </main>
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

        // Fix for image_f06301.jpg: Aligned arguments order with your service signature
        if (!userData && fetchedQuestions) {
          await createUser(
            user.uid,
            user.displayName || "Anonymous",
            user.email || ""
          );
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
  
  // Normalized field check matching database typo fallback safely
  const mediaType = currentQuestion.mediaType || (currentQuestion as any).mideaType;
  const hasMedia = !!mediaType && mediaType !== "none" && !!currentQuestion.mediaUrl;

  const canSubmit = !isLocked && selectedOption;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Configuration */}
      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-40 -z-10" priority />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />

      {/* Main Panel Box */}
      <div
        className="w-full max-w-3xl flex flex-col rounded-3xl border border-blue-500/30 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ background: "rgba(10, 10, 30, 0.75)" }}
      >
        
        {/* Header Section */}
        <div className="grid grid-cols-3 items-center px-6 pt-6 pb-2 md:px-8 bg-transparent">
          {/* Left: Logo */}
          <div className="flex justify-start">
            <Image src="/quizinc.jpg" alt="QuizInc" width={95} height={34} className="object-contain" />
          </div>

          {/* Center: Question Indicator */}
          <div className="flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 shadow-[0_0_15px_rgba(245,197,24,0.15)]">
              <span className="text-xs md:text-sm font-black font-mono tracking-widest text-[#F5C518] uppercase">
                Q.{currentIdx + 1} / {questions.length}
              </span>
            </div>
          </div>

          {/* Right: Timer */}
          <div className="flex justify-end">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-inner">
              <Timer key={timerKey} durationSeconds={perQSeconds} onTimeUp={handleTimeUp} isRunning={!isLocked} />
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="px-6 pt-4 md:px-8">
          <ProgressBar current={currentIdx + 1} total={questions.length} answered={answeredCount} />
        </div>

        {/* Content Body Area */}
        <div className="p-6 md:p-8 flex flex-col flex-1">
          
          {/* Question Box Frame */}
          <div className="w-full rounded-2xl p-5 md:p-7 bg-[#11162d] border border-blue-500/40 shadow-[0_4px_20px_rgba(30,58,138,0.3)] mb-6">
            <p className="text-white text-lg md:text-xl font-bold leading-relaxed text-center">
              {currentQuestion.text
                ? currentQuestion.text
                : "⚠️ Question text missing in Firestore — check that the field is named 'text' (lowercase)"}
            </p>
          </div>

          {/* Fixed Media Wrapper Container */}
          {hasMedia && (
            <div className="w-full mb-6 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/40 shadow-inner">
              {mediaType === "video" ? (
                <video
                  src={currentQuestion.mediaUrl}
                  controls
                  className="w-full aspect-video object-contain"
                  preload="metadata"
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-slate-900/60 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentQuestion.mediaUrl!} 
                    alt="Context attachment" 
                    className="max-w-full max-h-full object-contain rounded-lg" 
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}

          {/* Options Sheet Component */}
          <div className="w-full">
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              selectedAnswer={selectedOption}
              onSelect={setSelectedOption}
              isLocked={isLocked}
            />
          </div>

          <div className="w-full h-px bg-white/10 my-6" />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full sm:flex-[2] order-1 sm:order-2 py-4 px-6 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-200 transform active:scale-[0.99] select-none text-white shadow-md ${
                canSubmit
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 cursor-pointer shadow-emerald-900/50"
                  : "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              {currentIdx === questions.length - 1 ? "SUBMIT ENTIRE QUIZ" : "SUBMIT ANSWER"}
            </button>

            <button
              onClick={handleSkip}
              disabled={isLocked}
              className={`w-full sm:flex-1 order-2 sm:order-1 py-4 px-6 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-150 transform active:scale-[0.99] border shadow-md ${
                isLocked
                  ? "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
                  : "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600 hover:border-slate-500 cursor-pointer"
              }`}
            >
              Skip
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}