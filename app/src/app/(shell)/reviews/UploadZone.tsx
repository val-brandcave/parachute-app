"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/atoms";
import { LockedAction } from "@/components/molecules";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { useIntakeStart } from "@/components/organisms/useIntakeStart";
import { cn } from "@/lib/utils";
import "./upload-zone.css";

/**
 * Reviews level-1 upload zone (PC-37, Start site 10). Drop or browse a PDF and Review setup
 * opens in the RunModal takeover, exactly like the Launchpad dropzone (shared
 * `useIntakeStart`). While the org waits for approval it is a LockedAction: aria-disabled,
 * an hourglass, never `disabled`, and a click opens the approval dialog.
 */
export function UploadZone() {
  const { locked, reason, explain } = useStartGate();
  const { start, parsing } = useIntakeStart();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const zone = (
    <button
      type="button"
      className={cn("rq-zone", dragging && "is-drag", parsing && "is-busy", locked && "is-locked")}
      onClick={() => !parsing && fileRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!parsing && !locked) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (locked) {
          explain(e.currentTarget);
          return;
        }
        start(e.dataTransfer.files?.[0] ?? null, "upload");
      }}
    >
      {parsing ? (
        <>
          <span className="ui-spinner" aria-hidden="true" />
          <span className="rq-zone-title">Reading the appraisal…</span>
        </>
      ) : (
        <>
          <span className="rq-zone-ic" aria-hidden="true">
            <Icon name="upload" size={22} />
          </span>
          <span className="rq-zone-title">Upload an appraisal PDF</span>
          <span className="rq-zone-sub">Up to 300 pages</span>
        </>
      )}
    </button>
  );

  return (
    <div className="rq-zone-wrap">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        aria-label="Upload an appraisal PDF"
        onChange={(e) => {
          start(e.target.files?.[0] ?? null, "upload");
          e.target.value = "";
        }}
      />
      {locked && reason ? (
        <LockedAction reason={reason} glyph="hourglass">
          {zone}
        </LockedAction>
      ) : (
        zone
      )}
    </div>
  );
}
