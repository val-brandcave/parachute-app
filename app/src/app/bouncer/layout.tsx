import type { Metadata } from "next";

export const metadata: Metadata = { title: "Realwired Admin" };

/** Realwired Admin (Bouncer) is a separate product: no Parachute AppShell here. */
export default function BouncerLayout({ children }: { children: React.ReactNode }) {
  return <div className="bx">{children}</div>;
}
