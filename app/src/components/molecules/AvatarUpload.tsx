"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Button } from "@/components/atoms";

/**
 * Avatar/logo with live client-side preview. Picking an image previews it via
 * an object URL (not persisted — prototype). Falls back to initials.
 */
export function AvatarUpload({
  initials,
  size = 64,
  hint = "PNG or SVG, up to 1 MB.",
}: {
  initials: string;
  size?: number;
  hint?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUrl(URL.createObjectURL(file));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {url ? (
        <img
          src={url}
          alt="Logo preview"
          style={{
            width: size,
            height: size,
            borderRadius: 14,
            objectFit: "cover",
            border: "1px solid var(--md-outline-v)",
          }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: "var(--grad-primary)",
            color: "#fff",
            fontWeight: 700,
            fontSize: Math.round(size * 0.34),
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </span>
      )}

      <div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" iconLeft="download" onClick={() => inputRef.current?.click()}>
            {url ? "Change" : "Upload logo"}
          </Button>
          {url && (
            <Button variant="ghost" size="sm" onClick={() => setUrl(null)}>
              Remove
            </Button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--md-on-surface-v)", marginTop: 6 }}>
          {hint}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        style={{ display: "none" }}
      />
    </div>
  );
}
