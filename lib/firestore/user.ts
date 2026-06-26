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
  phone: string;           // With country code e.g. +91XXXXXXXXXX
  college: string;         // College or Organisation name
  answers: (string | null)[];
  cumulativeTimeMs: number;
  totalScore: number;
  isAttended: boolean;
  isChecked: boolean;
  createdAt?: unknown;
  submittedAt?: unknown;
}

// ─── Create user on first login ───────────────────────────────────────────────

export async function createUser(
  uid: string,
  displayName: string,
  email: string
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser: QuizUser = {
      uid,
      displayName,
      email,
      phone: "",
      college: "",
      answers: Array(20).fill(null),
      cumulativeTimeMs: 0,
      totalScore: 0,
      isAttended: false,
      isChecked: false,
      createdAt: serverTimestamp(),
      submittedAt: null,
    };
    await setDoc(ref, newUser);
  }
}

// ─── Save profile (phone only) ────────────────────────────────────────────────

export async function saveProfile(
  uid: string,
  phone: string,
  college: string
): Promise<void> {
  await setDoc(doc(db, "users", uid), { phone, college }, { merge: true });
}

// ─── Fetch user ───────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<QuizUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as QuizUser;
}

// ─── Save a single answer ─────────────────────────────────────────────────────

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
  const existingAnswers = Array.isArray(data.answers) ? data.answers : Array(20).fill(null);
  const updatedAnswers = [...existingAnswers];
  updatedAnswers[answerIndex] = answer;

  await updateDoc(ref, {
    answers: updatedAnswers,
    cumulativeTimeMs: (data.cumulativeTimeMs ?? 0) + timeSpentMs,
  });
}

// ─── Submit quiz ──────────────────────────────────────────────────────────────

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