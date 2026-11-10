import { redirect } from "next/navigation";

/** Retired step: setup is one card on /welcome, then Get started (it forwards to the dashboard when setup is done). Old links still work. */
export default function Page() {
  redirect("/get-started");
}
