"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  answers: (string | null)[];
}

export default function ProgressBar({
  current,
  total,
  answers,
}: ProgressBarProps) {
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="flex flex-col gap-2 w-full">
      <style>{`
        @keyframes segmentPop {
          0% { transform: scaleY(0.5); opacity: 0.4; }
          60% { transform: scaleY(1.3); }
          100% { transform: scaleY(1); opacity: 1; }
        }

        .seg-active {
          animation: segmentPop 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Progress
        </span>

        <span className="font-mono text-[10px] text-white/30">
          <span className="text-[#22c55e] font-bold text-xs">{answered}</span>
          <span className="text-white/20"> / </span>
          <span className="text-white/50">{total}</span>
          <span className="text-white/30 ml-1">answered</span>
        </span>
      </div>

      <div className="flex gap-[3px] items-center">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i + 1 === current;
          const isAnswered = answers[i] !== null;
          const isSkipped = answers[i] === null && i + 1 < current;
          const isFuture = i + 1 > current;

          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${isActive ? "seg-active" : ""
                }`}
              style={{
                height: isActive ? "6px" : "4px",
                background: isActive
                  ? "linear-gradient(90deg, #3b82f6, #ef4444)"
                  : isAnswered
                    ? "#22c55e" // Green - answered
                    : isSkipped
                      ? "#ef4444" // Red - skipped
                      : "rgba(245,197,24,0.45)", // Yellow - not visited
                boxShadow: isAnswered
                  ? "0 0 8px rgba(34,197,94,0.45)"
                  : isSkipped
                    ? "0 0 8px rgba(239,68,68,0.45)"
                    : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}