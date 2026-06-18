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
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
      {question.options.map((option, idx) => {
        const label = OPTION_LABELS[idx];
        const isSelected = selectedAnswer === option;

        return (
          <button
            key={idx}
            onClick={() => !isLocked && onSelect(option)}
            disabled={isLocked}
            className="flex items-center gap-4 w-full rounded-xl px-5 py-4 text-left text-sm font-medium transition-all duration-150"
            style={{
              background: isSelected
                ? "rgba(245, 197, 24, 0.12)"
                : "rgba(255,255,255,0.04)",
              border: isSelected
                ? "1px solid rgba(245, 197, 24, 0.7)"
                : "1px solid rgba(100,140,255,0.18)",
              color: isSelected ? "#F5C518" : "rgba(255,255,255,0.8)",
              cursor: isLocked ? "default" : "pointer",
              boxShadow: isSelected ? "0 0 16px rgba(245,197,24,0.12)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isLocked && !isSelected) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,140,255,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLocked && !isSelected) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,140,255,0.18)";
              }
            }}
          >
            {/* Letter badge */}
            <span
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: isSelected ? "#F5C518" : "rgba(255,255,255,0.08)",
                color: isSelected ? "#0A0F1E" : "rgba(255,255,255,0.5)",
              }}
            >
              {label}
            </span>
            <span className="leading-snug">{option}</span>
          </button>
        );
      })}
    </div>
  );
}