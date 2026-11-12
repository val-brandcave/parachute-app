"use client";

import { Suspense } from "react";
import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { CreateAccountForm, CreateAccountLegal } from "@/components/organisms/auth/CreateAccountForm";

export default function CreateAccountPage() {
  return (
    <Suspense fallback={null}>
      <KeycloakFrame template="register.ftl" below={<CreateAccountLegal />}>
        <CreateAccountForm />
      </KeycloakFrame>
    </Suspense>
  );
}
