"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SegmentedControl } from "@/components/molecules";
import { usePrefsStore } from "@/store/prefs.store";
import { EMAILS_NOTE, emails } from "./content";
import { EmailCard } from "./EmailCard";
import "./emails.css";

const hashId = () => {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#/, "");
  return emails.some((e) => e.id === h) ? h : null;
};

/**
 * PROTOTYPE ONLY. Previews of the Realwired-branded transactional e-mails.
 * `/emails#receipt` shows just that one e-mail; "All" shows the set.
 */
export default function EmailsPage() {
  const [only, setOnly] = useState<string | null>(() => hashId());
  const theme = usePrefsStore((s) => s.theme);
  const setTheme = usePrefsStore((s) => s.setTheme);

  useEffect(() => {
    const onHash = () => setOnly(hashId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const pick = (id: string | null) => {
    setOnly(id);
    window.history.replaceState(null, "", id ? `#${id}` : window.location.pathname);
  };

  const shown = only ? emails.filter((e) => e.id === only) : emails;

  return (
    <div className="em-page">
      <header className="em-band">
        <div className="em-band-main">
          <Logo full height={24} themeAware />
          <h1 className="em-title">E-mail previews</h1>
          <p className="em-note">{EMAILS_NOTE}</p>
        </div>
        <div className="em-band-side">
          <SegmentedControl
            label="Theme"
            value={theme === "dark" ? "dark" : "light"}
            onChange={(v) => setTheme(v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <Link className="em-back" href="/start">
            Back to start
          </Link>
        </div>
      </header>

      <nav className="em-filter" aria-label="Choose an e-mail">
        <button className="em-chip" aria-pressed={only === null} onClick={() => pick(null)}>
          All
        </button>
        {emails.map((e) => (
          <button key={e.id} className="em-chip" aria-pressed={only === e.id} onClick={() => pick(e.id)}>
            {e.chip}
          </button>
        ))}
      </nav>

      <main className="em-grid">
        {shown.map((e) => (
          <EmailCard key={e.id} email={e} />
        ))}
      </main>
    </div>
  );
}
