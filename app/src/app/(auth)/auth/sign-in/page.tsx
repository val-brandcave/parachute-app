"use client";

import { Suspense } from "react";
import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { SignInForm } from "@/components/organisms/auth/SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <KeycloakFrame template="login-username.ftl">
        <SignInForm />
      </KeycloakFrame>
    </Suspense>
  );
}
