import { Collections } from "../collections";
import type { DataAdapter } from "../adapters/types";
import { seedUsers } from "./users.seed";
import { seedOrgs } from "./orgs.seed";
import { seedReviews } from "./reviews.seed";
import { seedFindings } from "./findings.seed";
import { seedYcDeliveries } from "./yc-deliveries.seed";
import { seedResponseTemplates } from "./response-templates.seed";
import { seedChecklistTemplates } from "./checklist-templates.seed";
import { seedWorkbookLayouts } from "./workbook-layouts.seed";
import { seedWorkbookExhibits } from "./workbook-exhibits.seed";

/** Populate initial data. Parents before children. */
export async function seedAll(adapter: DataAdapter): Promise<void> {
  await adapter.createMany(Collections.USERS, seedUsers);
  await adapter.createMany(Collections.ORGS, seedOrgs);
  await adapter.createMany(Collections.REVIEWS, seedReviews);
  await adapter.createMany(Collections.FINDINGS, seedFindings);
  await adapter.createMany(Collections.YC_DELIVERIES, seedYcDeliveries);
  await adapter.createMany(Collections.RESPONSE_TEMPLATES, seedResponseTemplates);
  await adapter.createMany(Collections.CHECKLIST_TEMPLATES, seedChecklistTemplates);
  await adapter.createMany(Collections.WORKBOOK_LAYOUTS, seedWorkbookLayouts);
  await adapter.createMany(Collections.WORKBOOK_EXHIBITS, seedWorkbookExhibits);
}
