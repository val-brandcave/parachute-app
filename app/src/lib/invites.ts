/** Pure helpers for the onboarding invite rows (PC-29). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPLIT_RE = /[\s,;]+/;

/**
 * Splits pasted text on comma, semicolon, space and newline; trims, lowercases
 * (and drops `<>` around an address); dedupes in first-seen order. `duplicates`
 * counts the repeats that were dropped.
 */
export function parseInviteList(text: string): { emails: string[]; duplicates: number } {
  const seen = new Set<string>();
  const emails: string[] = [];
  let duplicates = 0;
  for (const raw of text.split(SPLIT_RE)) {
    const email = raw.replace(/^<+|>+$/g, "").trim().toLowerCase();
    if (!email) continue;
    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }
    seen.add(email);
    emails.push(email);
  }
  return { emails, duplicates };
}

/** Row-level check before sending. `domain` is the org's email domain when Bouncer restricts it. */
export function validateInvite(email: string, domain?: string): null | "invalid" | "wrong_domain" {
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) return "invalid";
  if (domain && value.split("@")[1] !== domain.trim().toLowerCase()) return "wrong_domain";
  return null;
}
