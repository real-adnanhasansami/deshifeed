"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user) return;

    // orderBy বাদ দিয়ে শুধু এই কুয়েরি রাখা হলো যাতে সাথে সাথে চ্যাট লিস্ট শো করে
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 text-gray-200">
      <h1 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Inbox</h1>
      <div className="space-y-2">
        {chats.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No messages found.</p>
        ) : (
          chats.map((chat) => {
            const otherUserId = chat.participants?.find((id) => id !== user.uid);
            return (
              <Link
                key={chat.id}
                href={`/messages/${chat.id}`}
                className="block p-3 rounded-lg bg-[#1a222d] hover:bg-[#232d3d] border border-gray-800 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-white">
                    {chat.participantNames?.[otherUserId] || "Chat User"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {chat.lastMessage || "Started a conversation"}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}