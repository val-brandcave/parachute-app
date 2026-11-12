"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { dist, dur, ease, motionModeNow, stagger } from "@/lib/motion";

/**
 * Six single-digit boxes for a one-time code. Typing advances, Backspace steps
 * back, arrows move, and pasting a code fills every box (in sequence, 30 ms
 * apart, when motion is full). `shakeKey` shakes the row ±6 px (motion-spec §4);
 * `focusKey` moves focus to the first empty box. Bump either to trigger it.
 */
export function CodeBoxes({
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus,
  label = "Verification code",
  shakeKey = 0,
  focusKey = 0,
  describedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  label?: string;
  shakeKey?: number;
  focusKey?: number;
  /** id of the error text; set on every box while `invalid`. */
  describedBy?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focusAt = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!shakeKey || motionModeNow() !== "full" || !rowRef.current) return;
    const s = dist.shake;
    animate(rowRef.current, { x: [0, -s, s, -s, s, 0] }, { duration: dur.shake, ease: ease.standard });
  }, [shakeKey]);

  useEffect(() => {
    if (!focusKey) return;
    refs.current[Math.min(valueRef.current.length, length - 1)]?.focus();
  }, [focusKey, length]);

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div className="kc-code" ref={rowRef} role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? describedBy : undefined}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            if (!ch) return;
            // Keep the value contiguous: a digit typed past the end lands at the end.
            const at = Math.min(i, value.length);
            setAt(at, ch);
            focusAt(at + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (d) setAt(i, "");
              else if (i > 0) {
                setAt(i - 1, "");
                focusAt(i - 1);
              }
              if (d) return;
            } else if (e.key === "ArrowLeft") focusAt(i - 1);
            else if (e.key === "ArrowRight") focusAt(i + 1);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!text) return;
            e.preventDefault();
            onChange(text);
            if (motionModeNow() === "full") {
              text.split("").forEach((_, k) => {
                const el = refs.current[k];
                if (el) animate(el, { opacity: [0, 1], y: [dist.lift / 2, 0] }, { duration: dur.quick, delay: k * stagger.codeFill, ease: ease.enter });
              });
            }
            focusAt(text.length >= length ? length - 1 : text.length);
          }}
        />
      ))}
    </div>
  );
}
