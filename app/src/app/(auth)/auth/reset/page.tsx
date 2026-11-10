"use client";

import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { ResetForm } from "@/components/organisms/auth/ResetForm";

export default function ResetPage() {
  return (
    <KeycloakFrame template="login-reset-password.ftl">
      <ResetForm />
    </KeycloakFrame>
  );
}
