"use client";

import { useState } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import {
  Button,
  IconButton,
  Chip,
  Input,
  Textarea,
  Label,
  Avatar,
  Divider,
  Spinner,
  Kbd,
  Card,
  Icon,
  ICONS,
  type IconName,
} from "@/components/atoms";
import {
  SeverityChip,
  ConfidenceMeter,
  StatCard,
  SegmentedControl,
  ActionMenu,
} from "@/components/molecules";
import type { Severity } from "@/types";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ padding: 20, marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--md-on-surface-v)",
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {children}
      </div>
    </Card>
  );
}

export default function ComponentsPage() {
  const [seg, setSeg] = useState("a");
  const severities: Severity[] = ["crit", "fail", "flag", "pass", "na"];

  return (
    <>
      <PageHeader title="Components" />
      <div className="pagebody">

      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--md-primary)", margin: "8px 0 12px" }}>
        Atoms
      </h2>

      <Block title="Buttons">
        <Button variant="primary">Primary</Button>
        <Button variant="accent" iconLeft="add">Accent</Button>
        <Button variant="outline" iconLeft="download">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger" iconLeft="reject">Danger</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </Block>

      <Block title="Icon buttons">
        <IconButton name="bell" />
        <IconButton name="help" />
        <IconButton name="more" />
        <IconButton name="settings" />
      </Block>

      <Block title="Chips & severity">
        <Chip>Neutral</Chip>
        <Chip tone="accent">Accent</Chip>
        <Chip tone="info">Info</Chip>
        {severities.map((s) => (
          <SeverityChip key={s} severity={s} />
        ))}
      </Block>

      <Block title="Inputs (always white)">
        <div style={{ width: 240 }}>
          <Label>Property</Label>
          <Input placeholder="1450 Corporate Center Dr" />
        </div>
        <div style={{ width: 280 }}>
          <Label>Note</Label>
          <Textarea placeholder="Reason for rejecting…" />
        </div>
      </Block>

      <Block title="Misc atoms">
        <Avatar initials="AM" />
        <Spinner />
        <Kbd>J</Kbd>
        <Kbd>⌘K</Kbd>
        <ConfidenceMeter value={0.88} />
        <Divider />
      </Block>

      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--md-primary)", margin: "20px 0 12px" }}>
        Molecules
      </h2>

      <Block title="Segmented control">
        <SegmentedControl
          value={seg}
          onChange={setSeg}
          options={[
            { value: "a", label: "All" },
            { value: "b", label: "Mine" },
            { value: "c", label: "Flagged" },
          ]}
        />
      </Block>

      <Block title="Action menu (overflow)">
        <ActionMenu
          items={[
            { label: "Disagree & edit", icon: "edit", onClick: () => {} },
            { label: "Add comment", icon: "comment", onClick: () => {} },
            { label: "Open source page", icon: "book", onClick: () => {} },
            { label: "Reject finding", icon: "reject", danger: true, onClick: () => {} },
          ]}
        />
        <span style={{ fontSize: 13, color: "var(--md-on-surface-v)" }}>
          Secondary/tertiary actions live here; primary decisions stay visible.
        </span>
      </Block>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Needs action" value={3} icon="flag" />
        <StatCard label="Running" value={2} icon="ai" />
        <StatCard label="Overdue" value={0} icon="warn" />
        <StatCard label="Selected" value={5} icon="checklist" active />
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--md-primary)", margin: "20px 0 12px" }}>
        Icon set
      </h2>
      <Card style={{ padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: 10,
          }}
        >
          {(Object.keys(ICONS) as IconName[]).map((n) => (
            <div
              key={n}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 6px",
                border: "1px solid var(--md-outline-v)",
                borderRadius: 10,
                fontSize: 10.5,
                color: "var(--md-on-surface-v)",
              }}
            >
              <Icon name={n} size={20} />
              {n}
            </div>
          ))}
        </div>
      </Card>
      </div>
    </>
  );
}
