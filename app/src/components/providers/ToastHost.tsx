"use client";

import { ToastProvider } from "@realwired/ui";

/** Client boundary for the library's ToastProvider (the root layout is a server
 *  component and the library's overlays cannot be imported there). */
export function ToastHost({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
