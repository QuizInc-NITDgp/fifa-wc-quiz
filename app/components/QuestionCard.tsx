"use client";

import { QuizQuestion } from "@/lib/firestore/questions";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string | null;
  onSelect: (option: string) => void;
  isLocked?: boolean;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  isLocked = false,
}: QuestionCardProps) {
  return (
    <>
      <style>{`
        @keyframes optionSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes selectPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.025); }
          100% { transform: scale(1); }
        }
        .option-item {
          animation: optionSlideIn 0.25s ease-out both;
        }
        .option-item:nth-child(1) { animation-delay: 0.03s; }
        .option-item:nth-child(2) { animation-delay: 0.08s; }
        .option-item:nth-child(3) { animation-delay: 0.13s; }
        .option-item:nth-child(4) { animation-delay: 0.18s; }
        .option-selected { animation: selectPop 0.25s ease-out; }
      `}</style>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option, idx) => {
          const label = OPTION_LABELS[idx];
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={idx}
              onClick={() => !isLocked && onSelect(option)}
              disabled={isLocked}
              className={`option-item flex items-center gap-4 w-full rounded-xl px-5 py-4 text-left text-sm font-medium group transition-all duration-200 ${isSelected ? "option-selected" : ""}`}
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(239,68,68,0.12))"
                  : "rgba(255,255,255,0.03)",
                border: isSelected
                  ? "1px solid rgba(59,130,246,0.7)"
                  : "1px solid rgba(255,255,255,0.07)",
                color: isSelected ? "#ffffff" : "rgba(255,255,255,0.65)",
                cursor: isLocked ? "default" : "pointer",
                boxShadow: isSelected
                  ? "0 0 20px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "none",
                transform: "translateZ(0)",
              }}
              onMouseEnter={(e) => {
                if (!isLocked && !isSelected) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLocked && !isSelected) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
                }
              }}
            >
              {/* Letter badge */}
              <span
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black tracking-wider transition-all duration-200"
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #3b82f6, #ef4444)"
                    : "rgba(255,255,255,0.06)",
                  color: isSelected ? "#ffffff" : "rgba(255,255,255,0.35)",
                  boxShadow: isSelected ? "0 2px 8px rgba(59,130,246,0.4)" : "none",
                }}
              >
                {label}
              </span>
              <span className="leading-snug">{option}</span>

              {/* Selected check */}
              {isSelected && (
                <span className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}