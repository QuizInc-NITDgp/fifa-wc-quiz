"use client";

import { useEffect, useRef, useState } from "react";

// Drop this ONE component into app/layout.tsx, nothing else.
// Renders a small football image that trails the real cursor with a
// red/blue glow underneath it — the real system cursor stays visible too.

export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Skip on touch devices — no mouse to follow, and some mobile
    // browsers leave it stuck on screen since "mousemove" never fires.
    const isTouchDevice =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
    if (isTouchDevice) {
      setEnabled(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handleMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);

    let raf: number;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "36px",
        height: "36px",
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
      }}
    >
      {/* Glow layer behind the ball */}
      <div
        style={{
          position: "absolute",
          inset: "-4px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.5) 0%, rgba(185,28,28,0.4) 50%, rgba(185,28,28,0.15) 75%, transparent 90%)",
          boxShadow: "0 0 16px 4px rgba(37,99,235,0.3)",
          mixBlendMode: "screen",
        }}
      />
      {/* Trionda Ball Image Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 0 6px rgba(239,68,68,0.5)) drop-shadow(0 0 6px rgba(59,130,246,0.5))",
        }}
      >
        <img 
          src="./trionda1.png" 
          alt="Trionda Ball"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      </div>
    </div>
  );
}