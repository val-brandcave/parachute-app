"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import { CodeBoxes } from "@/components/molecules";
import { useKeycloakFrame } from "@/components/templates/KeycloakFrame";
import { useSessionStore } from "@/store/session.store";
import { dur, ease, motionModeNow, setHandoff, useMotionMode } from "@/lib/motion";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { useAuthVariant } from "./useAuthVariant";

const RESEND_SECONDS = 42;
/** Prototype: any six digits pass except this one, so the wrong-code state can be shown. */
const WRONG_CODE = "000000";

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Keycloak verify-email-code, themed. Any six digits pass except 000000 (prototype). */
function VerifyCodeFormBody({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();
  const frame = useKeycloakFrame();
  const mode = useMotionMode();
  const full = mode === "full";
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [status, setStatus] = useState<"idle" | "checking" | "ok">("idle");
  const variant = useAuthVariant();
  const [error, setError] = useState<string | null>(
    variant === "wrong-code"
      ? "That code didn't match. Check your email and try again."
      : variant === "expired"
        ? "That code has expired. Ask for a new one."
        : null,
  );
  const [shakeKey, setShakeKey] = useState(0);
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Fill wand: a code that passes; Shift = 000000, the code that never matches. Never submits.
  useProtoFill("verify", {
    valid: () => {
      setCode("123456");
      setError(null);
    },
    invalid: () => setCode(WRONG_CODE),
  });

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (status !== "idle") return;
    if (code.length < 6) {
      // Never a disabled button: explain, shake, and focus the first empty box.
      setError("Enter the 6-digit code from your email.");
      setShakeKey((k) => k + 1);
      setFocusKey((k) => k + 1);
      return;
    }
    setError(null);
    setStatus("checking");
    const mode = motionModeNow();
    await wait(mode === "off" ? 0 : 400); // mock latency
    if (code === WRONG_CODE) {
      setCode("");
      setStatus("idle");
      setError("That code didn't match. Check your email and try again.");
      setShakeKey((k) => k + 1);
      setFocusKey((k) => k + 1);
      return;
    }
    // Success: the check draws (280 ms), then the content exits (150 ms) and the card hands off (T2).
    setStatus("ok");
    await wait(mode === "off" ? 0 : mode === "reduced" ? dur.reducedFade * 1000 : dur.standard * 1000);
    const s = useSessionStore.getState();
    s.verify({ email: s.email ?? email, name: s.name ?? "" });
    const rect = frame.cardRect();
    if (rect) setHandoff({ from: "verify", rect });
    await frame.exit(1);
    router.push("/welcome");
  };

  const resend = () => {
    if (left > 0) {
      toast({ title: "Code already sent", description: `You can ask for another in ${clock(left)}.`, tone: "info" });
      return;
    }
    setLeft(RESEND_SECONDS);
    toast({ title: "Code sent", description: `A new code is on its way to ${email}.`, tone: "success" });
  };

  const back = async () => {
    const rect = frame.cardRect();
    if (rect) setHandoff({ from: "verify", rect });
    await frame.exit(-1);
    router.push("/auth/create-account");
  };

  return (
    <form onSubmit={verify}>
      <h1 className="kc-title">Check your inbox</h1>
      <p className="kc-sub">We sent a 6-digit code to {email}.</p>

      <div className="field" style={{ marginBottom: 8 }}>
        <label>Verification code</label>
      </div>
      <CodeBoxes
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
        invalid={!!error}
        describedBy="kc-code-err"
        autoFocus
        shakeKey={shakeKey}
        focusKey={focusKey}
      />
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="err"
            style={{ overflow: "hidden", marginTop: -6 }}
            initial={full ? { height: 0, opacity: 0 } : { opacity: 0 }}
            animate={{ ...(full && { height: "auto" }), opacity: 1, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.standard } }}
            exit={{ ...(full && { height: 0 }), opacity: 0, transition: { duration: full ? dur.quick : dur.reducedFade, ease: ease.exit } }}
          >
            <p id="kc-code-err" className="kc-err" role="alert" style={{ margin: "0 0 14px" }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" block busy={status === "checking"}>
        {status === "ok" ? (
          // The check "draws" as a left-to-right wipe (Icon is the only sanctioned glyph source).
          <motion.span
            initial={full ? { clipPath: "inset(0 100% 0 0)" } : { opacity: 0 }}
            animate={full ? { clipPath: "inset(0 0% 0 0)" } : { opacity: 1 }}
            transition={{ duration: full ? dur.standard : dur.reducedFade, ease: ease.standard }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Icon name="check" size={17} />
            Verified
          </motion.span>
        ) : (
          "Verify email"
        )}
      </Button>

      <p
        role="status"
        aria-live="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
      >
        {status === "ok" ? "Email verified. Continuing to set up your organization." : ""}
      </p>

      <div className="kc-resend">
        <button
          type="button"
          className="kc-link"
          onClick={resend}
          aria-disabled={left > 0 || undefined}
          aria-describedby={left > 0 ? "kc-resend-reason" : undefined}
        >
          Resend code
        </button>
        {left > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span id="kc-resend-reason" aria-live="polite">
              You can resend in {clock(left)}
            </span>
          </>
        )}
      </div>
      <p className="kc-alt">
        Wrong address?{" "}
        <button type="button" className="kc-link" onClick={back}>
          Go back
        </button>
      </p>
    </form>
  );
}

/** Remounts on a state-pill variant change so the form's fields and error reset to that state. */
export function VerifyCodeForm(props: { email: string }) {
  const variant = useAuthVariant();
  return <VerifyCodeFormBody key={variant ?? "default"} {...props} />;
}
