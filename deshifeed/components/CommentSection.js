"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { moderateText } from "@/lib/moderation";
import { timeAgo } from "@/lib/utils";
import { awardPoints, POINTS } from "@/lib/points";

export default function CommentSection({ postId, postAuthorId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // {id, authorName}
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    const moderation = moderateText(trimmed);
    if (moderation.blocked) {
      setError(moderation.reason);
      return;
    }

    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || "Anonymous",
        text: trimmed,
        parentId: replyTo?.id || null,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1) });
      await awardPoints(user.uid, POINTS.CREATE_COMMENT, "commented on a post");

      setText("");
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't post your comment.");
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    await updateDoc(doc(db, "posts", postId), { commentsCount: increment(-1) });
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id) => comments.filter((c) => c.parentId === id);

  return (
    <div className="mt-3 pt-3 border-t border-brand-borderLight dark:border-brand-borderDark space-y-3">
      {topLevel.map((c) => (
        <CommentThread
          key={c.id}
          comment={c}
          replies={repliesOf(c.id)}
          onReply={(target) => setReplyTo(target)}
          onDelete={handleDelete}
          postId={postId}
          userId={user?.uid}
        />
      ))}

      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Replying to {replyTo.authorName}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="hover:text-brand-accent">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : "Write a comment..."}
              className="input-field text-sm"
            />
            <button type="submit" disabled={!text.trim()} className="btn-primary text-sm py-1.5 px-3">
              Send
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      ) : (
        <p className="text-xs text-gray-400">Sign in to comment.</p>
      )}
    </div>
  );
}

function CommentThread({ comment, replies, onReply, onDelete, postId, userId }) {
  return (
    <div>
      <CommentRow
        comment={comment}
        onReply={() => onReply({ id: comment.id, authorName: comment.authorName })}
        onDelete={() => onDelete(comment.id)}
        postId={postId}
        isOwner={userId === comment.authorId}
      />
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l border-brand-borderLight dark:border-brand-borderDark pl-3">
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              comment={r}
              onReply={() => onReply({ id: comment.id, authorName: r.authorName })}
              onDelete={() => onDelete(r.id)}
              postId={postId}
              isOwner={userId === r.authorId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment, onReply, onDelete, postId, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);

  const saveEdit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, "posts", postId, "comments", comment.id), {
      text: trimmed,
      editedAt: new Date(),
    });
    setEditing(false);
  };

  return (
    <div className="text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{comment.authorName}</span>
        <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
      </div>

      {editing ? (
        <div className="flex gap-2 mt-1">
          <input value={text} onChange={(e) => setText(e.target.value)} className="input-field text-sm" />
          <button onClick={saveEdit} className="text-xs link-accent">
            Save
          </button>
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300 break-words">{comment.text}</p>
      )}

      <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
        <button onClick={onReply} className="hover:text-brand-accent">
          Reply
        </button>
        {isOwner && !editing && (
          <>
            <button onClick={() => setEditing(true)} className="hover:text-brand-accent">
              Edit
            </button>
            <button onClick={onDelete} className="hover:text-red-500">
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
