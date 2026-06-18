import { STORAGE_PREFIX } from "../collections";
import { seedAll } from "../seed";
import type { DataAdapter } from "./types";

function storageKey(collection: string): string {
  return `${STORAGE_PREFIX}:${collection}`;
}

function readCollection<T>(collection: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey(collection));
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function writeCollection<T>(collection: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(collection), JSON.stringify(items));
}

const SEEDED_KEY = `${STORAGE_PREFIX}:__seeded__`;
// Bump this whenever seed data changes so existing browsers re-seed on next
// load (v6: wider spread of SLA due dates for the date-based Due column).
const SEED_VERSION = "v6";

export const mockAdapter: DataAdapter = {
  async getAll<T>(collection: string): Promise<T[]> {
    return readCollection<T>(collection);
  },

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const items = readCollection<T & { id: string }>(collection);
    return items.find((i) => i.id === id) ?? null;
  },

  async getWhere<T>(
    collection: string,
    predicate: (item: T) => boolean,
  ): Promise<T[]> {
    return readCollection<T>(collection).filter(predicate);
  },

  async create<T extends { id: string }>(
    collection: string,
    item: T,
  ): Promise<T> {
    const items = readCollection<T>(collection);
    items.push(item);
    writeCollection(collection, items);
    return item;
  },

  async createMany<T extends { id: string }>(
    collection: string,
    newItems: T[],
  ): Promise<T[]> {
    const items = readCollection<T>(collection);
    items.push(...newItems);
    writeCollection(collection, items);
    return newItems;
  },

  async update<T extends { id: string }>(
    collection: string,
    id: string,
    partial: Partial<T>,
  ): Promise<T> {
    const items = readCollection<T & { id: string }>(collection);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1)
      throw new Error(`Item ${id} not found in ${collection}`);
    const updated = { ...items[index], ...partial } as T & { id: string };
    items[index] = updated;
    writeCollection(collection, items);
    return updated;
  },

  async remove(collection: string, id: string): Promise<void> {
    const items = readCollection<{ id: string }>(collection);
    writeCollection(
      collection,
      items.filter((i) => i.id !== id),
    );
  },

  async seed(force = false): Promise<void> {
    if (typeof window === "undefined") return;
    const stamp = window.localStorage.getItem(SEEDED_KEY);
    if (stamp === SEED_VERSION && !force) return;
    await this.clear();
    await seedAll(this);
    window.localStorage.setItem(SEEDED_KEY, SEED_VERSION);
  },

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  },
};
