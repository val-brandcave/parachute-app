"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, MicrosoftGlyph } from "@/components/atoms";
import { useSessionStore } from "@/store/session.store";

/** Keycloak register.ftl, themed. Submit goes to the verify-code step. */
export function CreateAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("dana.reyes@harborcb.com");
  const [name, setName] = useState("Dana Reyes");
  const [password, setPassword] = useState("harbor-demo-2026");
  const [error, setError] = useState<string | null>(null);

  const goVerify = (e: string, n: string) => {
    useSessionStore.getState().verify({ email: e, name: n });
    router.push(`/auth/verify?email=${encodeURIComponent(e)}`);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid work email.");
    if (!name.trim()) return setError("Enter your full name.");
    if (password.length < 12) return setError("Use 12 characters or more for your password.");
    setError(null);
    goVerify(email.trim(), name.trim());
  };

  // Microsoft is a one-click identity: same path, nothing to type.
  const microsoft = () => goVerify(email.trim() || "dana.reyes@harborcb.com", name.trim() || "Dana Reyes");

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="kc-title">Create your account</h1>
      <p className="kc-sub">Use your work email. Your organization is set up next.</p>

      <div className="field">
        <label htmlFor="kc-email">Work email</label>
        <input id="kc-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="kc-name">Full name</label>
        <input id="kc-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="kc-pw">Password</label>
        <input id="kc-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <p className="kc-hint">12 characters or more</p>
      {error && (
        <p className="kc-err" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block>
        Create account
      </Button>
      <div className="kc-or">or</div>
      <button type="button" className="sso" onClick={microsoft}>
        <MicrosoftGlyph size={17} />
        Continue with Microsoft
      </button>
      <p className="kc-alt">
        Already have an account?{" "}
        <Link className="kc-link" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function CreateAccountLegal() {
  return (
    <p className="kc-legal">
      By continuing you agree to the <b>Terms</b> and the <b>Privacy policy</b>.
    </p>
  );
}
