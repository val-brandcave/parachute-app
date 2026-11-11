import { redirect } from "next/navigation";

/** `/configure/billing/credits` is the old address of How credits work: it lives on a tab now. */
export default function Page() {
  redirect("/configure/billing?tab=credits");
}
