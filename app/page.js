"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function FeedPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFetching(false);
    });
    return () => unsub();
  }, []);

  const visiblePosts = posts.filter((p) => {
    if (!p.groupId === false || !p.pageId === false) {
      // hide group/page posts from the main feed; they show in their own spaces
      if (p.groupId || p.pageId) return false;
    }
    if (p.visibility === "public") return true;
    if (!user) return false;
    if (p.authorId === user.uid) return true;
    if (p.visibility === "friends") {
      return (p.friendIds || []).includes(user.uid);
    }
    return false; // onlyMe and not owner
  });

  return (
    <div>
      {!loading && !user && (
        <div className="card p-4 mb-6 text-sm">
          <p className="mb-2">Welcome to DeshiFeed — a fast, text-only feed.</p>
          <a href="/login" className="btn-primary inline-block text-sm">
            Sign in to post
          </a>
        </div>
      )}

      {user && <CreatePost />}

      {fetching ? (
        <p className="text-sm text-gray-400">Loading feed...</p>
      ) : visiblePosts.length === 0 ? (
        <p className="text-sm text-gray-400">No posts yet. Be the first to share something.</p>
      ) : (
        visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
