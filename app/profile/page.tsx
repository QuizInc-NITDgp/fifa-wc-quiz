"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { createUser, getUser, saveProfile } from "@/lib/firestore/user";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" }
];

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/"); return; }

      await createUser(user.uid, user.displayName || "Anonymous", user.email || "");
      const userData = await getUser(user.uid);

      if (userData?.isAttended) { router.replace("/final"); return; }
      if (userData?.phone) { router.replace("/instructions"); return; }

      setUid(user.uid);
      setCheckingAccess(false);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async () => {
    setError("");
    const phoneDigits = phone.replace(/\D/g, "");
    const minDigits = countryCode === "+91" ? 10 : 7;
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
    if (phoneDigits.length < minDigits) {
      setError(`Please enter a valid ${selectedCountry?.name || ""} phone number.`);
      return;
    }
    if (college.trim().length < 2) { setError("Please enter your college or organisation."); return; }

    setSaving(true);
    try {
      await saveProfile(uid!, `${countryCode}${phoneDigits}`, college.trim());
      router.push("/instructions");
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (checkingAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06091a" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-9 h-9 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite" }} />
      </main>
    );
  }

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
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .panel-in  { animation: panelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .field-in  { animation: fieldIn 0.4s ease-out both; }
        .field-in:nth-child(1) { animation-delay: 0.1s; }
        .field-in:nth-child(2) { animation-delay: 0.18s; }
        .field-in:nth-child(3) { animation-delay: 0.26s; }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
        <Image src="/bg.jpg" alt="" fill className="object-cover brightness-[0.22] -z-10" priority />
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,0.8) 60px,rgba(255,255,255,0.8) 61px)" }} />
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-700/15 blur-[100px] -z-10" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-blue-700/15 blur-[100px] -z-10" />

        <div
          className="panel-in relative w-full max-w-md rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl"
          style={{
            background: "rgba(6, 9, 26, 0.92)",
            backdropFilter: "blur(28px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)",
          }}
        >
          <div className="h-[2px]"
            style={{ background: "linear-gradient(90deg,#3b82f6,#ef4444,#3b82f6)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />

          <div className="px-7 md:px-9 pt-8 pb-9 flex flex-col gap-7 min-w-0 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between">
              <Image src="/quizinc.jpg" alt="QuizInc logo" width={85} height={32} className="object-contain opacity-85 bg-transparent" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">
                SETUP
                <span
                  className="ml-2 text-3xl md:text-4xl font-black tracking-tight leading-none" // Matches the exact size, tracking, and leading of SETUP
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  PROFILE
                </span>
              </h1>
            </div>

            {/* Phone field */}
            <div className="field-in flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">
                WhatsApp Number <span className="text-red-400">*</span>
              </label>

              <div className="flex gap-2 min-w-0">
                <select
                  value={countryCode}
                  onChange={(e) => { setCountryCode(e.target.value); setPhone(""); }}
                  className="rounded-xl px-3 py-3 text-sm font-mono text-white/80 outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    width: "95px",
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} style={{ background: "#06091a" }}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  placeholder={countryCode === "+91" ? "10-digit number" : "Phone number"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none focus:ring-1 focus:ring-blue-500/50"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 border border-blue-500/10"
                style={{ background: "rgba(59,130,246,0.04)" }}>

                <p className="text-blue-300/50 text-[10px] leading-relaxed">
                  Your number is only used to add you to the WhatsApp group for results and announcements. We will never share or misuse it.
                </p>
              </div>
            </div>

            {/* College / Organisation field */}
            <div className="field-in flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">
                College / Organisation <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. NIT DURGAPUR, JU, MCK,..."
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none focus:ring-1 focus:ring-blue-500/50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>

            {/* WhatsApp Group Link Section */}
            <div className="field-in flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">
                Official Contest Group
              </label>
              <a
                href="https://chat.whatsapp.com/GzKPpQmJYFV7ag5sAgwUqS?s=sw&p=a&mlu=1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-all duration-200"
                style={{
                  background: "rgba(34, 197, 94, 0.05)",
                  borderColor: "rgba(34, 197, 94, 0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.09)";
                  e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.15)";
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">

                  <div className="flex flex-col">
                    <span className="font-bold text-green-400 text-xs">Join WhatsApp Community</span>
                    <span className="text-[10px] text-white/40 truncate">Click to enter official discussion hub</span>
                  </div>
                </div>
                <span className="text-green-400 font-bold ml-2 flex-shrink-0 text-xs">JOIN →</span>
              </a>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-[11px] text-center leading-relaxed -mt-2">
                ⚠️ {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 text-white font-black text-xs tracking-widest uppercase rounded-xl py-3.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #dc2626 100%)",
                border: "1px solid rgba(59,130,246,0.35)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Saving...
                </>
              ) : (
                "Continue to Quiz →"
              )}
            </button>

          </div>
        </div>
      </main>
    </>
  );
}