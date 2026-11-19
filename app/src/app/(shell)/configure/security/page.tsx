import { redirect } from "next/navigation";

/** The Security pack became the Trust Center (spec §5.10). Old links keep working. */
export default function SecurityRedirect() {
  redirect("/trust");
}
