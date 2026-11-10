"use client";

import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { DemoAccounts, SignInForm } from "@/components/organisms/auth/SignInForm";
import { DEMO_ENABLED } from "@/lib/demo";

export default function SignInPage() {
  return (
    <KeycloakFrame template="login-username.ftl" after={DEMO_ENABLED ? <DemoAccounts /> : undefined}>
      <SignInForm />
    </KeycloakFrame>
  );
}
