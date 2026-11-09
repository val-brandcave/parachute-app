import { redirect } from "next/navigation";

/** Retired step: setup is one card on /welcome, then the dashboard. Old links still work. */
export default function Page() {
  redirect("/dashboard");
}
