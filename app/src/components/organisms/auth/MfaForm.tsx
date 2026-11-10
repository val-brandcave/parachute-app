"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { CodeBoxes } from "@/components/molecules";

/** Keycloak login-otp, themed. Any six digits pass (prototype). */
export function MfaForm({ next }: { next: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) router.push(next);
      }}
    >
      <h1 className="kc-title">Enter your authenticator code</h1>
      <p className="kc-sub">Open your authenticator app and type the 6-digit code for Parachute.</p>
      <CodeBoxes value={code} onChange={setCode} autoFocus label="Authenticator code" />
      <Button type="submit" size="lg" block disabled={code.length < 6}>
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
