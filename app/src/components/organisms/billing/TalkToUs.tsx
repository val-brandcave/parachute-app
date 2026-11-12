"use client";

import { useToast } from "@realwired/ui";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/store";

/** "Talk to us" (PC-9): records the sales request and says what happens next. A text link, not a route. */
export function TalkToUs({ children = "Talk to us", className }: { children?: React.ReactNode; className?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={cn("bl-textlink", className)}
      onClick={() => {
        void useOrgStore.getState().requestSales();
        toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out about invoicing.", tone: "success" });
      }}
    >
      {children}
    </button>
  );
}
