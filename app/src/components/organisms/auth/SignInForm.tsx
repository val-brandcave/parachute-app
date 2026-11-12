"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, MicrosoftGlyph } from "@/components/atoms";
import { demoPersonas } from "@/data/seed/demo-personas.seed";
import { landingRoute, resolveEntryRoute } from "@/lib/landing";
import { seedUsers } from "@/data/seed/users.seed";
import { useProtoStore } from "@/store/prototype.store";
import { PRESETS } from "@/lib/prototype/presets";
import { useSessionStore } from "@/store/session.store";
import { useUsersStore } from "@/store/users.store";
import { loadSessionData } from "@/store/session-data";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { useAuthVariant } from "./useAuthVariant";

const BAD_CREDENTIALS = "E-mail or password is incorrect.";

/** The demo personas that are signed-in members, with the e-mail they sign in with. */
export function signInPersonas() {
  return demoPersonas
    .filter((p) => p.group === "signed_in" && p.userId)
    .map((p) => ({ persona: p, email: seedUsers.find((u) => u.id === p.userId)?.email ?? "" }));
}

/** Becomes a legacy persona through its preset alias (its seeded identity, rows untouched). */
async function enterLegacy(personaId: string): Promise<void> {
  const preset = PRESETS.find((p) => p.legacyPersonaId === personaId);
  if (preset) await useProtoStore.getState().enterPreset(preset, { alias: true });
}

const personaById = (id: string) => demoPersonas.find((p) => p.id === id);

/** Keycloak login-username then login-password, themed (identity-first, one card). */
export function SignInForm() {
  const router = useRouter();
  const variant = useAuthVariant();
  const bad = variant === "bad-credentials";
  const [step, setStep] = useState<"email" | "password">(bad ? "password" : "email");
  const [email, setEmail] = useState(bad ? "dana.reyes@harborcb.com" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(bad ? BAD_CREDENTIALS : null);

  // Fill wand: the demo admin's email and password; Shift = an address and password that fail.
  useProtoFill("sign-in", {
    valid: () => {
      if (step === "email") setEmail("dana.reyes@harborcb.com");
      else setPassword("harbor-demo-2026");
      setError(null);
    },
    invalid: () => {
      if (step === "email") setEmail("dana.reyes@");
      else setPassword("nope");
    },
  });

  const continueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your work email.");
      return;
    }
    setError(null);
    setStep("password"); // never reveals whether the address exists
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wanted = email.trim().toLowerCase();
    const known = signInPersonas().find((p) => p.email.toLowerCase() === wanted);
    if (password && known) {
      await enterLegacy(known.persona.id);
      router.push(resolveEntryRoute(known.persona.entryRoute));
      return;
    }
    // A member created at runtime (the sign-up flow) signs in too.
    const member = useUsersStore.getState().allUsers.find((u) => u.email?.toLowerCase() === wanted);
    if (password && member) {
      useSessionStore.getState().signIn({ userId: member.id, orgId: member.orgId, role: member.role });
      await loadSessionData();
      router.push(landingRoute());
      return;
    }
    setError(BAD_CREDENTIALS);
  };

  const microsoft = async () => {
    const persona = personaById("returning");
    if (!persona) return;
    await enterLegacy(persona.id);
    router.push(resolveEntryRoute(persona.entryRoute));
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
      {error && (
        <p className="kc-err" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block>
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
