import { Profanity } from "@2toad/profanity";

// ─── Profanity checker ────────────────────────────────────────────────────────

// Whole-word mode avoids false positives like "assassin", "classic", "scunthorpe"
const profanity = new Profanity({ wholeWord: true });

// ─── PII redaction patterns ───────────────────────────────────────────────────
// Inlined from source inspection of @redactpii/node — pure regex, no dependency needed.
// Each entry defines what to match and what label to replace it with.

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
 * Runs subject and description through the content filter.
 *
 * - Profanity in either field  → rejected, ticket is not saved
 * - PII in description         → silently redacted before saving
 *
 * Subject is not PII-redacted because it is short, user-facing in table views,
 * and unlikely to contain structured PII like card numbers or SSNs.
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
    subject,
    description: description ? redactPII(description) : description,
  };
}
