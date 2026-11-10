/** Where "Back to Parachute" goes. Only same-origin paths are honoured. */
export const DEFAULT_RETURN = "/dashboard";

export function safeReturn(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN;
  return raw;
}

/** Adds `joined=<inviteId>` to a return path, keeping any existing query. */
export function withJoined(path: string, inviteId: string | null): string {
  if (!inviteId) return path;
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("joined", inviteId);
  return `${base}?${params.toString()}`;
}
