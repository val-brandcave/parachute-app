"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, MicrosoftGlyph } from "@/components/atoms";
import { demoPersonas } from "@/data/seed/demo-personas.seed";
import { seedUsers } from "@/data/seed/users.seed";
import { useDemoStore } from "@/store/demo.store";
import { useSessionStore } from "@/store/session.store";
import { useUsersStore } from "@/store/users.store";
import { loadSessionData } from "@/store/session-data";

const BAD_CREDENTIALS = "E-mail or password is incorrect.";

/** The demo personas that are signed-in members, with the e-mail they sign in with. */
export function signInPersonas() {
  return demoPersonas
    .filter((p) => p.group === "signed_in" && p.userId)
    .map((p) => ({ persona: p, email: seedUsers.find((u) => u.id === p.userId)?.email ?? "" }));
}

/** Keycloak login-username then login-password, themed (identity-first, one card). */
export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const continueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setStep("password"); // never reveals whether the address exists
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wanted = email.trim().toLowerCase();
    const known = signInPersonas().find((p) => p.email.toLowerCase() === wanted);
    if (password && known) {
      const persona = await useDemoStore.getState().apply(known.persona.id);
      if (persona) router.push(persona.entryRoute);
      return;
    }
    // A member created at runtime (the sign-up flow) signs in too.
    const member = useUsersStore.getState().allUsers.find((u) => u.email?.toLowerCase() === wanted);
    if (password && member) {
      useSessionStore.getState().signIn({ userId: member.id, orgId: member.orgId, role: member.role });
      await loadSessionData();
      router.push("/dashboard");
      return;
    }
    setError(BAD_CREDENTIALS);
  };

  const microsoft = async () => {
    const persona = await useDemoStore.getState().apply("returning");
    if (persona) router.push(persona.entryRoute);
  };

  if (step === "password") {
    return (
      <form onSubmit={submit} noValidate>
        <h1 className="kc-title">Sign in to Parachute</h1>
        <p className="kc-sub">Enter the password for your Realwired ID.</p>

        <div className="kc-id">
          <Icon name="user" size={15} />
          <span>{email.trim()}</span>
          <button
            type="button"
            className="kc-link"
            onClick={() => {
              setStep("email");
              setPassword("");
              setError(null);
            }}
          >
            Not you?
          </button>
        </div>

        <div className="kc-fieldrow">
          <label htmlFor="kc-signin-pw">Password</label>
          <Link className="kc-link" href="/auth/reset">
            Forgot password?
          </Link>
        </div>
        <div className="field">
          <input
            id="kc-signin-pw"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="kc-err" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block>
          Continue
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={continueEmail} noValidate>
      <h1 className="kc-title">Sign in to Parachute</h1>
      <p className="kc-sub">Use your work email. Your organization&apos;s sign-in follows.</p>

      <div className="field">
        <label htmlFor="kc-signin-email">Work email</label>
        <input
          id="kc-signin-email"
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" block disabled={!email.trim()}>
        Continue
      </Button>
      <div className="kc-or">or</div>
      <button type="button" className="sso" onClick={microsoft}>
        <MicrosoftGlyph size={17} />
        Continue with Microsoft
      </button>
      <p className="kc-alt">
        New to Parachute?{" "}
        <Link className="kc-link" href="/auth/create-account">
          Create an account
        </Link>
      </p>
    </form>
  );
}

/** PROTOTYPE ONLY: picks a signed-in demo persona without typing credentials. */
export function DemoAccounts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pick = async (id: string) => {
    const persona = await useDemoStore.getState().apply(id);
    if (persona) router.push(persona.entryRoute);
  };
  return (
    <div className="kc-demo">
      <button type="button" className="kc-demo-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Demo accounts
        <Icon name={open ? "chevron-down" : "chevron-right"} size={14} />
      </button>
      {open && (
        <div className="kc-demo-list">
          {signInPersonas().map(({ persona, email }) => (
            <button key={persona.id} type="button" className="kc-demo-row" onClick={() => pick(persona.id)}>
              <span className="kc-demo-name">{persona.label}</span>
              <span className="kc-demo-mail">{email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
