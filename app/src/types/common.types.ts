export type UUID = string;
export type Timestamp = number; // epoch milliseconds

/** Generate a random UUID v4 (browser crypto). */
export function generateId(): UUID {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Math.abs(hashString(String(performance.now()))).toString(36);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/** Base fields shared by all entities. */
export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
