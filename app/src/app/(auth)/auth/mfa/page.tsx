"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { MfaForm } from "@/components/organisms/auth/MfaForm";

function Mfa() {
  const next = useSearchParams().get("next") ?? "/dashboard";
  return (
    <KeycloakFrame template="login-otp.ftl">
      <MfaForm next={next.startsWith("/") ? next : "/dashboard"} />
    </KeycloakFrame>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <Mfa />
    </Suspense>
  );
}
