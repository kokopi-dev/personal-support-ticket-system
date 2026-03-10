import { Profanity } from "@2toad/profanity";


// Whole-word mode avoids false positives like "assassin", "classic", "scunthorpe"
const profanity = new Profanity({ wholeWord: true });

const PII_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    // Standard email addresses
    label: "[REDACTED_EMAIL]",
    pattern: /\b[a-z0-9][a-z0-9._-]*@[a-z0-9][\w.-]*\.[a-z]{2,}/gi,
  },
  {
    // Obfuscated emails: "user [at] example [dot] com"
    label: "[REDACTED_EMAIL]",
    pattern:
      /\b[a-z0-9][a-z0-9._-]*\s*(?:@|\[at\]|\(at\))\s*[a-z0-9][\w.-]*\s*(?:\.|\[dot\]|\(dot\))\s*[a-z]{2,}\b/gi,
  },
  {
    // US phone numbers: (555) 555-5555, 555-555-5555, +1 555 555 5555, etc.
    label: "[REDACTED_PHONE]",
    pattern: /\b(?:\+?1[.\-\s]?)?(?:\(?\d{3}\)?[.\-\s]?)?\d{3}[.\-\s]?\d{4}\b/g,
  },
  {
    // Credit card numbers: 16-digit groups with optional separators
    label: "[REDACTED_CARD]",
    pattern:
      /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b|\b\d{4}[ -]?\d{6}[ -]?\d{4,5}\b/g,
  },
  {
    // US Social Security Numbers: 123-45-6789 / 123.45.6789 / 123 45 6789
    label: "[REDACTED_SSN]",
    pattern: /\b\d{3}[ -.]\d{2}[ -.]\d{4}\b/g,
  },
  {
    // Explicit URLs: http://, https://, ftp://, // protocol-relative
    // Captures the full URL including path, query string, and fragment.
    label: "[REDACTED_URL]",
    pattern: /(?:https?:\/\/|ftp:\/\/|\/\/)[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi,
  },
  {
    // Domains — both literal and separator-obfuscated variants.
    //
    // The separator group (SEP) matches any of:
    //   - a literal dot:                   \.
    //   - a comma (with optional spaces):  \s*,\s*
    //   - the word "dot" in plain/bracket/paren form: \s*(?:dot|\[dot\]|\(dot\))\s*
    //   - Unicode dot substitutes:         · (U+00B7) 。(U+3002) ｡ (U+FF61)
    //
    // This covers: example.com  example,com  example dot com
    //              example (dot) com  example·com  example。com
    //
    // A recognised TLD must follow the final separator. The TLD must then be
    // at a word boundary or followed by / ? whitespace or end-of-string so
    // that file extensions like .json / .ts and version strings like 1.2.3
    // are not caught.
    //
    // The negative lookbehind on [REDACTED_ prevents double-processing tokens
    // that were already replaced by an earlier pattern.
    label: "[REDACTED_URL]",
    pattern: /(?<!\[REDACTED_)\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.|,|\s*,\s*|\s*(?:dot|\[dot\]|\(dot\))\s*|[·。｡]))+(?:com|net|org|io|dev|app|co|uk|ca|au|de|fr|jp|cn|ru|br|in|gov|edu|mil|int|info|biz|me|tv|fm|gg|ai|xyz|online|site|tech|store|shop|cloud|ly|gl|to|link|click|live|pro|cc|us|nz|ie|nl|se|no|fi|dk|be|ch|at|pl|cz|hu|ro|bg|hr|sk|si|ee|lv|lt|pt|es|it|gr|tr|il|za|mx|ar|cl|pe|ve|ng|ke|eg|ph|id|my|sg|th|vn|pk|bd|lk|mm|kh|la|mn)\b(?=[\/\?\s"'>)\],]|$)/gi,
  },
];

/**
 * Replaces all recognised PII patterns in text with their label.
 * Patterns are applied in order — obfuscated email runs after standard email
 * so partial matches from the first pass don't interfere.
 */
function redactPII(text: string): string {
  return PII_PATTERNS.reduce(
    (result, { pattern, label }) => result.replace(pattern, label),
    text,
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ContentFilterResult {
  ok: true;
  subject: string;
  description: string;
}

export interface ContentFilterRejection {
  ok: false;
  reason: "profanity";
  message: string;
}

export type ContentFilterOutcome = ContentFilterResult | ContentFilterRejection;

/**
 * Filters a single body of text (e.g. a reply). Rejects profanity and redacts PII.
 */
export function filterBody(body: string): ContentFilterOutcome {
  if (profanity.exists(body)) {
    return {
      ok: false,
      reason: "profanity",
      message: "Your reply contains language that is not allowed. Please revise it before submitting.",
    };
  }
  return { ok: true, subject: "", description: redactPII(body) };
}

/**
 * Runs subject and description through the content filter.
 *
 * - Profanity in either field  → rejected, ticket is not saved
 * - PII / URLs in either field → silently redacted before saving
 */
export function filterContent(
  subject: string,
  description: string,
): ContentFilterOutcome {
  if (profanity.exists(subject)) {
    return {
      ok: false,
      reason: "profanity",
      message:
        "Your ticket subject contains language that is not allowed. Please revise it before submitting.",
    };
  }

  if (profanity.exists(description)) {
    return {
      ok: false,
      reason: "profanity",
      message:
        "Your ticket description contains language that is not allowed. Please revise it before submitting.",
    };
  }

  return {
    ok: true,
    subject: redactPII(subject),
    description: description ? redactPII(description) : description,
  };
}
