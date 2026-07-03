"use client";

import { Icon, type IconName } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";

export interface TemplateOption {
  id: string;
  name: string;
}

/**
 * The review's per-type template control — one shared pattern for every org
 * template a run inherits (Technical → workbook layout, Administrative →
 * compliance checklist). Both are *templates* authored in the Templates hub with
 * an org **default**; this control shows that default, then lets the reviewer
 * override it **for this review only**.
 *
 * The tile is STABLE — it never dissolves into a form control. Selection happens
 * in a popover (the app's `ActionMenu`): a "Change" pill opens a checked option
 * list with `(default)` marked and a "Reset to default" footer (only when an
 * override is in force). Picking closes the menu and the tile updates in place —
 * `value === null` means *inherited*, a non-null id is an audited per-review
 * override, same rule as the Order flow.
 *
 * Bank policy is deliberately NOT modelled here: it's org policy (Settings →
 * Compliance), applied to every run and never pickable — so it doesn't belong in
 * a per-review setup control at all.
 */
export function InheritedTemplateField({
  icon,
  label,
  defaultId,
  defaultMeta,
  options,
  value,
  onChange,
}: {
  icon: IconName;
  /** Field name, e.g. "Workbook layout" / "Compliance checklist". */
  label: string;
  /** The org-default option id (what the review inherits when `value` is null). */
  defaultId: string | null;
  /** Full provenance line for the inherited default (e.g. "Org default · from the Commercial profile"). */
  defaultMeta: string;
  options: TemplateOption[];
  /** Override id, or null to inherit the org default. */
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const overridden = value !== null;
  const effectiveId = value ?? defaultId;
  const current = options.find((o) => o.id === effectiveId);
  const currentName = current?.name ?? "Org default";

  // Choosing the default from the menu is the same as inheriting — normalise to
  // null so "overridden" stays meaningful (drives the meta line + audit).
  const pick = (id: string) => onChange(id === defaultId ? null : id);

  const items: ActionItem[] = [
    ...options.map((o) => ({
      label: o.id === defaultId ? `${o.name}  (default)` : o.name,
      selected: o.id === effectiveId,
      onClick: () => pick(o.id),
    })),
    ...(overridden
      ? ([
          { divider: true },
          { label: "Reset to default", icon: "undo" as const, onClick: () => onChange(null) },
        ] satisfies ActionItem[])
      : []),
  ];

  return (
    <div className="field run-tpl">
      <span>{label}</span>
      <div className="run-cf-inh">
        <span className="run-cf-inh-ic">
          <Icon name={icon} size={18} />
        </span>
        <div className="run-cf-inh-body">
          <span className="run-cf-inh-val">{currentName}</span>
          <span className="run-cf-inh-meta">
            {overridden ? "For this review only" : defaultMeta}
          </span>
        </div>
        <ActionMenu
          items={items}
          menuClassName="run-tpl-menu"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              className={`run-tpl-change${open ? " is-open" : ""}`}
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Change ${label.toLowerCase()} for this review`}
            >
              Change
              <Icon name="chevron-down" size={13} />
            </button>
          )}
        />
      </div>
    </div>
  );
}
