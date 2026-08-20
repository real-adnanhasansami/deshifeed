"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { moderateText } from "@/lib/moderation";
import { extractHashtags, extractFirstUrl, isGoogleDriveLink } from "@/lib/utils";
import { awardPoints, POINTS } from "@/lib/points";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "friends", label: "Friends" },
  { value: "onlyMe", label: "Only Me" },
];

const MAX_LEN = 500;

export default function CreatePost({ onPosted, groupId = null, pageId = null }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      setError(`Posts are limited to ${MAX_LEN} characters.`);
      return;
    }

    const moderation = moderateText(trimmed);
    if (moderation.blocked) {
      setError(moderation.reason);
      return;
    }

    setPosting(true);
    try {
      const url = extractFirstUrl(trimmed);
      const driveLink = url && isGoogleDriveLink(url) ? url : null;
      const linkUrl = url || null;

      // Mutual followers = "friends", snapshotted at post time so Firestore
      // rules can check membership without a second read.
      const following = profile?.following || [];
      const followers = profile?.followers || [];
      const friendIds = visibility === "friends"
        ? following.filter((uid) => followers.includes(uid))
        : [];

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "Anonymous",
        authorUsername: profile?.username || "",
        text: trimmed,
        hashtags: extractHashtags(trimmed).map((t) => t.toLowerCase()),
        linkUrl,
        driveLink,
        visibility,
        friendIds,
        flagged: moderation.flagged,
        groupId,
        pageId,
        reactions: {},
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        postsCount: increment(1),
      });
      await awardPoints(user.uid, POINTS.CREATE_POST, "created a post");

      setText("");
      setVisibility("public");
      onPosted && onPosted();
    } catch (err) {
      console.error(err);
      setError("Couldn't publish your post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_LEN - text.length;

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share a thought, a link, or a Google Drive doc..."
        rows={3}
        className="input-field resize-none"
      />
      <div className="flex items-center justify-between mt-3 gap-3">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="input-field w-auto text-sm py-1.5"
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <span className={`text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400"}`}>
            {remaining}
          </span>
          <button type="submit" disabled={posting || !text.trim()} className="btn-primary text-sm py-1.5">
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </form>
  );
}
