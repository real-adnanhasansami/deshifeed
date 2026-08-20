"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import UserSearch from "@/components/UserSearch";
import PostCard from "@/components/PostCard";

function SearchInner() {
  const params = useSearchParams();
  const tag = params.get("tag");
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    const q = query(
      collection(db, "posts"),
      where("hashtags", "array-contains", tag.toLowerCase()),
      where("visibility", "==", "public"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    getDocs(q).then((snap) => {
      setTaggedPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [tag]);

  if (tag) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">#{tag}</h1>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : taggedPosts.length === 0 ? (
          <p className="text-sm text-gray-400">No public posts with this hashtag yet.</p>
        ) : (
          taggedPosts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Find people</h1>
      <UserSearch />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-400">Loading...</p>}>
      <SearchInner />
    </Suspense>
  );
}
