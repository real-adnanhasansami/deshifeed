"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { moderateText } from "@/lib/moderation";
import { timeAgo } from "@/lib/utils";

export default function ChatThreadPage() {
  const { chatId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      setChat(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return <p className="text-sm text-gray-400">Sign in to view messages.</p>;
  if (chat && !chat.participants?.includes(user.uid)) {
    router.push("/messages");
    return null;
  }

  const otherId = chat?.participants?.find((p) => p !== user.uid);
  const otherName = chat?.participantNames?.[otherId] || "User";

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const moderation = moderateText(trimmed);
    if (moderation.blocked) {
      setError(moderation.reason);
      return;
    }
    setError("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: user.uid,
      text: trimmed,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", chatId),
      { lastMessage: trimmed, updatedAt: serverTimestamp() },
      { merge: true }
    );

    setText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-brand-borderLight dark:border-brand-borderDark">
        <button onClick={() => router.push("/messages")} className="text-sm text-gray-400 hover:text-brand-accent">
          ←
        </button>
        <h1 className="font-semibold">{otherName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-brand-accent text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-white/10 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-gray-400"}`}>
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 mt-3 border-t border-brand-borderLight dark:border-brand-borderDark">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="input-field text-sm"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary text-sm px-4">
          Send
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
