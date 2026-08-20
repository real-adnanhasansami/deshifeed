"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDb, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function ChatDetailPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const textToSend = newMessage;
    setNewMessage("");

    try {
      // ১. চ্যাটের ভেতরে মেসেজ সাব-কালেকশনে সেভ করা
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: textToSend,
        createdAt: serverTimestamp(),
      });

      // ২. মূল চ্যাট ডকুমেন্ট আপডেট করা (ইনবক্সে লাস্ট মেসেজ দেখানোর জন্য)
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      let receiverId = "";
      if (chatSnap.exists()) {
        const participants = chatSnap.data().participants || [];
        receiverId = participants.find((id) => id !== user.uid);

        await updateDoc(chatRef, {
          lastMessage: textToSend,
          updatedAt: serverTimestamp(),
        });
      }

      // ৩. রিসিভারের জন্য নোটিফিকেশন তৈরি করা
      if (receiverId) {
        await addDoc(collection(db, "notifications"), {
          receiverId: receiverId,
          senderId: user.uid,
          message: `${user.displayName || "Someone"} sent you a message: "${textToSend.substring(0, 20)}..."`,
          link: `/messages/${chatId}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-[85vh] text-gray-200">
      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-[#141a23] rounded-lg border border-gray-800">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-xl text-xs ${
                  isMe ? "bg-blue-600 text-white" : "bg-[#202938] text-gray-200 border border-gray-700"
                }`}
              >
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#1a222d] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}