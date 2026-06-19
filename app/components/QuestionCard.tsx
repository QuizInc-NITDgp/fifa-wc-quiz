"use client";

import { QuizQuestion } from "@/lib/firestore/questions";

interface QuestionCardProps {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
  isLocked?: boolean;
}

export default function QuestionCard({
  question,
  value,
  onChange,
  isLocked = false,
}: QuestionCardProps) {
  return (
    <div className="answer-input-wrap">
      <label className="answer-input-label" htmlFor={`answer-${question.id}`}>
        Your Answer
      </label>
      <input
        id={`answer-${question.id}`}
        type="text"
        value={value}
        onChange={(e) => !isLocked && onChange(e.target.value)}
        disabled={isLocked}
        placeholder="Type your answer here..."
        autoComplete="off"
        className="answer-input"
      />
    </div>
  );
}