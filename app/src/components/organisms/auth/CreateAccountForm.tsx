"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, MicrosoftGlyph } from "@/components/atoms";
import { shakeEl, useKeycloakFrame } from "@/components/templates/KeycloakFrame";
import { useSessionStore } from "@/store/session.store";
import { dur, ease, motionModeNow, setHandoff, useMotionMode } from "@/lib/motion";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { useAuthVariant } from "./useAuthVariant";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Keycloak register.ftl, themed. Submit goes to the verify-code step. */
export function CreateAccountForm() {
  const router = useRouter();
  const variant = useAuthVariant();
  const [email, setEmail] = useState(variant === "invalid-email" ? "dana.reyes@" : "dana.reyes@harborcb.com");
  const [name, setName] = useState("Dana Reyes");
  const [password, setPassword] = useState(variant === "weak-password" ? "short" : "harbor-demo-2026");
  const [error, setError] = useState<string | null>(
    variant === "invalid-email" ? "Enter a valid work email." : variant === "weak-password" ? "Use 12 characters or more for your password." : null,
  );
  const [busy, setBusy] = useState(false);
  const frame = useKeycloakFrame();
  const full = useMotionMode() === "full";
  const [errId, setErrId] = useState<string | null>(
    variant === "invalid-email" ? "kc-email" : variant === "weak-password" ? "kc-pw" : null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // T1: busy (mock latency), record the card's height, exit the content, then push.
  const goVerify = async (e: string, n: string) => {
    if (busy) return;
    setBusy(true);
    await wait(motionModeNow() === "off" ? 0 : 600);
    useSessionStore.getState().verify({ email: e, name: n });
    const rect = frame.cardRect();
    if (rect) setHandoff({ from: "signup", rect });
    await frame.exit(1);
    router.push(`/auth/verify?email=${encodeURIComponent(e)}`);
  };

  // Validation on click: message, shake the field, focus it. The button is never disabled.
  const invalid = (id: string, msg: string) => {
    setError(msg);
    setErrId(id);
    const input = formRef.current?.querySelector<HTMLInputElement>(`#${id}`);
    input?.focus();
    shakeEl(input?.closest<HTMLElement>(".field") ?? null);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return invalid("kc-email", "Enter a valid work email.");
    if (!name.trim()) return invalid("kc-name", "Enter your full name.");
    if (password.length < 12) return invalid("kc-pw", "Use 12 characters or more for your password.");
    setError(null);
    setErrId(null);
    void goVerify(email.trim(), name.trim());
  };

  // Fill wand: good demo data; Shift = a bad email, no name and a short password. Never submits.
  useProtoFill("create-account", {
    valid: () => {
      setEmail("dana.reyes@harborcb.com");
      setName("Dana Reyes");
      setPassword("harbor-demo-2026");
      setError(null);
      setErrId(null);
    },
    invalid: () => {
      setEmail("dana.reyes@");
      setName("");
      setPassword("short");
    },
  });

  // Microsoft is a one-click identity: same path, nothing to type.
  const microsoft = () => void goVerify(email.trim() || "dana.reyes@harborcb.com", name.trim() || "Dana Reyes");

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <h1 className="kc-title">Create your account</h1>
      <p className="kc-sub">Use your work email. Your organization is set up next.</p>

      <div className="field">
        <label htmlFor="kc-email">Work email</label>
        <input id="kc-email" type="email" autoComplete="email" aria-invalid={errId === "kc-email" || undefined} aria-describedby={errId === "kc-email" && error ? "kc-form-err" : undefined} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="kc-name">Full name</label>
        <input id="kc-name" autoComplete="name" aria-invalid={errId === "kc-name" || undefined} aria-describedby={errId === "kc-name" && error ? "kc-form-err" : undefined} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="kc-pw">Password</label>
        <input id="kc-pw" type="password" autoComplete="new-password" aria-invalid={errId === "kc-pw" || undefined} aria-describedby={errId === "kc-pw" && error ? "kc-form-err" : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <p className="kc-hint">12 characters or more</p>
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="err"
            style={{ overflow: "hidden", marginTop: -6 }}
            initial={full ? { height: 0, opacity: 0 } : { opacity: 0 }}
            animate={{ ...(full && { height: "auto" }), opacity: 1, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.standard } }}
            exit={{ ...(full && { height: 0 }), opacity: 0, transition: { duration: full ? dur.quick : dur.reducedFade, ease: ease.exit } }}
          >
            <p id="kc-form-err" className="kc-err" role="alert" style={{ margin: "0 0 14px" }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" block busy={busy}>
        Create account
      </Button>
      <div className="kc-or">or</div>
      <button type="button" className="sso" onClick={microsoft} aria-busy={busy || undefined}>
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
