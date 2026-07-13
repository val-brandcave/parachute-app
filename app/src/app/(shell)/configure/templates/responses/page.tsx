import { redirect } from "next/navigation";

// The response library is split into two scoped routes
// (/configure/templates/responses/org and .../mine). Bare visits land on the
// Templates & layouts hub's Response library tab, where you pick a library.
export default function ResponsesIndex() {
  redirect("/configure/templates?tab=response");
}
