"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function PagesDirectory() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "pages"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setCreating(true);
    await addDoc(collection(db, "pages"), {
      name: name.trim(),
      description: description.trim(),
      ownerId: user.uid,
      followers: [user.uid],
      createdAt: serverTimestamp(),
    });
    setName("");
    setDescription("");
    setCreating(false);
  };

  const followPage = async (page) => {
    if (!user) return;
    await updateDoc(doc(db, "pages", page.id), { followers: arrayUnion(user.uid) });
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Pages</h1>

      {user && (
        <form onSubmit={handleCreate} className="card p-4 mb-6 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Page name"
            className="input-field"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this page for?"
            className="input-field resize-none"
            rows={2}
          />
          <button disabled={creating} className="btn-primary text-sm">
            {creating ? "Creating..." : "Create page"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/pages/${p.id}`} className="font-medium hover:text-brand-accent">
                {p.name}
              </Link>
              <p className="text-sm text-gray-400 line-clamp-2">{p.description}</p>
              <p className="text-xs text-gray-400 mt-1">{(p.followers || []).length} followers</p>
            </div>
            {user && !(p.followers || []).includes(user.uid) && (
              <button onClick={() => followPage(p)} className="btn-secondary text-sm py-1.5 flex-shrink-0">
                Follow
              </button>
            )}
          </div>
        ))}
        {pages.length === 0 && <p className="text-sm text-gray-400">No pages yet. Create the first one.</p>}
      </div>
    </div>
  );
}
