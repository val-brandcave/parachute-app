"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ConfirmDialog, Icon } from "@/components/atoms";
import { ResponseList } from "@/components/templates/ResponseList";
import { ResponseEditor } from "@/components/templates/ResponseEditor";
import { useResponseLibrary } from "../../hooks/useResponseLibrary";
import type { TemplateScope } from "@/types";

/**
 * Warn before leaving the page with unsaved work. App Router has no global
 * navigation-intercept API, so we (1) catch in-app link clicks in the capture
 * phase and route them through `onLeave`, and (2) fall back to the browser's
 * native prompt for hard reloads / tab close. Browser Back also hits the native
 * prompt. Only active while `when` is true.
 */
function useNavigationGuard(when: boolean, onLeave: (href: string) => void) {
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement).closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || href.startsWith("#") || anchor.target === "_blank") return;
      if (/^https?:\/\//.test(href)) return; // external — let the browser/beforeunload handle it
      e.preventDefault();
      e.stopPropagation();
      onLeave(href);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when, onLeave]);
}

export default function ResponseLibraryPage() {
  const params = useParams<{ scope: string }>();
  const router = useRouter();
  const scope: TemplateScope = params.scope === "mine" ? "mine" : "org";
  const isOrg = scope === "org";

  const {
    groups,
    selectedId,
    draft,
    isNew,
    dirty,
    canSave,
    savedTick,
    startNew,
    select,
    update,
    save,
    remove,
  } = useResponseLibrary(scope);

  const groupOptions = groups.map((g) => g.group);

  // Unsaved-changes guard. `pending` holds the action to run if the user
  // confirms "Discard"; until then it's deferred and the modal is shown.
  const [pending, setPending] = useState<{ run: () => void } | null>(null);
  const guard = useCallback(
    (action: () => void) => {
      if (dirty) setPending({ run: action });
      else action();
    },
    [dirty],
  );
  const onLeave = useCallback((href: string) => guard(() => router.push(href)), [guard, router]);
  useNavigationGuard(dirty, onLeave);

  return (
    <div className="resp-page">
      <aside className="resp-rail">
        <div className="resp-rail-head">
          <span className="resp-rail-title">{isOrg ? "Org library" : "Personal library"}</span>
          <Button iconLeft="add" size="sm" onClick={() => guard(startNew)}>
            New
          </Button>
        </div>
        <div className="resp-rail-list scroll">
          <ResponseList
            groups={groups}
            selectedId={selectedId}
            onSelect={(id) => guard(() => select(id))}
            savedTick={savedTick}
          />
        </div>
      </aside>

      <section className="resp-detail">
        {draft ? (
          <ResponseEditor
            draft={draft}
            isNew={isNew}
            dirty={dirty}
            canSave={canSave}
            groupOptions={groupOptions}
            onChange={update}
            onSave={save}
            onDelete={remove}
          />
        ) : (
          <div className="resp-empty">
            <Icon name="quote" size={30} />
            <p>Select a template to edit, or create a new one.</p>
            <Button variant="outline" size="sm" iconLeft="add" onClick={() => guard(startNew)}>
              New template
            </Button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!pending}
        danger
        title="Discard unsaved changes?"
        message="You have unsaved changes to this template. Leaving now will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          const action = pending;
          setPending(null);
          action?.run();
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
