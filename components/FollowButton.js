"use client";

import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { awardPoints, POINTS } from "@/lib/points";

export default function FollowButton({ targetUserId }) {
  const { user, profile } = useAuth();
  if (!user || user.uid === targetUserId) return null;

  const isFollowing = (profile?.following || []).includes(targetUserId);

  const toggleFollow = async () => {
    const meRef = doc(db, "users", user.uid);
    const themRef = doc(db, "users", targetUserId);

    if (isFollowing) {
      await updateDoc(meRef, { following: arrayRemove(targetUserId) });
      await updateDoc(themRef, { followers: arrayRemove(user.uid) });
    } else {
      await updateDoc(meRef, { following: arrayUnion(targetUserId) });
      await updateDoc(themRef, { followers: arrayUnion(user.uid) });
      await awardPoints(targetUserId, POINTS.NEW_FOLLOWER, "gained a follower");
    }
  };

  return (
    <button onClick={toggleFollow} className={isFollowing ? "btn-secondary text-sm py-1.5" : "btn-primary text-sm py-1.5"}>
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
