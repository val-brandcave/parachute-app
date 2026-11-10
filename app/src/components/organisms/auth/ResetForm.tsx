"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Icon } from "@/components/atoms";

/** Keycloak login-reset-password, themed. Never says whether the address exists. */
export function ResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setSent(true);
      }}
    >
      <h1 className="kc-title">Reset your password</h1>
      <p className="kc-sub">Enter your work email and we will send a link to choose a new password.</p>

      {sent ? (
        <div className="kc-note" role="status">
          <Icon name="check-circle" size={18} />
          <span>If that address has an account, a link is on its way.</span>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="kc-reset-email">Work email</label>
            <input id="kc-reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" size="lg" block disabled={!email.trim()}>
            Send reset link
          </Button>
        </>
      )}
      <p className="kc-alt">
        <Link className="kc-link" href="/auth/sign-in">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
