import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaType = "image" | "video" | "none";

export interface QuizQuestion {
  id: string;           // Firestore doc id, e.g. "q01" … "q15"
  order: number;        // 1-based display order
  text: string;         // Question text
  options: string[];    // Array of 4 answer options
  mediaType: MediaType;
  mediaUrl?: string;    // GCS / hosted URL for image or video
}

export interface QuizConfig {
  windowStart: string;  // ISO timestamp — quiz opens at this time
  windowEnd: string;    // ISO timestamp — quiz closes at this time
  totalQuestions: number;
  perQuestionSeconds: number; // seconds allowed per question
}

// ─── Fetch all 15 questions (ordered) ────────────────────────────────────────
// Firestore collection: "questions"
// Each doc has: order (number), text, options (array[4]), mediaType, mediaUrl?

export async function fetchQuestions(): Promise<QuizQuestion[]> {
  const q = query(collection(db, "questions"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizQuestion));
}

// ─── Fetch quiz config (window + timing) ─────────────────────────────────────
// Firestore doc: "config/quiz"
// Fields: windowStart, windowEnd, totalQuestions, perQuestionSeconds

export async function fetchQuizConfig(): Promise<QuizConfig | null> {
  const snap = await getDoc(doc(db, "config", "quiz"));
  if (!snap.exists()) return null;
  return snap.data() as QuizConfig;
}

// ─── Check if quiz window is currently open ───────────────────────────────────

export function isWindowOpen(config: QuizConfig): boolean {
  const now = Date.now();
  const start = new Date(config.windowStart).getTime();
  const end = new Date(config.windowEnd).getTime();
  return now >= start && now <= end;
}

export function timeUntilOpen(config: QuizConfig): number {
  return Math.max(0, new Date(config.windowStart).getTime() - Date.now());
}