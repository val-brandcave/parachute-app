"use client";

import { useToast } from "@realwired/ui";
import { Button, Chip, Icon } from "@/components/atoms";

/** Read-only placeholder: SSO is set up by Realwired staff, not self-served. */
export function SsoCard({
  domain,
  canManage = true,
}: {
  domain: string | null;
  canManage?: boolean;
}) {
  const toast = useToast();
  return (
    <div className="card bx-card bx-sso">
      <div className="bx-sso-head">
        <span className="bx-sso-ic" aria-hidden="true">
          <Icon name="key" size={20} />
        </span>
        <div className="bx-sso-title">
          <h2>Single sign-on</h2>
          <p>SAML / OIDC set up by Realwired staff.</p>
        </div>
        <Chip>Not configured</Chip>
      </div>
      <dl className="bx-sso-list">
        <div>
          <dt>Protocol</dt>
          <dd>SAML 2.0 or OpenID Connect</dd>
        </div>
        <div>
          <dt>Verified domain</dt>
          <dd>{domain ?? "None yet"}</dd>
        </div>
        <div>
          <dt>Sign-in today</dt>
          <dd>Realwired ID, with e-mail and password</dd>
        </div>
      </dl>
      {canManage && (
        <div className="bx-sso-foot">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: "Request sent to Realwired staff",
                description:
                  "Prototype only. Staff set up SSO with your IT team.",
                tone: "info",
              })
            }
          >
            Ask Realwired to set up SSO
          </Button>
        </div>
      )}
    </div>
  );
}
