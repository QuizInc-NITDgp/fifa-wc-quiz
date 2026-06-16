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
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">


      <Image src="/bg.jpg" alt="background" fill className="object-cover brightness-40 -z-10" priority />


      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/40 rounded-full blur-3xl -z-10" />

      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/40 rounded-full blur-3xl -z-10" />


      <div className="flex max-w-3xl w-full mx-4 rounded-2xl overflow-hidden border border-blue-500/30"
        style={{ background: "rgba(10, 10, 30, 0.75)", backdropFilter: "blur(12px)" }}>


        <div className="relative flex-1 min-h-[420px]">
          <Image src="/poster.jpg" alt="football legends" fill className="object-cover" />

          <div className="absolute inset-0 border-2 border-red-500/50 rounded-l-2xl" />
        </div>


        <div className="flex-1 flex flex-col justify-center gap-5 p-8">


          <div className="flex items-center gap-2">
            <Image src="/quizinc.jpg" alt="QuizInc logo" width={100} height={36} className="object-contain bg-transparent" />
          </div>



          <div>
            <h1 className="text-[#F5C518] text-3xl font-extrabold tracking-wide drop-shadow-lg">
              WELCOME BACK
            </h1>
            <p className="text-white text-base mt-1 font-medium">
              Test your sports knowledge!
            </p>
          </div>


          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Compete with fans worldwide.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Answer rapid-fire quizzes.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Climb the global leaderboard.
            </li>
          </ul>


          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 text-white font-semibold text-sm rounded-lg px-6 py-3 mt-1 transition-all cursor-pointer border border-blue-400/50 hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #1a1a4e 0%, #2d1b69 50%, #1a1a4e 100%)" }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign in with Google
          </button>


          <p className="text-gray-500 text-xs text-center leading-relaxed">
            By signing in you agree to our &{" "}
            <span className="text-blue-400 underline cursor-pointer">Terms of Service</span>
            {" "}&{" "}
            <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>
          </p>

        </div>
      </div>
    </main>
  );
}