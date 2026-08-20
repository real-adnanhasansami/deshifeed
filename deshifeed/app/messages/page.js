"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import UserSearch from "@/components/UserSearch";
import { timeAgo } from "@/lib/utils";

export default function MessagesInbox() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // চ্যাট লিস্ট লোড করার জন্য
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // শুধু মেসেজ টাইপের আনরিড নোটিফিকেশন ট্র্যাক করার জন্য
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", user.uid),
      where("type", "==", "message"),
      where("read", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      setUnreadMessages(snap.size);
    });
    return () => unsub();
  }, [user]);

  if (!user) {
    return <p className="text-sm text-gray-400">Sign in to view your messages.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Messages 
          {unreadMessages > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {unreadMessages} new
            </span>
          )}
        </h1>
        <button onClick={() => setShowSearch((v) => !v)} className="btn-secondary text-sm py-1.5">
          {showSearch ? "Close" : "New message"}
        </button>
      </div>

      {showSearch && (
        <div className="mb-6">
          <UserSearch />
          <p className="text-xs text-gray-400 mt-2">Tap a person, then message them from their profile — or use the link below once you know their user ID.</p>
        </div>
      )}

      <div className="space-y-2">
        {chats.map((chat) => {
          const otherId = chat.participants.find((p) => p !== user.uid);
          const otherName = chat.participantNames?.[otherId] || "User";
          return (
            <Link
              key={chat.id}
              href={`/messages/${chat.id}`}
              className="card p-3 flex items-center justify-between hover:border-brand-accent transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-semibold">
                  {otherName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{otherName}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[220px]">{chat.lastMessage || "Say hello 👋"}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{timeAgo(chat.updatedAt)}</span>
            </Link>
          );
        })}
        {chats.length === 0 && <p className="text-sm text-gray-400">No conversations yet.</p>}
      </div>
    </div>
  );
}