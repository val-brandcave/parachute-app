"use client";

import { useToast } from "@realwired/ui";
import { Button, Illustration } from "@/components/atoms";
import { PendingTracker, type PendingTrackerStep } from "@/components/organisms/home";
import { formatShortDate } from "@/lib/utils";
import type { LockCtx } from "../LockDialog";

/* Eastern-time call labels (the scheduler books in ET; same formats as Get started). */
const TZ = "America/New_York";
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
const shortFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });

const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);

/**
 * Approval variants (spec §5.5, boards 12 and 13): the org is waiting on Realwired.
 * Hourglass, not lock: there is nothing to buy. Admin booked → tracker + Change call;
 * admin not booked → Book a call; reviewer → Ask <admin>.
 */
export function ApprovalBody({
  ctx,
  bookedAt,
  signedUpAt,
}: {
  ctx: LockCtx;
  /** When the setup call is booked (epoch ms); undefined = not booked. */
  bookedAt?: number;
  signedUpAt?: number;
}) {
  const toast = useToast();
  const booked = bookedAt !== undefined;
  const org = possessive(ctx.orgShort);

  if (!ctx.isAdmin) {
    return (
      <div className="lock-body">
        <Art />
        <h2 className="lock-title">Reviews open after {org} setup call</h2>
        <p className="lock-copy">
          {booked
            ? `${ctx.adminLead} booked ${org} setup call for ${dayFmt.format(new Date(bookedAt))}.`
            : `${ctx.adminLead} is booking ${org} setup call.`}{" "}
          Reviews open once Realwired confirms the account, usually the same day.
        </p>
        <div className="lock-acts">
          <Button
            variant="outline"
            iconLeft="send"
            onClick={() => {
              toast({ title: `Note sent to ${ctx.adminFirst}.`, tone: "success" });
              ctx.close();
            }}
          >
            Ask {ctx.adminFirst}
          </Button>
          <Button onClick={ctx.close}>Got it</Button>
        </div>
      </div>
    );
  }

  if (!booked) {
    return (
      <div className="lock-body">
        <Art />
        <h2 className="lock-title">Book {org} setup call to open credits</h2>
        <p className="lock-copy">
          Teams your size start with a short call. After it, Realwired sets up your billing and Start a review opens.
        </p>
        <div className="lock-acts">
          <Button variant="ghost" onClick={ctx.close}>
            Not now
          </Button>
          <Button iconLeft="calendar-event" onClick={() => ctx.leave("/welcome/call")}>
            Book a call
          </Button>
        </div>
      </div>
    );
  }

  const at = new Date(bookedAt);
  const steps: PendingTrackerStep[] = [
    { label: "Signed up", date: signedUpAt ? formatShortDate(signedUpAt) : undefined, state: "done" },
    { label: "Call booked", date: shortFmt.format(at), state: "current" },
    { label: "Confirmed", date: "Usually same day", state: "todo" },
  ];
  return (
    <div className="lock-body">
      <Art />
      <h2 className="lock-title">Credits open when {ctx.orgShort} is confirmed</h2>
      <p className="lock-copy">
        Teams your size start with a short call. You booked one for {dayFmt.format(at)} at {timeFmt.format(at)} ET. After
        it, Realwired sets up your billing and Start a review opens.
      </p>
      <div className="lock-track">
        <PendingTracker steps={steps} compact />
      </div>
      <div className="lock-acts">
        <Button variant="outline" onClick={() => ctx.leave("/welcome/call")}>
          Change call
        </Button>
        <Button onClick={ctx.close}>Got it</Button>
      </div>
    </div>
  );
}

function Art() {
  return (
    <span className="lock-art" data-spot="09b-approval-pending">
      <Illustration name="09b-approval-pending" size={100} />
    </span>
  );
}
