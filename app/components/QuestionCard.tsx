"use client";

import Image from "next/image";
import { QuizQuestion } from "@/lib/firestore/questions";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isLocked?: boolean; // true once submitted/skipped
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  isLocked = false,
}: QuestionCardProps) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: "rgba(10, 10, 30, 0.75)",
        border: "1px solid rgba(245, 197, 24, 0.18)",
        backdropFilter: "blur(12px)",
        animation: "cardIn 0.25s ease-out both",
      }}
    >
      {/* ── Media (image / video) ──────────────────────────────────────── */}
      {question.mediaType === "image" && question.mediaUrl && (
        <div className="relative w-full aspect-video bg-black/40">
          <Image
            src={question.mediaUrl}
            alt="Question media"
            fill
            className="object-contain"
          />
        </div>
      )}

      {question.mediaType === "video" && question.mediaUrl && (
        <div className="w-full aspect-video bg-black">
          <video
            src={question.mediaUrl}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          />
        </div>
      )}

      {/* ── Question text ─────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-white text-base font-medium leading-relaxed">
          {question.text}
        </p>
      </div>

      {/* ── Options ───────────────────────────────────────────────────── */}
      <div className="px-6 pb-6 grid grid-cols-1 gap-2.5">
        {question.options.map((option, idx) => {
          const label = OPTION_LABELS[idx];
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={idx}
              onClick={() => !isLocked && onSelect(option)}
              disabled={isLocked}
              className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-150"
              style={{
                background: isSelected
                  ? "rgba(245, 197, 24, 0.15)"
                  : "rgba(255,255,255,0.04)",
                border: isSelected
                  ? "1px solid rgba(245, 197, 24, 0.7)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: isSelected ? "#F5C518" : "rgba(255,255,255,0.75)",
                cursor: isLocked ? "default" : "pointer",
                boxShadow: isSelected ? "0 0 12px rgba(245,197,24,0.12)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isLocked && !isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.18)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLocked && !isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                }
              }}
            >
              {/* Letter badge */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{
                  background: isSelected
                    ? "#F5C518"
                    : "rgba(255,255,255,0.08)",
                  color: isSelected ? "#0A0F1E" : "rgba(255,255,255,0.5)",
                }}
              >
                {label}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}