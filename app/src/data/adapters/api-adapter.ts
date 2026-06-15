/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DataAdapter } from "./types";

/**
 * API adapter STUB. When the backend is ready, an engineer implements these
 * with fetch/axios against `process.env.NEXT_PUBLIC_API_BASE_URL` and flips
 * NEXT_PUBLIC_DATA_SOURCE=api. No UI/store/hook code changes.
 *
 * Every method throws (except seed) so the app can never silently run against
 * an unimplemented backend. The commented lines show the expected call.
 */
const NOT_IMPL = "API adapter not implemented — set NEXT_PUBLIC_DATA_SOURCE=mock";

export const apiAdapter: DataAdapter = {
  async getAll<T>(_collection: string): Promise<T[]> {
    // return fetch(`${BASE}/api/${_collection}`).then(r => r.json());
    throw new Error(NOT_IMPL);
  },
  async getById<T>(_collection: string, _id: string): Promise<T | null> {
    // return fetch(`${BASE}/api/${_collection}/${_id}`).then(r => r.json());
    throw new Error(NOT_IMPL);
  },
  async getWhere<T>(
    _collection: string,
    _predicate: (item: T) => boolean,
  ): Promise<T[]> {
    // translate predicate -> query params on the real API
    throw new Error(NOT_IMPL);
  },
  async create<T extends { id: string }>(
    _collection: string,
    _item: T,
  ): Promise<T> {
    throw new Error(NOT_IMPL);
  },
  async createMany<T extends { id: string }>(
    _collection: string,
    _items: T[],
  ): Promise<T[]> {
    throw new Error(NOT_IMPL);
  },
  async update<T extends { id: string }>(
    _collection: string,
    _id: string,
    _partial: Partial<T>,
  ): Promise<T> {
    throw new Error(NOT_IMPL);
  },
  async remove(_collection: string, _id: string): Promise<void> {
    throw new Error(NOT_IMPL);
  },
  async seed(): Promise<void> {
    // no-op — the server owns its data
  },
  async clear(): Promise<void> {
    throw new Error("API adapter does not support clear()");
  },
};
