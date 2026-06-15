# Data Adapter Pattern — Setup Guide

> A step-by-step guide for setting up a mock-to-API data adapter in a React + TypeScript project.
> Extracted from the LinneSync architecture. Copy this pattern into any new project to prototype with localStorage and swap to a real API later with zero changes to your UI.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Define Base Types](#step-1--define-base-types)
4. [Step 2 — Define Collections](#step-2--define-collections)
5. [Step 3 — Define the DataAdapter Interface](#step-3--define-the-dataadapter-interface)
6. [Step 4 — Implement the Mock Adapter](#step-4--implement-the-mock-adapter)
7. [Step 5 — Stub the API Adapter](#step-5--stub-the-api-adapter)
8. [Step 6 — Create the Adapter Factory](#step-6--create-the-adapter-factory)
9. [Step 7 — Create Seed Data](#step-7--create-seed-data)
10. [Step 8 — Bootstrap Seeding in main.tsx](#step-8--bootstrap-seeding-in-maintsx)
11. [Step 9 — Create a Zustand Store](#step-9--create-a-zustand-store)
12. [Step 10 — Create a Page Hook](#step-10--create-a-page-hook)
13. [Step 11 — Wire Up the Page Component](#step-11--wire-up-the-page-component)
14. [Switching to the Real API](#switching-to-the-real-api)
15. [Full File Tree](#full-file-tree)

---

## 1. Architecture Overview

The adapter pattern creates a clean boundary between your UI and your data source. During prototyping, data lives in localStorage. When your backend is ready, you swap in Axios calls — stores, hooks, and pages don't change at all.

```
Page Component
    ↓ imports
Page Hook (useFeature.ts)
    ↓ imports
Zustand Store (feature.store.ts)
    ↓ imports
Data Adapter (singleton from factory)
    ↓ delegates to
Mock Adapter (localStorage)  OR  API Adapter (Axios/fetch)
```

**The rule:** each layer only imports from the layer directly below it. Pages never touch the adapter. Stores never skip the adapter to hit localStorage. The factory decides which adapter is active based on an environment variable.

---

## 2. Prerequisites

| Dependency       | Purpose                      |
|-----------------|------------------------------|
| `react`          | UI framework                 |
| `typescript`     | Type safety                  |
| `zustand`        | State management (stores)    |
| `vite`           | Build tool (`import.meta.env`) |
| `axios` (later)  | HTTP client for API adapter  |

Install the essentials:

```bash
npm install zustand
npm install -D typescript
# axios is only needed when you implement the real API adapter
```

Set up a path alias so imports stay clean. In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

And in `vite.config.ts`:

```ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

---

## Step 1 — Define Base Types

**File:** `src/types/common.types.ts`

Every entity in your app extends `BaseEntity`. This guarantees every record has an `id` and timestamps.

```ts
export type UUID = string;
export type Timestamp = number; // epoch milliseconds

/** Generate a random UUID v4 */
export function generateId(): UUID {
  return crypto.randomUUID();
}

/** Base fields shared by all entities */
export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

Then define your domain entities in separate files, all extending `BaseEntity`:

```ts
// src/types/project.types.ts
import type { UUID, Timestamp, BaseEntity } from './common.types';

export type ProjectStatus = 'active' | 'archived' | 'draft';

export interface Project extends BaseEntity {
  name: string;
  description: string;
  ownerId: UUID;
  status: ProjectStatus;
}
```

Re-export everything from a barrel file:

```ts
// src/types/index.ts
export * from './common.types';
export * from './project.types';
// add more as you create them
```

**Convention:** Use union types for enums (`'active' | 'archived'`), not TypeScript `enum`. Reference other entities by `UUID` (e.g., `ownerId: UUID`).

---

## Step 2 — Define Collections

**File:** `src/data/collections.ts`

This file is the single source of truth for collection/table names. Both adapters use these constants — the mock adapter uses them as localStorage key suffixes, and the API adapter will use them as URL path segments.

```ts
/** localStorage key prefix — change this per project */
export const STORAGE_PREFIX = 'myapp';

/** Collection name constants */
export const Collections = {
  USERS: 'users',
  PROJECTS: 'projects',
  // add more as your data model grows
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
```

**Convention:** `UPPER_SNAKE` key maps to `'lower_snake'` value, always plural.

---

## Step 3 — Define the DataAdapter Interface

**File:** `src/data/adapters/types.ts`

This is the contract. Both the mock and API adapters implement this exact interface. Because every method returns a `Promise`, the mock adapter (synchronous localStorage) and the API adapter (async HTTP) are interchangeable.

```ts
export interface DataAdapter {
  // --- Read ---
  getAll<T>(collection: string): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>;

  // --- Write ---
  create<T extends { id: string }>(collection: string, item: T): Promise<T>;
  createMany<T extends { id: string }>(collection: string, items: T[]): Promise<T[]>;
  update<T extends { id: string }>(
    collection: string,
    id: string,
    partial: Partial<T>,
  ): Promise<T>;
  remove(collection: string, id: string): Promise<void>;

  // --- Lifecycle ---
  seed(force?: boolean): Promise<void>;
  clear(): Promise<void>;
}
```

**Design notes:**

- `getWhere` takes a predicate function. For the mock adapter, this filters in-memory. When you implement the API adapter, you'll translate common predicates into query parameters.
- Write methods require `{ id: string }` — the store generates the ID before calling the adapter.
- `seed()` is for populating initial data. The API adapter no-ops this (the server handles its own data).
- `clear()` wipes all data. Useful for development resets. The API adapter should throw.

---

## Step 4 — Implement the Mock Adapter

**File:** `src/data/adapters/mock-adapter.ts`

```ts
import { STORAGE_PREFIX } from '../collections';
import { seedAll } from '../seed';
import type { DataAdapter } from './types';

function storageKey(collection: string): string {
  return `${STORAGE_PREFIX}:${collection}`;
}

function readCollection<T>(collection: string): T[] {
  const raw = localStorage.getItem(storageKey(collection));
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function writeCollection<T>(collection: string, items: T[]): void {
  localStorage.setItem(storageKey(collection), JSON.stringify(items));
}

const SEEDED_KEY = `${STORAGE_PREFIX}:__seeded__`;

export const mockAdapter: DataAdapter = {
  async getAll<T>(collection: string): Promise<T[]> {
    return readCollection<T>(collection);
  },

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const items = readCollection<T & { id: string }>(collection);
    return items.find((item) => item.id === id) ?? null;
  },

  async getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    return readCollection<T>(collection).filter(predicate);
  },

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    const items = readCollection<T>(collection);
    items.push(item);
    writeCollection(collection, items);
    return item;
  },

  async createMany<T extends { id: string }>(collection: string, newItems: T[]): Promise<T[]> {
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
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found in ${collection}`);
    const updated = { ...items[index], ...partial } as T;
    items[index] = updated as T & { id: string };
    writeCollection(collection, items);
    return updated;
  },

  async remove(collection: string, id: string): Promise<void> {
    const items = readCollection<{ id: string }>(collection);
    writeCollection(
      collection,
      items.filter((item) => item.id !== id),
    );
  },

  async seed(force = false): Promise<void> {
    const alreadySeeded = localStorage.getItem(SEEDED_KEY);
    if (alreadySeeded && !force) return;
    await seedAll(this);
    localStorage.setItem(SEEDED_KEY, new Date().toISOString());
  },

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },
};
```

**How it works:**

- Every collection is a JSON array stored at `myapp:<collection>` in localStorage.
- `seed()` runs once — it checks for a `myapp:__seeded__` flag and skips if already seeded. Pass `force=true` to re-seed.
- `update()` does a shallow merge. Nested objects are replaced, not deep-merged.
- Data persists across browser sessions. To reset: clear localStorage and reload.

---

## Step 5 — Stub the API Adapter

**File:** `src/data/adapters/api-adapter.ts`

```ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DataAdapter } from './types';

// Uncomment when ready:
// import axios from 'axios';
// const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export const apiAdapter: DataAdapter = {
  async getAll<T>(_collection: string): Promise<T[]> {
    // return (await api.get(`/api/${_collection}`)).data;
    throw new Error('API adapter not implemented — set VITE_DATA_SOURCE=mock');
  },

  async getById<T>(_collection: string, _id: string): Promise<T | null> {
    // return (await api.get(`/api/${_collection}/${_id}`)).data;
    throw new Error('API adapter not implemented');
  },

  async getWhere<T>(_collection: string, _predicate: (item: T) => boolean): Promise<T[]> {
    // Convert predicate to query params for the real API
    throw new Error('API adapter not implemented');
  },

  async create<T extends { id: string }>(_collection: string, _item: T): Promise<T> {
    // return (await api.post(`/api/${_collection}`, _item)).data;
    throw new Error('API adapter not implemented');
  },

  async createMany<T extends { id: string }>(_collection: string, _items: T[]): Promise<T[]> {
    // return (await api.post(`/api/${_collection}/bulk`, _items)).data;
    throw new Error('API adapter not implemented');
  },

  async update<T extends { id: string }>(
    _collection: string,
    _id: string,
    _partial: Partial<T>,
  ): Promise<T> {
    // return (await api.patch(`/api/${_collection}/${_id}`, _partial)).data;
    throw new Error('API adapter not implemented');
  },

  async remove(_collection: string, _id: string): Promise<void> {
    // await api.delete(`/api/${_collection}/${_id}`);
    throw new Error('API adapter not implemented');
  },

  async seed(): Promise<void> {
    // No-op — the server handles its own seeding
  },

  async clear(): Promise<void> {
    throw new Error('API adapter does not support clear()');
  },
};
```

Every method throws except `seed()` (no-op). This ensures the app never silently operates against an unimplemented backend. The comments show the expected Axios call for each method.

---

## Step 6 — Create the Adapter Factory

**File:** `src/data/adapters/index.ts`

```ts
import type { DataAdapter } from './types';
import { mockAdapter } from './mock-adapter';
import { apiAdapter } from './api-adapter';

const source = import.meta.env.VITE_DATA_SOURCE ?? 'api';

export const adapter: DataAdapter = source === 'api' ? apiAdapter : mockAdapter;

export type { DataAdapter } from './types';
```

**File:** `.env`

```
VITE_DATA_SOURCE=mock
```

This is the only decision point. The entire app imports `adapter` from `@/data/adapters` — it never knows or cares which implementation is behind it.

**Important:** The default fallback is `'api'`, not `'mock'`. This is intentional — it forces you to explicitly set `VITE_DATA_SOURCE=mock` during prototyping. When the backend is ready, you either remove the env var or set it to `api`.

---

## Step 7 — Create Seed Data

Seed files are plain typed arrays with hardcoded IDs. They have no logic, no imports from stores or adapters.

**File:** `src/data/seed/projects.seed.ts`

```ts
import type { Project } from '@/types';

export const seedProjects: Project[] = [
  {
    id: 'project-001',
    name: 'Website Redesign',
    description: 'Complete overhaul of the marketing site',
    ownerId: 'user-001',
    status: 'active',
    createdAt: 1736928000000,
  },
  {
    id: 'project-002',
    name: 'Mobile App v2',
    description: 'React Native rewrite',
    ownerId: 'user-001',
    status: 'draft',
    createdAt: 1736928000000,
  },
];
```

**File:** `src/data/seed/index.ts`

The orchestrator calls `adapter.createMany()` in dependency order.

```ts
import { Collections } from '../collections';
import type { DataAdapter } from '../adapters/types';
import { seedUsers } from './users.seed';
import { seedProjects } from './projects.seed';

export async function seedAll(adapter: DataAdapter): Promise<void> {
  // Order matters — seed parents before children
  await adapter.createMany(Collections.USERS, seedUsers);
  await adapter.createMany(Collections.PROJECTS, seedProjects);
}
```

**Key rules:**

- `seedAll` receives the adapter as a parameter — it uses the interface, not a concrete implementation.
- Dependency order is critical: if projects reference users, seed users first.
- Hardcoded IDs (e.g., `'user-001'`) let seed files cross-reference each other.
- `createdAt` values are epoch milliseconds.

---

## Step 8 — Bootstrap Seeding in main.tsx

**File:** `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { adapter } from '@/data/adapters';
import App from './App';

async function bootstrap() {
  // Seed blocks rendering until complete (instant on repeat loads)
  await adapter.seed();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
```

`adapter.seed()` runs before the app renders. On first load, it populates localStorage with all your seed data. On subsequent loads, it detects the `__seeded__` flag and returns immediately.

---

## Step 9 — Create a Zustand Store

Stores are the only layer that imports the adapter. They manage loading/error state and generate IDs before writes.

**File:** `src/store/project.store.ts`

```ts
import { create } from 'zustand';
import { adapter } from '@/data/adapters';
import { Collections } from '@/data/collections';
import { generateId } from '@/types';
import type { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchByOwner: (ownerId: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await adapter.getAll<Project>(Collections.PROJECTS);
      set({ projects, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  fetchByOwner: async (ownerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await adapter.getWhere<Project>(
        Collections.PROJECTS,
        (p) => p.ownerId === ownerId,
      );
      set({ projects, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  createProject: async (data) => {
    const now = Date.now();
    const project: Project = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await adapter.create(Collections.PROJECTS, project);
    set({ projects: [...get().projects, project] });
    return project;
  },

  updateProject: async (id, data) => {
    const updated = await adapter.update<Project>(Collections.PROJECTS, id, {
      ...data,
      updatedAt: Date.now(),
    });
    set({
      projects: get().projects.map((p) => (p.id === id ? updated : p)),
    });
  },

  deleteProject: async (id) => {
    await adapter.remove(Collections.PROJECTS, id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },
}));
```

**Store pattern:**

1. Set `{ isLoading: true, error: null }` before every async call.
2. On success: update state and set `{ isLoading: false }`.
3. On failure: set `{ isLoading: false, error: message }`.
4. `generateId()` and `Date.now()` are called in the store, not the page.
5. After writes, update local state optimistically (or re-fetch if you prefer).

Create a barrel export:

```ts
// src/store/index.ts
export { useProjectStore } from './project.store';
// add more stores here
```

---

## Step 10 — Create a Page Hook

Page hooks are the bridge between your UI and your stores. They orchestrate multi-store fetches, derive view-model shapes, and expose a clean API to the page.

**File:** `src/pages/projects/hooks/useProjects.ts`

```ts
import { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '@/store';

export function useProjects() {
  const {
    projects,
    isLoading: storeLoading,
    fetchProjects,
    createProject,
    deleteProject,
  } = useProjectStore();

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchProjects().then(() => setInitialLoad(false));
  }, [fetchProjects]);

  const isLoading = initialLoad || storeLoading;

  // Derive a view-model if needed (sorting, filtering, joining data)
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.createdAt - a.createdAt),
    [projects],
  );

  return {
    projects: sortedProjects,
    isLoading,
    createProject,
    deleteProject,
  };
}
```

**Hook pattern:**

- Import from `@/store` — never from `@/data/adapters`.
- Use `useEffect` to kick off fetches on mount.
- Track `initialLoad` separately so the page can show a skeleton on first render.
- Use `useMemo` to derive display-ready data (sorted, filtered, joined across stores).
- Return only what the page component needs.

---

## Step 11 — Wire Up the Page Component

The page only imports its own hook. It never touches stores or the adapter.

**File:** `src/pages/projects/ProjectsPage.tsx`

```tsx
import { useProjects } from './hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectsPage() {
  const { projects, isLoading, createProject, deleteProject } = useProjects();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1>Projects</h1>
      {projects.map((project) => (
        <div key={project.id}>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Switching to the Real API

When your backend is ready, the swap is straightforward:

1. **Install Axios:**
   ```bash
   npm install axios
   ```

2. **Add the API base URL to your environment:**
   ```
   # .env
   VITE_DATA_SOURCE=api
   VITE_API_BASE_URL=https://api.yourapp.com
   ```

3. **Implement the API adapter** (`src/data/adapters/api-adapter.ts`):
   ```ts
   import axios from 'axios';
   import type { DataAdapter } from './types';

   const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

   export const apiAdapter: DataAdapter = {
     async getAll<T>(collection: string) {
       return (await api.get<T[]>(`/api/${collection}`)).data;
     },
     async getById<T>(collection: string, id: string) {
       return (await api.get<T>(`/api/${collection}/${id}`)).data;
     },
     async getWhere<T>(collection: string, _predicate: (item: T) => boolean) {
       // For the real API, convert common predicates to query params.
       // This is the one method that may need per-store customization.
       return (await api.get<T[]>(`/api/${collection}`)).data;
     },
     async create<T extends { id: string }>(collection: string, item: T) {
       return (await api.post<T>(`/api/${collection}`, item)).data;
     },
     async createMany<T extends { id: string }>(collection: string, items: T[]) {
       return (await api.post<T[]>(`/api/${collection}/bulk`, items)).data;
     },
     async update<T extends { id: string }>(collection: string, id: string, partial: Partial<T>) {
       return (await api.patch<T>(`/api/${collection}/${id}`, partial)).data;
     },
     async remove(collection: string, id: string) {
       await api.delete(`/api/${collection}/${id}`);
     },
     async seed() { /* no-op */ },
     async clear() { throw new Error('Not supported'); },
   };
   ```

4. **That's it.** No changes to stores, hooks, or pages.

**Note on `getWhere`:** The mock adapter filters with an in-memory predicate, which is fast against localStorage. The real API adapter will likely need to translate common filter patterns into query parameters. This is the one area where you may need per-endpoint customization (e.g., a `params` object instead of a predicate). One approach: add optional `params` to the interface, or create store-level methods that construct the right API call.

---

## Full File Tree

```
src/
├── data/
│   ├── collections.ts              # Collection names + storage prefix
│   ├── adapters/
│   │   ├── types.ts                # DataAdapter interface
│   │   ├── mock-adapter.ts         # localStorage implementation
│   │   ├── api-adapter.ts          # Axios implementation (stub or real)
│   │   └── index.ts                # Factory — selects adapter via env var
│   └── seed/
│       ├── index.ts                # seedAll orchestrator
│       ├── users.seed.ts           # Seed data arrays
│       └── projects.seed.ts
├── store/
│   ├── index.ts                    # Barrel export
│   └── project.store.ts            # Zustand store (imports adapter)
├── pages/
│   └── projects/
│       ├── ProjectsPage.tsx        # Page component (imports hook only)
│       ├── hooks/useProjects.ts    # Page hook (imports store)
│       └── config/projectsConfig.ts
├── types/
│   ├── index.ts                    # Barrel export
│   ├── common.types.ts             # BaseEntity, UUID, Timestamp, generateId
│   └── project.types.ts            # Domain entity types
└── main.tsx                        # Calls adapter.seed() before render
```

```
.env                                # VITE_DATA_SOURCE=mock
```

---

## Quick Reference

| Layer           | Imports from          | Never imports from        |
|----------------|-----------------------|--------------------------|
| Page component | Page hook             | Store, adapter, data     |
| Page hook      | Store (`@/store`)     | Adapter, data            |
| Store          | Adapter (`@/data/adapters`), Collections | Pages, hooks   |
| Adapter        | Collections, seed     | Stores, pages, hooks     |
| Seed files     | Types only            | Stores, adapters, pages  |

| What                  | Where it happens    |
|----------------------|---------------------|
| ID generation        | Store (before `adapter.create`) |
| Timestamps           | Store (`Date.now()`) |
| Loading/error state  | Store (`isLoading`, `error`) |
| Data fetching        | Store (via adapter) |
| Multi-store joins    | Page hook (`useMemo`) |
| Initial fetch        | Page hook (`useEffect`) |
| Rendering            | Page component |
