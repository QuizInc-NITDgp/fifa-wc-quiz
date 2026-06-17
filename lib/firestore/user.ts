
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// ─── User schema ──────────────────────────────────────────────────────────────

export interface QuizUser {
  uid: string;
  displayName: string;
  email: string;
  answers: (string | null)[];   // Array[15]: null = not answered / skipped
  cumulativeTimeMs: number;     // Total ms taken across answered questions
  isAttended: boolean;          // True once quiz is submitted → redirects to /final
  isChecked: boolean;           // Set by admin portal after manual review
  createdAt?: unknown;
  submittedAt?: unknown;
}

// ─── Create or update user on login ──────────────────────────────────────────

export async function createUser(
  uid: string,
  displayName: string,
  email: string
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First time — initialize full schema
    const newUser: QuizUser = {
      uid,
      displayName,
      email,
      answers: Array(15).fill(null),
      cumulativeTimeMs: 0,
      isAttended: false,
      isChecked: false,
      createdAt: serverTimestamp(),
      submittedAt: null,
    };
    await setDoc(ref, newUser);
  }
  // Returning user: don't overwrite their existing data
}

// ─── Fetch user ───────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<QuizUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as QuizUser;
}

// ─── Save a single answer ─────────────────────────────────────────────────────
// answerIndex: 0-based (question 1 → index 0)
// timeSpentMs: ms the user spent on this specific question

export async function saveAnswer(
  uid: string,
  answerIndex: number,
  answer: string | null,
  timeSpentMs: number
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as QuizUser;
  const updatedAnswers = [...data.answers];
  updatedAnswers[answerIndex] = answer;

  await updateDoc(ref, {
    answers: updatedAnswers,
    cumulativeTimeMs: data.cumulativeTimeMs + timeSpentMs,
  });
}

// ─── Submit quiz (mark attended) ──────────────────────────────────────────────

export async function submitQuiz(
  uid: string,
  finalAnswers: (string | null)[],
  totalTimeMs: number
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    answers: finalAnswers,
    cumulativeTimeMs: totalTimeMs,
    isAttended: true,
    submittedAt: serverTimestamp(),
  });
}