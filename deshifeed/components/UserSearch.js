"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, query, orderBy, limit, startAt, endAt, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UserSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const clean = term.trim().toLowerCase();
    if (!clean) return;

    const q = query(
      collection(db, "users"),
      orderBy("usernameLower"),
      startAt(clean),
      endAt(clean + "\uf8ff"),
      limit(20)
    );
    const snap = await getDocs(q);
    setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setSearched(true);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by username..."
          className="input-field"
        />
        <button type="submit" className="btn-primary text-sm px-4">
          Search
        </button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-sm text-gray-400">No users found for &quot;{term}&quot;.</p>
      )}

      <ul className="space-y-2">
        {results.map((u) => (
          <li key={u.id}>
            <Link
              href={`/profile/${u.id}`}
              className="card p-3 flex items-center gap-3 hover:border-brand-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-semibold">
                {(u.displayName || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{u.displayName}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
