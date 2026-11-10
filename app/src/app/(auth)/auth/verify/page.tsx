"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { VerifyCodeForm } from "@/components/organisms/auth/VerifyCodeForm";

function Verify() {
  const email = useSearchParams().get("email") ?? "dana.reyes@harborcb.com";
  return (
    <KeycloakFrame template="login-verify-email-code.ftl">
      <VerifyCodeForm email={email} />
    </KeycloakFrame>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}
