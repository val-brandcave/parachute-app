import type { BankPolicyDoc } from "@/types";

/**
 * The data-source contract. Both the mock (localStorage) and the future API
 * (HTTP) adapters implement this exact interface, so the UI never changes when
 * the backend is wired up. See docs/plans/data-adapter-pattern-guide.md.
 */
export interface DataAdapter {
  // --- Read ---
  getAll<T>(collection: string): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  getWhere<T>(
    collection: string,
    predicate: (item: T) => boolean,
  ): Promise<T[]>;

  // --- Write ---
  create<T extends { id: string }>(collection: string, item: T): Promise<T>;
  createMany<T extends { id: string }>(
    collection: string,
    items: T[],
  ): Promise<T[]>;
  update<T extends { id: string }>(
    collection: string,
    id: string,
    partial: Partial<T>,
  ): Promise<T>;
  remove(collection: string, id: string): Promise<void>;

  // --- Org config (single documents, not collections) ---
  /** The bank's uploaded credit-policy document. `null` = explicitly removed;
   *  `undefined` = never set (the store falls back to its seeded default). */
  getBankPolicy(): Promise<BankPolicyDoc | null | undefined>;
  /** Replace (doc) or remove (null) the bank's credit-policy document. */
  setBankPolicy(doc: BankPolicyDoc | null): Promise<void>;

  // --- Lifecycle ---
  seed(force?: boolean): Promise<void>;
  clear(): Promise<void>;
}
