"use client";

import { useState } from "react";
import { Tabs, SegmentedControl, AvatarUpload } from "@/components/molecules";
import { Card, Input, Label, Divider, Switch } from "@/components/atoms";
import { useIdentityStore, usePrefsStore } from "@/store";
import { CURRENT_USER } from "@/lib/current-user";

type TabKey = "account" | "prefs" | "notifs";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ padding: "var(--d-card-pad)", marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
        {title}
      </div>
      {desc && (
        <div style={{ color: "var(--md-on-surface-v)", fontSize: 13, marginTop: 3 }}>
          {desc}
        </div>
      )}
      <Divider style={{ margin: "14px 0" }} />
      {children}
    </Card>
  );
}

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

// --- Notifications -----------------------------------------------------------

type Channels = { email: boolean; inApp: boolean };
type NotifKey = "assigned" | "sla" | "mentions" | "status";

const NOTIF_EVENTS: { key: NotifKey; label: string; desc: string }[] = [
  { key: "assigned", label: "Review assigned to me", desc: "When a review is assigned or reassigned to you." },
  { key: "sla", label: "SLA approaching or breached", desc: "Timer warnings and breaches on your reviews." },
  { key: "mentions", label: "Comments & mentions", desc: "When someone comments on or @mentions you." },
  { key: "status", label: "Status changes", desc: "When a review you own changes status." },
];

const DEFAULT_NOTIFS: Record<NotifKey, Channels> = {
  assigned: { email: true, inApp: true },
  sla: { email: true, inApp: true },
  mentions: { email: false, inApp: true },
  status: { email: false, inApp: true },
};

function NotifTable() {
  const [state, setState] = useState<Record<NotifKey, Channels>>(DEFAULT_NOTIFS);
  const toggle = (key: NotifKey, ch: keyof Channels) =>
    setState((s) => ({ ...s, [key]: { ...s[key], [ch]: !s[key][ch] } }));

  return (
    <div className="notif-table">
      <div className="notif-row notif-head">
        <span />
        <span className="notif-col">Email</span>
        <span className="notif-col">In&nbsp;app</span>
      </div>
      {NOTIF_EVENTS.map((e) => (
        <div className="notif-row" key={e.key}>
          <div className="notif-meta">
            <div className="notif-label">{e.label}</div>
            <div className="notif-desc">{e.desc}</div>
          </div>
          <span className="notif-col">
            <Switch
              checked={state[e.key].email}
              onChange={() => toggle(e.key, "email")}
              label={`${e.label} — email`}
            />
          </span>
          <span className="notif-col">
            <Switch
              checked={state[e.key].inApp}
              onChange={() => toggle(e.key, "inApp")}
              label={`${e.label} — in app`}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Page --------------------------------------------------------------------

export default function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("account");
  const { density, setDensity, theme, setTheme } = usePrefsStore();
  const { userAvatar, setUserAvatar } = useIdentityStore();
  const [digest, setDigest] = useState("weekly");

  return (
    <>
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "account", label: "Account" },
            { value: "prefs", label: "Preferences" },
            { value: "notifs", label: "Notifications" },
          ]}
        />
        <div style={{ flex: 1 }} />
      </div>

      <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
        {tab === "account" && (
          <>
            <Section title="Profile photo" desc="Shown on your reviews and across the app.">
              <AvatarUpload
                value={userAvatar}
                onChange={setUserAvatar}
                initials={CURRENT_USER.initials}
                shape="circle"
                uploadLabel="Upload photo"
                hint="PNG or JPG, square, up to 1 MB."
              />
            </Section>
            <Section title="Reviewer profile" desc="Shown on signed workbooks and attestations.">
              <div style={grid2}>
                <div>
                  <Label>Name</Label>
                  <Input defaultValue={CURRENT_USER.name} />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input defaultValue={CURRENT_USER.designation} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={CURRENT_USER.email} type="email" />
                </div>
                <div>
                  <Label>Signature name</Label>
                  <Input defaultValue={CURRENT_USER.signatureName} />
                </div>
              </div>
            </Section>
          </>
        )}

        {tab === "prefs" && (
          <>
            <Section title="Theme" desc="Choose how Parachute looks. System follows your device.">
              <SegmentedControl
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
            </Section>
            <Section
              title="Display density"
              desc="How much information is shown per screen. Affects spacing and type scale, not layout."
            >
              <SegmentedControl
                value={density}
                onChange={setDensity}
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ]}
              />
            </Section>
          </>
        )}

        {tab === "notifs" && (
          <>
            <Section
              title="Notifications"
              desc="Choose how you hear about activity on your reviews."
            >
              <NotifTable />
            </Section>
            <Section title="Email digest" desc="A periodic summary of your queue and pending work.">
              <select
                className="qfilter"
                value={digest}
                onChange={(e) => setDigest(e.target.value)}
                style={{ width: 220, height: 42 }}
              >
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
