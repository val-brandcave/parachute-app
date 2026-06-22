import { redirect } from "next/navigation";

// The response library is now split into two scoped routes
// (/templates/responses/org and /templates/responses/mine). Bare visits land
// on the Templates hub's Response Templates tab, where you pick a library.
export default function ResponsesIndex() {
  redirect("/templates?tab=response");
}
