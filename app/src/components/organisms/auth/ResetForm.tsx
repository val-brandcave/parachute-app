"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Icon } from "@/components/atoms";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { useAuthVariant } from "./useAuthVariant";

/** Keycloak login-reset-password, themed. Never says whether the address exists. */
function ResetFormBody() {
  const variant = useAuthVariant();
  const [email, setEmail] = useState(variant === "sent" ? "dana.reyes@harborcb.com" : "");
  const [sent, setSent] = useState(variant === "sent");
  const [error, setError] = useState<string | null>(null);

  useProtoFill("reset", {
    valid: () => {
      setEmail("dana.reyes@harborcb.com");
      setError(null);
    },
    invalid: () => setEmail("dana.reyes@"),
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
          setError("Enter a valid work email.");
          return;
        }
        setError(null);
        setSent(true);
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
          {error && (
            <p className="kc-err" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" block>
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

/** Remounts on a state-pill variant change so the form's fields and error reset to that state. */
export function ResetForm() {
  const variant = useAuthVariant();
  return <ResetFormBody key={variant ?? "default"} />;
}
