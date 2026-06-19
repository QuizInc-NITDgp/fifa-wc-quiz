import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export type MediaType = "image" | "video" | "none" | null;

export interface QuizQuestion {
  id: string;
  order: number;
  text: string;
  mediaType: MediaType;
  mediaUrl?: string;
  // `options` removed — questions are now free-text input.
  // `correctAnswer` intentionally still not included here even if you
  // add it to Firestore docs later — keeps it server-side only.
}

export interface QuizConfig {
  windowStart: string;
  windowEnd: string;
  totalQuestions: number;
  perQuestionSeconds: number;
}

export async function fetchQuestions(): Promise<QuizQuestion[]> {
  const q = query(collection(db, "questions"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const mediaUrl = data.mediaUrl ?? data.mediaurl ?? "";
    return {
      id: d.id,
      order: data.order ?? 0,
      text: data.text ?? "",
      mediaType: data.mediaType ?? null,
      mediaUrl,
    } as QuizQuestion;
  });
}

export async function fetchQuizConfig(): Promise<QuizConfig | null> {
  const snap = await getDoc(doc(db, "config", "quiz"));
  if (!snap.exists()) return null;
  return snap.data() as QuizConfig;
}

export function isWindowOpen(config: QuizConfig): boolean {
  const now = Date.now();
  const start = new Date(config.windowStart).getTime();
  const end = new Date(config.windowEnd).getTime();
  return now >= start && now <= end;
}