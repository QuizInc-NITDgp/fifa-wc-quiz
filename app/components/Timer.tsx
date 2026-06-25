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

  // --- ADJUSTED FOR MORE SPACING ---
  const radius = 26; // Increased radius for a larger ring
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  const ringColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6";
  const textColor = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#ffffff";
  const glowColor = isUrgent ? "rgba(239,68,68,0.5)" : isWarning ? "rgba(245,158,11,0.4)" : "rgba(59,130,246,0.4)";

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    // Increased outer padding (p-4) to give spacing around the entire component
    <div className={`flex items-center justify-center p-4 ${isUrgent ? "is-urgent" : ""}`}>
      {/* Bumped frame size up to 72x72 for a cleaner, spacious look */}
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg
          className="absolute inset-0"
          width="72"
          height="72"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Centered at cx=36, cy=36 */}
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>

        {/* Changed inset-3 to inset-0 so the text centers perfectly in the expanded ring */}
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold tabular-nums leading-none"
          style={{ color: textColor }}
        >
          {mm}:{ss}
        </div>
      </div>
    </div>
  );
}