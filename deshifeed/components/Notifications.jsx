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

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5"
      >
        <span>🔔 Notifs</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-2">
          <div className="flex justify-between items-center px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Notifications</span>
            <span>{notifications.length}</span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">No notifications yet</p>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || "#"}
                onClick={() => {
                  handleMarkAsRead(notif.id);
                  setIsOpen(false);
                }}
                className={`block p-2 rounded-md mb-1 text-xs transition ${
                  notif.read ? "text-gray-500 dark:text-gray-400" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                } hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <p>{notif.message}</p>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
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