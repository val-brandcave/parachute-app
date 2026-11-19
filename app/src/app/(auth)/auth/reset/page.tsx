"use client";

import { Suspense } from "react";
import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { ResetForm } from "@/components/organisms/auth/ResetForm";

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <KeycloakFrame template="login-reset-password.ftl">
        <ResetForm />
      </KeycloakFrame>
    </Suspense>
  );
}
