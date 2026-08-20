"use client";

import { useState } from "react";
import Link from "next/link";
import {
  doc,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { REACTIONS, linkifyText, timeAgo } from "@/lib/utils";
import { awardPoints, POINTS } from "@/lib/points";
import LinkPreview from "./LinkPreview";
import CommentSection from "./CommentSection";

const VISIBILITY_LABEL = {
  public: "Public",
  friends: "Friends",
  onlyMe: "Only Me",
};

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);

  const reactions = post.reactions || {};
  const myReaction = user ? reactions[user.uid] : null;
  const isOwner = user && user.uid === post.authorId;

  const reactionCounts = REACTIONS.reduce((acc, r) => {
    acc[r.key] = Object.values(reactions).filter((v) => v === r.key).length;
    return acc;
  }, {});
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const handleReact = async (key) => {
    if (!user) return;
    setShowReactionPicker(false);
    const postRef = doc(db, "posts", post.id);
    const wasReacted = !!myReaction;
    try {
      await updateDoc(postRef, {
        [`reactions.${user.uid}`]: key === myReaction ? null : key,
      });
      if (!wasReacted && key !== myReaction) {
        await awardPoints(user.uid, POINTS.GIVE_REACTION, "gave a reaction");
        if (post.authorId !== user.uid) {
          await awardPoints(post.authorId, POINTS.RECEIVE_REACTION, "received a reaction");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    await deleteDoc(doc(db, "posts", post.id));
    if (isOwner) {
      await updateDoc(doc(db, "users", post.authorId), { postsCount: increment(-1) });
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, "posts", post.id), {
      text: trimmed,
      editedAt: new Date(),
    });
    setEditing(false);
  };

  const parts = linkifyText(post.text);

  return (
    <article className="card p-4 mb-4">
      <header className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/profile/${post.authorId}`}
            className="w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-semibold flex-shrink-0"
          >
            {(post.authorName || "?").charAt(0).toUpperCase()}
          </Link>
          <div className="min-w-0">
            <Link href={`/profile/${post.authorId}`} className="font-medium text-sm hover:text-brand-accent truncate block">
              {post.authorName}
            </Link>
            <p className="text-xs text-gray-400">
              {timeAgo(post.createdAt)} · {VISIBILITY_LABEL[post.visibility] || "Public"}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2 text-xs text-gray-400">
            <button onClick={() => setEditing((v) => !v)} className="hover:text-brand-accent">
              Edit
            </button>
            <button onClick={handleDelete} className="hover:text-red-500">
              Delete
            </button>
          </div>
        )}
      </header>

      {post.flagged && (
        <p className="text-xs mb-2 inline-block px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          ⚠ Sensitive content
        </p>
      )}

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="input-field resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="btn-primary text-xs py-1 px-3">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1 px-3">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {parts.map((part, i) => {
            if (part.type === "link") {
              return (
                <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="link-accent break-all">
                  {part.value}
                </a>
              );
            }
            if (part.type === "hashtag") {
              return (
                <Link key={i} href={`/search?tag=${part.value.slice(1)}`} className="text-brand-accent">
                  {part.value}
                </Link>
              );
            }
            return <span key={i}>{part.value}</span>;
          })}
        </p>
      )}

      {post.linkUrl && <LinkPreview url={post.linkUrl} />}

      <footer className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-borderLight dark:border-brand-borderDark text-sm">
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker((v) => !v)}
            className={`flex items-center gap-1.5 ${myReaction ? "text-brand-accent" : "text-gray-500"} hover:text-brand-accent transition-colors`}
          >
            <span>{myReaction ? REACTIONS.find((r) => r.key === myReaction)?.emoji : "👍"}</span>
            <span>{totalReactions > 0 ? totalReactions : "React"}</span>
          </button>

          {showReactionPicker && (
            <div className="absolute bottom-8 left-0 flex gap-1 card p-1.5 shadow-lg z-10">
              {REACTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleReact(r.key)}
                  title={r.label}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-brand-accent transition-colors"
        >
          💬 <span>{post.commentsCount || 0}</span>
        </button>
      </footer>

      {showComments && <CommentSection postId={post.id} postAuthorId={post.authorId} />}
    </article>
  );
}
