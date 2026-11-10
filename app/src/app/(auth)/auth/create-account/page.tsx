"use client";

import { KeycloakFrame } from "@/components/templates/KeycloakFrame";
import { CreateAccountForm, CreateAccountLegal } from "@/components/organisms/auth/CreateAccountForm";

export default function CreateAccountPage() {
  return (
    <KeycloakFrame template="register.ftl" below={<CreateAccountLegal />}>
      <CreateAccountForm />
    </KeycloakFrame>
  );
}
