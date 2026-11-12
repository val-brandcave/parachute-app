import { redirect } from "next/navigation";

/**
 * PROTOTYPE ONLY. The old demo launcher. Its two entry paths and the persona list now
 * live in the Prototype Index (spec §6, PC-13), so `/start` only redirects there. Old
 * shared links keep working.
 */
export default function StartPage() {
  redirect("/prototype");
}
