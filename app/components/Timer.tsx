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
    if (secondsLeft <= 0) { onTimeUpRef.current(); return; }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) { clearInterval(id); onTimeUpRef.current(); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, durationSeconds]);

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
    <>
      <style>{`
        @keyframes timerPulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes urgentGlow {
          0%,100% { filter: drop-shadow(0 0 4px ${glowColor}); }
          50% { filter: drop-shadow(0 0 12px ${glowColor}); }
        }
      `}</style>
      <div
        className="relative flex items-center justify-center"
        style={{
          animation: isUrgent ? "timerPulse 0.6s ease-in-out infinite" : "none",
        }}
      >
        <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          {/* Progress ring */}
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{
              transition: "stroke-dasharray 1s linear, stroke 0.3s",
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[11px] tracking-wider select-none"
          style={{ color: textColor }}
        >
          {mm}:{ss}
        </div>
      </div>
    </>
  );
}