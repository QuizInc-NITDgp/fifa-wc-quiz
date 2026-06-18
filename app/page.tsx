"use client";
import Image from "next/image";
import { auth } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/firestore/user";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUser(
        result.user.uid,
        result.user.displayName || "Anonymous",
        result.user.email || ""
      );
      router.push("/instructions");
    } catch (error: any) {
      if (error.code === "auth/cancelled-popup-request") return;
      if (error.code === "auth/popup-closed-by-user") return;
      console.error("Sign in failed:", error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes itemIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .panel-in   { animation: panelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .login-item { animation: itemIn 0.4s ease-out both; }
        .login-item:nth-child(1) { animation-delay: 0.1s; }
        .login-item:nth-child(2) { animation-delay: 0.17s; }
        .login-item:nth-child(3) { animation-delay: 0.24s; }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        {/* Background Atmosphere */}
        <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        
        {/* Ambient Blurred Orbs */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-700/15 blur-[100px] -z-10" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-blue-700/15 blur-[100px] -z-10" />

        {/* Main Box Container */}
        <div className="panel-in relative flex flex-col md:flex-row max-w-3xl w-full rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{ background: "rgba(6, 9, 26, 0.88)", backdropFilter: "blur(24px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)" }}>
          
          {/* Top animated premium accent line spanning across the entire box container */}
          <div className="absolute top-0 left-0 right-0 h-[2px] z-10" 
            style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          {/* Left Side: Poster Panel */}
          <div className="relative flex-1 min-h-[300px] md:min-h-[460px] w-full">
            <Image src="/photo.jpeg" alt="football legends" fill className="object-cover opacity-90 w-5" priority />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-transparent" />
            <div className="absolute inset-0 border-r border-white/[0.05]" />
          </div>

          {/* Right Side: Content Panel */}
          <div className="flex-1 flex flex-col justify-center gap-6 p-7 md:p-9">

            {/* Logo Row */}
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc logo" width={85} height={32} className="object-contain opacity-85 bg-transparent" />
              <div className="inline-flex items-center gap-1.5">
                <span className="text-base">⚽</span>
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-blue-400/90">FIFA World Cup</span>
              </div>
            </div>

            {/* Titles */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                WELCOME
                <span className="ml-2" style={{
                  background: "linear-gradient(135deg, #3b82f6, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>BACK</span>
              </h1>
              <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">
                Test your sports knowledge & claim your spot on the leaderboard!
              </p>
            </div>

            {/* Features Staggered Animated List */}
            <div className="flex flex-col gap-2">
              <div className="login-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 border border-white/[0.04] group hover:border-blue-500/15 hover:bg-blue-500/[0.02] transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.01)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <p className="text-white/60 text-xs font-medium tracking-wide group-hover:text-white/80 transition-colors">Compete with fans worldwide.</p>
              </div>
              <div className="login-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 border border-white/[0.04] group hover:border-blue-500/15 hover:bg-blue-500/[0.02] transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.01)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <p className="text-white/60 text-xs font-medium tracking-wide group-hover:text-white/80 transition-colors">Answer rapid-fire quizzes.</p>
              </div>
              <div className="login-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 border border-white/[0.04] group hover:border-blue-500/15 hover:bg-blue-500/[0.02] transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.01)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <p className="text-white/60 text-xs font-medium tracking-wide group-hover:text-white/80 transition-colors">Climb the global leaderboard.</p>
              </div>
            </div>

            {/* Google Authentication Trigger Action */}
            <div className="flex flex-col gap-3.5 mt-1">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 text-white font-black text-xs tracking-widest uppercase rounded-xl py-3.5 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.12)"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48" className="drop-shadow">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Sign in with Google
              </button>

              {/* Legal Note footer row */}
              <p className="text-gray-500 text-[10px] text-center leading-relaxed font-medium">
                By signing in you agree to our{" "}
                <span className="text-blue-400/80 hover:text-blue-400 underline cursor-pointer transition-colors">Terms of Service</span>
                {" "}&{" "}
                <span className="text-blue-400/80 hover:text-blue-400 underline cursor-pointer transition-colors">Privacy Policy</span>
              </p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}