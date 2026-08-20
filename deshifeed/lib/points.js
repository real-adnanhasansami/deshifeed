import { doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Point values for meaningful engagement
export const POINTS = {
  CREATE_POST: 10,
  CREATE_COMMENT: 5,
  RECEIVE_REACTION: 2,
  GIVE_REACTION: 1,
  NEW_FOLLOWER: 3,
  JOIN_GROUP: 1,
};

/**
 * Awards (or deducts, if amount is negative) points to a user and keeps
 * a running lifetime total used by the leaderboard.
 */
export async function awardPoints(userId, amount, reason = "") {
  if (!userId || !amount) return;
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    await updateDoc(userRef, {
      points: increment(amount),
      lastPointReason: reason || null,
    });
  } catch (err) {
    console.error("awardPoints failed:", err);
  }
}
