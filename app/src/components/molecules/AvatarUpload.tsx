"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Button } from "@/components/atoms";
import { AvatarCropper } from "./AvatarCropper";

/**
 * Avatar/logo picker with a crop step. Controlled: the cropped result lives in
 * `value` (owned by the parent, typically a shared store) so it reflects
 * everywhere. Picking an image opens the cropper; applying calls `onChange`.
 * `shape` controls the preview mask and the cropper viewport.
 */
export function AvatarUpload({
  value,
  onChange,
  initials,
  size = 64,
  shape = "square",
  hint = "PNG or SVG, up to 1 MB.",
  uploadLabel = "Upload logo",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  initials: string;
  size?: number;
  shape?: "square" | "circle";
  hint?: string;
  uploadLabel?: string;
}) {
  const [raw, setRaw] = useState<string | null>(null); // original, for re-cropping
  const [cropping, setCropping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const radius = shape === "circle" ? "50%" : 14;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRaw(URL.createObjectURL(file));
      setCropping(true);
    }
    e.target.value = ""; // allow re-picking the same file
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {value ? (
        <img
          src={value}
          alt="Preview"
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            objectFit: "cover",
            border: "1px solid var(--md-outline-v)",
          }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: radius,
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
            {value ? "Change" : uploadLabel}
          </Button>
          {value && raw && (
            <Button variant="ghost" size="sm" onClick={() => setCropping(true)}>
              Adjust
            </Button>
          )}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null);
                setRaw(null);
              }}
            >
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

      <AvatarCropper
        open={cropping}
        src={raw}
        shape={shape}
        onCancel={() => setCropping(false)}
        onApply={(dataUrl) => {
          onChange(dataUrl);
          setCropping(false);
        }}
      />
    </div>
  );
}
