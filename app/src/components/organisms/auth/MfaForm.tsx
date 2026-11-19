"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { CodeBoxes } from "@/components/molecules";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { useAuthVariant } from "./useAuthVariant";

/** Keycloak login-otp, themed. Any six digits pass (prototype). */
function MfaFormBody({ next }: { next: string }) {
  const router = useRouter();
  const variant = useAuthVariant();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(variant === "wrong-code" ? "That code didn't match. Try the next one in your app." : null);

  useProtoFill("mfa", {
    valid: () => {
      setCode("123456");
      setError(null);
    },
    invalid: () => setCode("12"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length < 6) {
          setError("Enter the 6-digit code from your authenticator app.");
          return;
        }
        router.push(next);
      }}
    >
      <h1 className="kc-title">Enter your authenticator code</h1>
      <p className="kc-sub">Open your authenticator app and type the 6-digit code for Parachute.</p>
      <CodeBoxes
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
        autoFocus
        label="Authenticator code"
        invalid={!!error}
      />
      {error && (
        <p className="kc-err" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block>
        Verify
      </Button>
      <p className="kc-alt">
        <Link className="kc-link" href="/auth/sign-in">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

/** Remounts on a state-pill variant change so the form's fields and error reset to that state. */
export function MfaForm(props: { next: string }) {
  const variant = useAuthVariant();
  return <MfaFormBody key={variant ?? "default"} {...props} />;
}
