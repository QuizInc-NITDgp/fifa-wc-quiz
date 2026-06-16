import { db } from "@/lib/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const createUser = async (uid: string, displayName: string, email: string) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      displayName,
      email,
      answers: Array(15).fill(null),
      cumulativeTime: 0,
      isAttended: false,
      isChecked: false,
    });
  }
};