"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  answered: number;
}

export default function ProgressBar({ current, total, answered }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <style>{`
        @keyframes segmentPop {
          0% { transform: scaleY(0.5); opacity: 0.4; }
          60% { transform: scaleY(1.3); }
          100% { transform: scaleY(1); opacity: 1; }
        }
        .seg-active { animation: segmentPop 0.3s ease-out forwards; }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Progress
        </span>
        <span className="font-mono text-[10px] text-white/30">
          <span className="text-[#F5C518] font-bold text-xs">{answered}</span>
          <span className="text-white/20"> / </span>
          <span className="text-white/50">{total}</span>
          <span className="text-white/30 ml-1">answered</span>
        </span>
      </div>

      <div className="flex gap-[3px] items-center">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i + 1 === current;
          const isPast = i + 1 < current;
          const isAnswered = i < answered;

          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${isActive ? "seg-active" : ""}`}
              style={{
                height: isActive ? "6px" : "4px",
                background: isActive
                  ? "linear-gradient(90deg, #3b82f6, #ef4444)"
                  : isAnswered
                  ? "rgba(245,197,24,0.45)"
                  : isPast
                  ? "rgba(245,197,24,0.2)"
                  : "rgba(255,255,255,0.07)",
                boxShadow: isActive
                  ? "0 0 8px rgba(59,130,246,0.7), 0 0 14px rgba(239,68,68,0.4)"
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}