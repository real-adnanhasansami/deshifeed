"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Leaderboard</h1>
      <p className="text-sm text-gray-400 mb-6">
        Points come from creating posts, commenting, and getting reactions.
      </p>

      <ol className="card divide-y divide-brand-borderLight dark:divide-brand-borderDark">
        {users.map((u, i) => (
          <li key={u.id}>
            <Link href={`/profile/${u.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5">
              <span className="w-8 text-center font-semibold text-gray-400">
                {MEDALS[i] || i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-semibold">
                {(u.displayName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.displayName}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
              <span className="font-bold text-brand-accent">{u.points || 0}</span>
            </Link>
          </li>
        ))}
        {users.length === 0 && (
          <li className="p-4 text-sm text-gray-400">No ranked users yet.</li>
        )}
      </ol>
    </div>
  );
}
