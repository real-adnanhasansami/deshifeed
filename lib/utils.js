export function extractHashtags(text = "") {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  // de-duplicate, lowercase for grouping, but keep original for display
  const seen = new Set();
  const result = [];
  for (const tag of matches) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

export function extractFirstUrl(text = "") {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

export function isGoogleDriveLink(url = "") {
  return /drive\.google\.com/i.test(url);
}

export function linkifyText(text = "") {
  // Splits text into parts: plain strings and {url} objects, for rendering
  const parts = text.split(/(https?:\/\/[^\s]+|#[a-zA-Z0-9_]+)/g);
  return parts.filter(Boolean).map((part) => {
    if (/^https?:\/\//i.test(part)) return { type: "link", value: part };
    if (/^#[a-zA-Z0-9_]+$/.test(part)) return { type: "hashtag", value: part };
    return { type: "text", value: part };
  });
}

export function timeAgo(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return d.toLocaleDateString();
}

export const REACTIONS = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "haha", emoji: "😂", label: "Haha" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "congrats", emoji: "🎉", label: "Congrats" },
];

export function chatIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}
