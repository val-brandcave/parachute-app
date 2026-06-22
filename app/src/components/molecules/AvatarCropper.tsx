"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useRef, useState } from "react";
import { Modal, Button, Icon } from "@/components/atoms";

const FRAME = 288; // on-screen viewport size in px

type Pt = { x: number; y: number };

/**
 * Crop / reposition a freshly-picked image inside a fixed viewport. The image
 * always *covers* the frame (no empty edges); the user pans by dragging and
 * scales with the zoom slider. "Apply" rasterises the visible region to a
 * square `outputSize` data URL — clipped to a circle when `shape="circle"`.
 *
 * No external cropping library: a single <canvas> drawImage does the export.
 */
export function AvatarCropper({
  open,
  src,
  shape = "square",
  outputSize = 320,
  onCancel,
  onApply,
}: {
  open: boolean;
  src: string | null;
  shape?: "square" | "circle";
  outputSize?: number;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState<Pt>({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // Base "cover" scale so the smaller image dimension fills the frame at zoom 1.
  const base = nat ? Math.max(FRAME / nat.w, FRAME / nat.h) : 1;
  const scale = base * zoom;
  const dw = nat ? nat.w * scale : FRAME;
  const dh = nat ? nat.h * scale : FRAME;

  const clamp = useCallback(
    (p: Pt, w: number, h: number): Pt => ({
      x: Math.min(0, Math.max(FRAME - w, p.x)),
      y: Math.min(0, Math.max(FRAME - h, p.y)),
    }),
    [],
  );

  // Re-centre when a new image loads.
  const onLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    setNat({ w, h });
    const b = Math.max(FRAME / w, FRAME / h);
    setOff({ x: (FRAME - w * b) / 2, y: (FRAME - h * b) / 2 });
    setZoom(1);
  };

  // Keep the frame centre fixed while zooming, then re-clamp to the new size.
  const onZoom = (z: number) => {
    if (!nat) return setZoom(z);
    const sOld = base * zoom;
    const sNew = base * z;
    const cx = (FRAME / 2 - off.x) / sOld;
    const cy = (FRAME / 2 - off.y) / sOld;
    const next = clamp(
      { x: FRAME / 2 - cx * sNew, y: FRAME / 2 - cy * sNew },
      nat.w * sNew,
      nat.h * sNew,
    );
    setZoom(z);
    setOff(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = drag.current;
    setOff(
      clamp({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) }, dw, dh),
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be gone */
    }
  };

  const apply = () => {
    const el = imgRef.current;
    if (!el || !nat) return;
    const out = outputSize;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    // Source rect (in natural-image px) currently framed by the viewport.
    const sx = -off.x / scale;
    const sy = -off.y / scale;
    const sSize = FRAME / scale;
    ctx.drawImage(el, sx, sy, sSize, sSize, 0, 0, out, out);
    onApply(canvas.toDataURL("image/png"));
  };

  // No reset effect needed: the Modal unmounts its body on close, so the <img>
  // remounts on every open and `onLoad` re-centres the crop from scratch.

  return (
    <Modal open={open} onClose={onCancel} title="Adjust image" size="sm">
      <div className="cropper">
        <div
          className={`cropper-frame${shape === "circle" ? " is-circle" : ""}`}
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: off.x,
                top: off.y,
                width: dw,
                height: dh,
                maxWidth: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
          <div className="cropper-mask" aria-hidden />
        </div>

        <div className="cropper-zoom">
          <Icon name="search" size={15} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            aria-label="Zoom"
          />
          <span className="cropper-zoom-val">{Math.round(zoom * 100)}%</span>
        </div>

        <p className="cropper-hint">Drag to reposition · slide to zoom.</p>
      </div>

      <div className="cropper-actions">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={apply} disabled={!nat}>
          Apply
        </Button>
      </div>
    </Modal>
  );
}
