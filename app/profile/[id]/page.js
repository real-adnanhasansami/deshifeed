"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import FollowButton from "@/components/FollowButton";
import PostCard from "@/components/PostCard";
import { chatIdFor } from "@/lib/utils";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");

  const isOwnProfile = user?.uid === id;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProfileUser(data);
        setBioDraft(data.bio || "");
      }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", id),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  const visiblePosts = posts.filter((p) => {
    if (p.visibility === "public") return true;
    if (isOwnProfile) return true;
    if (p.visibility === "friends" && user) return (p.friendIds || []).includes(user.uid);
    return false;
  });

  const saveBio = async () => {
    await updateDoc(doc(db, "users", id), { bio: bioDraft });
    setEditing(false);
  };

  const startChat = async () => {
    const chatId = chatIdFor(user.uid, id);
    await setDoc(
      doc(db, "chats", chatId),
      {
        participants: [user.uid, id],
        participantNames: {
          [user.uid]: profile?.displayName || user.displayName || "User",
          [id]: profileUser.displayName || "User",
        },
        lastMessage: "Started a conversation",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    router.push(`/messages/${chatId}`);
  };

  if (!profileUser) {
    return <p className="text-sm text-gray-400">Loading profile...</p>;
  }

  return (
    <div>
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-2xl font-bold">
              {(profileUser.displayName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profileUser.displayName}</h1>
              <p className="text-sm text-gray-400">@{profileUser.username}</p>
            </div>
          </div>
          {isOwnProfile ? (
            <button onClick={() => setEditing((v) => !v)} className="btn-secondary text-sm py-1.5">
              {editing ? "Cancel" : "Edit bio"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={startChat} className="btn-secondary text-sm py-1.5">
                Message
              </button>
              <FollowButton targetUserId={id} />
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="Tell people about yourself..."
            />
            <button onClick={saveBio} className="btn-primary text-sm py-1.5">
              Save
            </button>
          </div>
        ) : (
          profileUser.bio && <p className="text-sm mt-4">{profileUser.bio}</p>
        )}

        <div className="flex gap-5 mt-4 text-sm">
          <span>
            <strong>{profileUser.postsCount || 0}</strong>{" "}
            <span className="text-gray-400">Posts</span>
          </span>
          <span>
            <strong>{(profileUser.followers || []).length}</strong>{" "}
            <span className="text-gray-400">Followers</span>
          </span>
          <span>
            <strong>{(profileUser.following || []).length}</strong>{" "}
            <span className="text-gray-400">Following</span>
          </span>
          <span>
            <strong>{profileUser.points || 0}</strong>{" "}
            <span className="text-gray-400">Points</span>
          </span>
        </div>
      </div>

      {visiblePosts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {visiblePosts.length === 0 && <p className="text-sm text-gray-400">No posts to show.</p>}
    </div>
  );
}