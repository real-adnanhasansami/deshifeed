"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { awardPoints, POINTS } from "@/lib/points";

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "groups", id), (snap) => {
      setGroup(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, "posts"), where("groupId", "==", id), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  if (!group) return <p className="text-sm text-gray-400">Loading group...</p>;

  const isMember = user && (group.members || []).includes(user.uid);

  const join = async () => {
    await updateDoc(doc(db, "groups", id), { members: arrayUnion(user.uid) });
    await awardPoints(user.uid, POINTS.JOIN_GROUP, "joined a group");
  };

  return (
    <div>
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{group.name}</h1>
            <p className="text-sm text-gray-400">{(group.members || []).length} members</p>
          </div>
          {user && !isMember && (
            <button onClick={join} className="btn-primary text-sm py-1.5">
              Join
            </button>
          )}
        </div>
        {group.description && <p className="text-sm mt-2">{group.description}</p>}
      </div>

      {isMember && <CreatePost groupId={id} />}

      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {posts.length === 0 && <p className="text-sm text-gray-400">No posts in this group yet.</p>}
    </div>
  );
}
