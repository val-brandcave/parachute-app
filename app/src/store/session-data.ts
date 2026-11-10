import { useOnboardingStore } from "./onboarding.store";
import { useOrgStore } from "./org.store";
import { useReviewsStore } from "./reviews.store";
import { useUsersStore } from "./users.store";
import { useWalletStore } from "./wallet.store";

/** (Re)load everything scoped to the session's current org. Called at boot and
 *  whenever the identity changes (persona switch, org reset). */
export async function loadSessionData(): Promise<void> {
  await useUsersStore.getState().fetchUsers(true);
  await Promise.all([
    useOrgStore.getState().fetchOrg(),
    useWalletStore.getState().fetchWallet(),
    useOnboardingStore.getState().fetchProgress(),
    useReviewsStore.getState().fetchReviews(),
  ]);
  useOrgStore
    .getState()
    .syncBankPolicy(useOnboardingStore.getState().progress?.completed.bank_policy !== undefined);
}
