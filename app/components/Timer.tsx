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

  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = durationSeconds > 0 ? secondsLeft / durationSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const isUrgent = secondsLeft <= 10;
  const isWarning = secondsLeft <= 30 && !isUrgent;
  const ringColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#F5C518";

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="relative flex items-center justify-center w-[72px] h-[72px]">
      <svg viewBox="0 0 48 48" width="72" height="72" className="-rotate-90">
        <circle
          cx="24" cy="24" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        <circle
          cx="24" cy="24" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.9s linear, stroke 0.3s ease",
            filter: `drop-shadow(0 0 4px ${ringColor}88)`,
          }}
        />
      </svg>

      <span
        className="absolute font-mono text-[13px] font-bold tracking-tight"
        style={{
          color: isUrgent ? "#ef4444" : "rgba(255,255,255,0.9)",
          animation: isUrgent ? "timerPulse 0.6s ease-in-out infinite alternate" : "none",
        }}
      >
        {mm}:{ss}
      </span>

      <style jsx>{`
        @keyframes timerPulse {
          from { opacity: 1; }
          to   { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}