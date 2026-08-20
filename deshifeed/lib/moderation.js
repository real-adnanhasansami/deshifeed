/**
 * Lightweight client + server side text moderation.
 * This is a keyword/pattern based first line of defense. It intentionally
 * stays conservative (word-boundary matching, common leetspeak substitutions)
 * to avoid false positives on ordinary words. For production use, pair this
 * with a hosted moderation API (e.g. Perspective API / OpenAI moderation)
 * called from a Cloud Function so the block-list never ships to the client.
 */

// Categories are kept generic on purpose — expand server-side as needed.
const BLOCKED_PATTERNS = [
  // Explicit / sexual content (18+)
  /\bporn(o|ography)?\b/i,
  /\bxxx\b/i,
  /\bnsfw\b/i,
  /\bnud(e|ity|es)\b/i,
  /\bsex(ual|ually)?\s*(video|content|chat)\b/i,
  /\bonlyfans\b/i,
  /\bescort(s)?\s*(service)?\b/i,

  // Hate speech / slurs — placeholder patterns, extend per policy
  /\bhate\s*speech\b/i,

  // Self-harm / graphic violence triggers (route to support resources instead of posting)
  /\bkill\s*(myself|yourself)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[\s-]?harm\b/i,

  // Illegal activity solicitation
  /\bbuy\s*drugs\b/i,
  /\bsell\s*drugs\b/i,
  /\bhow\s*to\s*make\s*a\s*bomb\b/i,
];

const SENSITIVE_WARN_PATTERNS = [
  /\b(gore|graphic\s*violence)\b/i,
  /\b(gambling|betting)\s*(site|link)\b/i,
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[$5]/g, "s");
}

/**
 * Returns { blocked: boolean, flagged: boolean, reason: string|null }
 */
export function moderateText(rawText = "") {
  const text = rawText || "";
  const normalized = normalize(text);

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text) || pattern.test(normalized)) {
      return {
        blocked: true,
        flagged: true,
        reason:
          "This post looks like it may contain sensitive or 18+ content that isn't allowed on DeshiFeed.",
      };
    }
  }

  for (const pattern of SENSITIVE_WARN_PATTERNS) {
    if (pattern.test(text) || pattern.test(normalized)) {
      return {
        blocked: false,
        flagged: true,
        reason:
          "This post contains sensitive content. It will be labeled with a content warning.",
      };
    }
  }

  return { blocked: false, flagged: false, reason: null };
}

export function containsSensitiveContent(text) {
  return moderateText(text).blocked;
}
