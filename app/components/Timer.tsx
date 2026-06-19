"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
  isRunning?: boolean;
  onTick?: (secondsLeft: number) => void;
}

export default function Timer({
  durationSeconds,
  onTimeUp,
  isRunning = true,
  onTick,
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { setSecondsLeft(durationSeconds); }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      // Defer to next tick — calling onTimeUp synchronously here updates
      // the parent (QuizPage) while Timer itself is still rendering,
      // which React flags as "Cannot update a component while rendering
      // a different component."
      const t = setTimeout(() => onTimeUpRef.current(), 0);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          clearInterval(id);
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, durationSeconds, secondsLeft]);

  const isUrgent = secondsLeft <= 10;
  const isWarning = secondsLeft <= 20 && !isUrgent;
  const pct = secondsLeft / durationSeconds;

  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  const ringColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6";
  const textColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#ffffff";
  const glowColor = isUrgent ? "rgba(239,68,68,0.5)" : isWarning ? "rgba(245,158,11,0.4)" : "rgba(59,130,246,0.4)";

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className={`timer-ring-wrap ${isUrgent ? "is-urgent" : ""}`}>
      <svg className="timer-svg" width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      <div className="timer-text" style={{ color: textColor }}>
        {mm}:{ss}
      </div>
    </div>
  );
}