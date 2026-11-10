"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms";

/** A settings group: title and description, then label/description rows. */
export function SettingsSection({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card bs-section">
      <header className="bs-head">
        <div>
          <h2 className="bl-h">{title}</h2>
          {desc && <p className="bl-sub">{desc}</p>}
        </div>
        {action}
      </header>
      <div className="bs-rows">{children}</div>
    </section>
  );
}

/** Label and description on the left, the control on the right. */
export function SettingsRow({
  label,
  desc,
  htmlFor,
  children,
}: {
  label: string;
  desc?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bs-row">
      <div className="bs-meta">
        <label className="bs-label" htmlFor={htmlFor}>
          {label}
        </label>
        {desc && <p className="bs-desc">{desc}</p>}
      </div>
      <div className="bs-ctl">{children}</div>
    </div>
  );
}

/** Text or number field that saves when you leave it (or press Enter) and flashes "Saved". */
export function SavedField({
  id,
  label,
  value,
  onCommit,
  multiline,
  prefix,
  placeholder,
  width,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onCommit: (next: string) => void | Promise<void>;
  multiline?: boolean;
  prefix?: string;
  placeholder?: string;
  width?: "sm" | "md";
  inputMode?: "numeric" | "text" | "email";
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const [saved, setSaved] = useState(false);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  const commit = async () => {
    if (draft === value) return;
    await onCommit(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const common = {
    id,
    "aria-label": label,
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: () => void commit(),
  };
  return (
    <div className={`bs-field${width ? ` bs-field--${width}` : ""}`}>
      <div className="field">
        {multiline ? (
          <textarea rows={3} {...common} />
        ) : (
          <div className={prefix ? "bs-prefixed" : undefined}>
            {prefix && <span className="bs-prefix">{prefix}</span>}
            <input
              {...common}
              inputMode={inputMode}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
          </div>
        )}
      </div>
      <span className={`bs-saved${saved ? " is-on" : ""}`} aria-live="polite">
        {saved && (
          <>
            <Icon name="check" size={13} /> Saved
          </>
        )}
      </span>
    </div>
  );
}

/** A compact select inside a `.field`. */
export function SelectField<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
  width,
  disabled,
}: {
  id?: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  width?: "sm" | "md" | "lg";
  disabled?: boolean;
}) {
  return (
    <div className={`field bs-select${width ? ` bs-select--${width}` : ""}`}>
      <select
        id={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange((typeof value === "number" ? Number(e.target.value) : e.target.value) as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
