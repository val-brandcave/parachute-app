import type { CreditRequest } from "@/types";

/** Reviewer credit requests (spec §5.9). Empty by default: the "Request waiting" record
 *  comes from the scenario builder (phase 5), so adding the collection needs no seed bump. */
export const seedCreditRequests: CreditRequest[] = [];
