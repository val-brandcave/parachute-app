"use client";

import { Fragment } from "react";
import { Logo } from "@/components/Logo";
import type { EmailBlock, EmailSpec } from "./content";

/** `**bold**` inline emphasis. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

function Block({ b }: { b: EmailBlock }) {
  switch (b.kind) {
    case "p":
      return (
        <p className="em-p">
          <Rich text={b.text} />
        </p>
      );
    case "code":
      return (
        <div className="em-code" aria-label={`Code ${b.value}`}>
          {b.value}
        </div>
      );
    case "rows":
      return (
        <dl className="em-rows">
          {b.rows.map(([k, v]) => (
            <div key={k} className="em-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      );
    case "cta":
      // A preview: the button looks live but goes nowhere.
      return (
        <span className="em-btn" role="img" aria-label={`Button: ${b.label}`}>
          {b.label}
        </span>
      );
    case "small":
      return <p className="em-small">{b.text}</p>;
  }
}

/** One e-mail: a From / To / Subject strip above a white paper. */
export function EmailCard({ email }: { email: EmailSpec }) {
  return (
    <article id={email.id} className="em-card" aria-label={email.subject}>
      <header className="em-meta">
        <div className="em-meta-line">
          From: {email.from} <span>&lt;{email.fromAddress}&gt;</span>
        </div>
        <div className="em-meta-line">To: {email.to}</div>
        <h2 className="em-subject">{email.subject}</h2>
      </header>
      <div className="em-paper">
        <div className="em-brand">
          <Logo variant="white" full height={22} />
          <span className="em-product">{email.product}</span>
        </div>
        <div className="em-body">
          {email.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </div>
        <footer className="em-foot">
          <span>Realwired</span>
          <span aria-hidden>·</span>
          <span>Help</span>
          <span aria-hidden>·</span>
          <span>Unsubscribe</span>
        </footer>
      </div>
    </article>
  );
}
