import type { DataAdapter } from "./types";
import { mockAdapter } from "./mock-adapter";
import { apiAdapter } from "./api-adapter";

/**
 * The single decision point. The whole app imports `adapter` from here and
 * never knows which implementation is behind it. Default is `mock` for the
 * prototype; set NEXT_PUBLIC_DATA_SOURCE=api once the backend exists.
 */
const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

export const adapter: DataAdapter = source === "api" ? apiAdapter : mockAdapter;

export type { DataAdapter } from "./types";
