"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

useEffect(() => {
    if (!user) return;

    // শুধু রিসিভার আইডি দিয়ে কুয়েরি করা হলো (টাইপ এবং অর্ডার বাই বাদ দিয়ে)
    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Fetched notifications:", items); // কনসোলে ডেটা আসছে কি না দেখার জন্য
      setNotifications(items);
    });

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-800 transition text-gray-300 flex items-center justify-center"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 p-2 text-left">
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 mb-2">
            <h3 className="font-semibold text-sm text-white">Notifications</h3>
            <span className="text-xs text-gray-400">{notifications.length} total</span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No notifications yet</p>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || "#"}
                onClick={() => {
                  handleMarkAsRead(notif.id);
                  setIsOpen(false);
                }}
                className={`block p-2.5 rounded-lg mb-1 transition text-xs ${
                  notif.read ? "bg-gray-900 text-gray-400" : "bg-gray-800/80 text-white font-medium"
                } hover:bg-gray-800`}
              >
                <p>{notif.message}</p>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {notif.createdAt ? timeAgo(notif.createdAt) : "Just now"}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}