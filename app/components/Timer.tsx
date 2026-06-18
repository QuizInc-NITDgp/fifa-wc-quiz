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

  useEffect(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      onTimeUpRef.current();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          clearInterval(id);
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, durationSeconds]);

  const isUrgent = secondsLeft <= 10;
  const isWarning = secondsLeft <= 30 && !isUrgent;

  const borderColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#22d3ee";
  const textColor   = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#ffffff";
  const glowColor   = isUrgent ? "#ef444466" : isWarning ? "#f59e0b44" : "#22d3ee44";

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      {/* Inject keyframes once into the document head — safe in App Router */}
      <style>{`
        @keyframes timerPulse {
          from { opacity: 1; }
          to   { opacity: 0.4; }
        }
      `}</style>

      <div
        className="flex items-center justify-center px-4 py-1.5 rounded-full font-mono font-bold text-sm tracking-widest select-none"
        style={{
          background: "rgba(0,0,0,0.55)",
          border: `2px solid ${borderColor}`,
          color: textColor,
          boxShadow: `0 0 12px ${glowColor}`,
          minWidth: "80px",
          animation: isUrgent ? "timerPulse 0.6s ease-in-out infinite alternate" : "none",
        }}
      >
        {mm}:{ss}
      </div>
    </>
  );
}