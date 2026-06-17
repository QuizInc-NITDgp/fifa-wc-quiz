"use client";

interface ProgressBarProps {
  current: number; // 1-based
  total: number;
  answered: number; // how many have been answered (not skipped)
}

export default function ProgressBar({ current, total, answered }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-white/40 uppercase tracking-widest">
          Question
        </span>
        <span className="font-mono text-xs text-white/40">
          <span className="text-[#F5C518] font-bold">{answered}</span>/{total} answered
        </span>
      </div>

      {/* Dot track */}
      <div className="flex gap-1.5 items-center">
        {Array.from({ length: total }).map((_, i) => {
          const qNum = i + 1;
          const isCurrent = qNum === current;
          const isPast = qNum < current;

          return (
            <div
              key={i}
              className="relative flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: isCurrent
                  ? "#F5C518"
                  : isPast
                  ? "rgba(245,197,24,0.35)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: isCurrent ? "0 0 6px #F5C51888" : "none",
              }}
            />
          );
        })}
      </div>

      {/* Q label */}
      <p className="font-mono text-sm font-bold" style={{ color: "#F5C518" }}>
        Q{current}{" "}
        <span className="text-white/30 font-normal">/ {total}</span>
      </p>
    </div>
  );
}