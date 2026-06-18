"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  answered: number;
}

export default function ProgressBar({ current, total, answered }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-white/40 uppercase tracking-widest">Progress</span>
        <span className="font-mono text-[11px] text-white/40">
          <span className="text-[#F5C518] font-bold">{answered}</span>/{total} answered
        </span>
      </div>
      <div className="flex gap-1 items-center">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background:
                i + 1 === current
                  ? "#F5C518"
                  : i + 1 < current
                  ? "rgba(245,197,24,0.3)"
                  : "rgba(255,255,255,0.08)",
              boxShadow: i + 1 === current ? "0 0 6px #F5C51888" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}