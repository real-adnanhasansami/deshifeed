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
import { awardPoints, POINTS } from "@/lib/points";

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setCreating(true);
    await addDoc(collection(db, "groups"), {
      name: name.trim(),
      description: description.trim(),
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });
    setName("");
    setDescription("");
    setCreating(false);
  };

  const joinGroup = async (group) => {
    if (!user) return;
    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(user.uid),
    });
    await awardPoints(user.uid, POINTS.JOIN_GROUP, "joined a group");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Groups</h1>

      {user && (
        <form onSubmit={handleCreate} className="card p-4 mb-6 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="input-field"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            className="input-field resize-none"
            rows={2}
          />
          <button disabled={creating} className="btn-primary text-sm">
            {creating ? "Creating..." : "Create group"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/groups/${g.id}`} className="font-medium hover:text-brand-accent">
                {g.name}
              </Link>
              <p className="text-sm text-gray-400 line-clamp-2">{g.description}</p>
              <p className="text-xs text-gray-400 mt-1">{(g.members || []).length} members</p>
            </div>
            {user && !(g.members || []).includes(user.uid) && (
              <button onClick={() => joinGroup(g)} className="btn-secondary text-sm py-1.5 flex-shrink-0">
                Join
              </button>
            )}
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-gray-400">No groups yet. Create the first one.</p>}
      </div>
    </div>
  );
}
