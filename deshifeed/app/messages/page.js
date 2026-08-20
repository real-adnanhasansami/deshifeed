"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo } from "@/lib/utils";

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserName, setOtherUserName] = useState("Chat");
  const messagesEndRef = useRef(null);

  // চ্যাট পার্টনারের নাম লোড করার জন্য
  useEffect(() => {
    if (!chatId || !user) return;
    const fetchChatDetails = async () => {
      try {
        const chatDocRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatDocRef);
        if (chatSnap.exists()) {
          const data = chatSnap.data();
          const otherId = data.participants?.find((p) => p !== user.uid);
          if (otherId && data.participantNames) {
            setOtherUserName(data.participantNames[otherId] || "User");
          }
        }
      } catch (err) {
        console.error("Error fetching chat details:", err);
      }
    };
    fetchChatDetails();
  }, [chatId, user]);

  // মেসেজগুলো রিয়েল-টাইমে শো করার জন্য লিসেনার
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      scrollToBottom();
    });

    return () => unsub();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // মেসেজ সেন্ড করার হ্যান্ডলার (সাথে ইনবক্স আপডেট হওয়ার লজিক যুক্ত)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const textToSend = newMessage;
    setNewMessage("");

    try {
      // ১. সাব-কালেকশনে মেসেজ সেভ করা
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: textToSend,
        createdAt: serverTimestamp(),
      });

      // ২. মূল চ্যাট ডকুমেন্টে lastMessage এবং updatedAt আপডেট করা (যাতে ইনবক্সে সাথে সাথে দেখায়)
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: textToSend,
        updatedAt: serverTimestamp(),
      });

      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!user) {
    return <p className="text-sm text-gray-400 p-4">Please sign in to chat.</p>;
  }

  return (
    <div className="flex flex-col h-[85vh] max-w-2xl mx-auto border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
      {/* চ্যাট হেডার */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 font-semibold text-white">
        {otherUserName}
      </div>

      {/* মেসেজ লিস্ট */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-brand-accent text-white rounded-br-none"
                    : "bg-gray-800 text-gray-200 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">
                {msg.createdAt ? timeAgo(msg.createdAt) : "Just now"}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* মেসেজ সেন্ড করার ইনপুট বক্স */}
      <form onSubmit={handleSendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-accent"
        />
        <button
          type="submit"
          className="bg-brand-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}