"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Icon } from "@/components/atoms";
import { Tabs } from "@/components/molecules";
import { InviteDialog } from "./_components/InviteDialog";
import { MembersTable } from "./_components/MembersTable";
import { PendingTable } from "./_components/PendingTable";
import { SsoCard } from "./_components/SsoCard";
import { TopBar } from "./_components/TopBar";
import { safeReturn, withJoined } from "./return-path";
import { useBouncerAdmin } from "./useBouncerAdmin";
import "./bouncer.css";

type Tab = "members" | "invites" | "sso";

/** Realwired Admin (Bouncer) mock: members, invites and SSO. A separate product from Parachute. */
function BouncerAdminPage() {
  const params = useSearchParams();
  const admin = useBouncerAdmin();
  const [tab, setTab] = useState<Tab>("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const back = withJoined(safeReturn(params.get("return")), admin.lastJoinedId);

  return (
    <>
      <TopBar
        orgName={admin.orgName}
        initials={admin.me.initials}
        backHref={back}
      />
      <main className="bx-main">
        <div className="bx-title">
          <div>
            <h1>Members &amp; roles</h1>
            <p>
              {admin.orgName} · {admin.members.length}{" "}
              {admin.members.length === 1 ? "member" : "members"}
              {admin.pending.length > 0 && ` · ${admin.pending.length} pending`}
            </p>
          </div>
          {admin.canManage && (
            <Button iconLeft="user-plus" onClick={() => setInviteOpen(true)}>
              Invite people
            </Button>
          )}
        </div>

        {!admin.canManage && (
          <p className="bx-readonly">
            <Icon name="lock" size={14} />
            Only your organization admin can manage members. Ask{" "}
            {admin.adminName ?? "your admin"}.
          </p>
        )}

        <div className="bx-tabs">
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              {
                value: "members",
                label: "Members",
                count: admin.members.length,
              },
              {
                value: "invites",
                label: "Pending invites",
                count: admin.pending.length,
              },
              { value: "sso", label: "Single sign-on" },
            ]}
          />
        </div>

        {tab === "members" && <MembersTable admin={admin} />}
        {tab === "invites" && (
          <PendingTable admin={admin} onInvite={() => setInviteOpen(true)} />
        )}
        {tab === "sso" && <SsoCard domain={admin.domain} canManage={admin.canManage} />}
      </main>

      {admin.canManage && (
        <InviteDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          admin={admin}
          onSent={() => {
            setInviteOpen(false);
            setTab("invites");
          }}
        />
      )}
    </>
  );
}

export default function BouncerPage() {
  return (
    <Suspense fallback={null}>
      <BouncerAdminPage />
    </Suspense>
  );
}
