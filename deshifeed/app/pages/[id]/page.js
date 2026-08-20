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

export default function PageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "pages", id), (snap) => {
      setPage(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, "posts"), where("pageId", "==", id), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  if (!page) return <p className="text-sm text-gray-400">Loading page...</p>;

  const isOwner = user?.uid === page.ownerId;
  const isFollowing = user && (page.followers || []).includes(user.uid);

  const follow = async () => {
    await updateDoc(doc(db, "pages", id), { followers: arrayUnion(user.uid) });
  };

  return (
    <div>
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{page.name}</h1>
            <p className="text-sm text-gray-400">{(page.followers || []).length} followers</p>
          </div>
          {user && !isFollowing && (
            <button onClick={follow} className="btn-primary text-sm py-1.5">
              Follow
            </button>
          )}
        </div>
        {page.description && <p className="text-sm mt-2">{page.description}</p>}
      </div>

      {isOwner && <CreatePost pageId={id} />}

      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {posts.length === 0 && <p className="text-sm text-gray-400">No posts on this page yet.</p>}
    </div>
  );
}
