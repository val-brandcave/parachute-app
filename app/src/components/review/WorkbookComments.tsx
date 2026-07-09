"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/atoms";
import type { WorkbookEditingActions } from "./WorkbookInline";

/**
 * Comments anywhere (Phase 2b, F-142 generalized) — a margin pin anchored to a
 * block, opening a thread popover. The pin hangs in the document's right gutter
 * (Google-Docs mental model); it's faint until hovered, solid once the block
 * carries comments. The thread is a portaled, fixed-positioned popover (the
 * house floating-layer RULE — never absolute inside the paginated, overflow-
 * clipped `.wb-doc`).
 */

const fmtTime = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function CommentAnchor({
  anchorId,
  anchorLabel,
  edit,
  open,
  onOpenChange,
}: {
  anchorId: string;
  anchorLabel: string;
  edit: WorkbookEditingActions;
  /** Controlled open state — the section toolbar's Comment button drives it, so
   *  adding the first comment doesn't need an always-hovering empty pin. */
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const thread = edit.comments.filter((c) => c.anchorId === anchorId);
  const count = thread.length;
  const pinRef = useRef<HTMLButtonElement>(null);

  // The gutter pin is a PERSISTENT marker shown only when the section carries
  // comments (or while the thread is open) — never an empty pin competing with
  // the section toolbar on hover. Empty + closed → nothing in the gutter.
  if (count === 0 && !open) return null;

  return (
    <>
      <button
        ref={pinRef}
        type="button"
        className={`wb-cnote-pin${count ? " has-notes" : ""}${open ? " is-open" : ""}`}
        onClick={() => onOpenChange(!open)}
        aria-label={count ? `${count} comment${count === 1 ? "" : "s"}` : "Add a comment"}
        title={count ? `${count} comment${count === 1 ? "" : "s"}` : "Add a comment"}
      >
        <Icon name="comment" size={13} />
        {count > 0 && <span className="wb-cnote-count">{count}</span>}
      </button>
      {open && (
        <CommentThread
          anchorRef={pinRef}
          anchorLabel={anchorLabel}
          comments={thread}
          onAdd={(body) => edit.onAddComment(anchorId, anchorLabel, body)}
          onDelete={edit.onDeleteComment}
          onClose={() => onOpenChange(false)}
        />
      )}
    </>
  );
}

function CommentThread({
  anchorRef,
  anchorLabel,
  comments,
  onAdd,
  onDelete,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  anchorLabel: string;
  comments: { id: string; body: string; at: number; by: string }[];
  onAdd: (body: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Fixed-position from the pin's rect (runs before paint → no flash). Opens
  // down-left so the card sits under the gutter pin; flips up near the bottom
  // and clamps to the viewport.
  useLayoutEffect(() => {
    const anchorEl = anchorRef.current;
    if (!anchorEl) return;
    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const w = 288;
      const h = cardRef.current?.offsetHeight ?? 220;
      let top = r.bottom + 8;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
      let left = r.right - w;
      left = Math.min(Math.max(8, left), window.innerWidth - w - 8);
      setPos({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef, comments.length]);

  // Dismiss on outside-click (excluding the portaled card + the trigger) + Esc.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (cardRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchorRef, onClose]);

  if (typeof document === "undefined") return null;

  const post = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  };

  return createPortal(
    <div
      ref={cardRef}
      className="wb-cnote-card"
      role="dialog"
      aria-label={`Comments on ${anchorLabel}`}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      <header className="wb-cnote-head">
        <span className="wb-cnote-head-t">
          <Icon name="comment" size={13} /> Comments
        </span>
        <span className="wb-cnote-head-anchor">{anchorLabel}</span>
      </header>

      {comments.length > 0 && (
        <ol className="wb-cnote-list">
          {comments.map((c) => (
            <li className="wb-cnote-item" key={c.id}>
              <div className="wb-cnote-item-meta">
                <span className="wb-cnote-item-by">{c.by === "you" ? "You" : c.by}</span>
                <span className="wb-cnote-item-time">{fmtTime(c.at)}</span>
                <button
                  className="wb-cnote-del"
                  onClick={() => onDelete(c.id)}
                  aria-label="Delete comment"
                  title="Delete comment"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
              <p className="wb-cnote-body">{c.body}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="wb-cnote-composer">
        <textarea
          className="ui-textarea wb-cnote-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              post();
            }
          }}
          placeholder={comments.length ? "Reply…" : "Add a comment…"}
          rows={2}
          aria-label="Write a comment"
          autoFocus
        />
        <div className="wb-cnote-actions">
          <span className="wb-cnote-hint">⌘↵ to post</span>
          <button className="wb-cnote-post" onClick={post} disabled={!draft.trim()}>
            Comment
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
