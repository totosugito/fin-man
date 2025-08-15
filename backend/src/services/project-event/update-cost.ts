import { and, eq, sql } from "drizzle-orm";
import {projectsCost, projectEvents, EnumProjectEventType} from "../../db/schema/index.ts";
import { db } from "../../db/index.ts";

interface CurrencySummary {
  [currency: string]: {
    budgetIncome: string;
    budgetExpense: string;
    realIncome: string;
    realExpense: string;
  };
}

export const computeParentCost = async (parentId: string) => {
  // Then recursively update all ancestor folders
  let currentParentId = parentId;
  while (currentParentId) {
    // Get the parent event to find its parentId
    const parentEvent = await db.query.projectEvents.findFirst({
      where: eq(projectEvents.id, currentParentId),
      columns: {
        id: true,
        parentId: true
      }
    });

    if (!parentEvent) break;

    // Update the cost for this parent
    await computeEventCost(parentEvent.id);

    // Move up to the next parent
    currentParentId = parentEvent.parentId || '';

    // Stop if we've reached the root (no more parents)
    if (!currentParentId) break;
  }
}

export const computeEventCost = async (parentId: string) => {
  // Get the parent event to get its path
  const parentEvent = await db.query.projectEvents.findFirst({
    where: eq(projectEvents.id, parentId),
    columns: {
      path: true,
      eventType: true
    }
  });

  if (!parentEvent) return;

  if (parentEvent.eventType === EnumProjectEventType.file) {
    return;
  }

  // For folders, get all file events under this folder's path
  const isFolder = parentEvent.eventType === EnumProjectEventType.folder;

  // Get all file events under this parent, including nested ones, grouped by currency
  const currencyGroups = await db
    .select({
      currency: projectsCost.budgetIncomeCurrency,
      budgetIncome: sql<number>`COALESCE(SUM(CAST(${projectsCost.budgetIncome} AS NUMERIC)), 0)`,
      budgetExpense: sql<number>`COALESCE(SUM(CAST(${projectsCost.budgetExpense} AS NUMERIC)), 0)`,
      realIncome: sql<number>`COALESCE(SUM(CAST(${projectsCost.realIncome} AS NUMERIC)), 0)`,
      realExpense: sql<number>`COALESCE(SUM(CAST(${projectsCost.realExpense} AS NUMERIC)), 0)`,
    })
    .from(projectsCost)
    .innerJoin(projectEvents, eq(projectEvents.id, projectsCost.projectEventId))
    .where(
      and(
        isFolder
          ? sql`${projectEvents.path} <@ ${parentEvent.path} AND ${projectEvents.path} != ${parentEvent.path}`
          : eq(projectEvents.parentId, parentId),
        eq(projectEvents.eventType, EnumProjectEventType.file),
        sql`${projectsCost.budgetIncomeCurrency} IS NOT NULL`,
        sql`${projectsCost.budgetIncomeCurrency} != ''`
      )
    )
    .groupBy(projectsCost.budgetIncomeCurrency);

  // Convert to the required format for eventSummary
  const eventSummary: CurrencySummary = {};

  for (const group of currencyGroups) {
    if (group.currency) {
      eventSummary[group.currency] = {
        budgetIncome: group.budgetIncome.toString(),
        budgetExpense: group.budgetExpense.toString(),
        realIncome: group.realIncome.toString(),
        realExpense: group.realExpense.toString(),
      };
    }
  }

  // Update the parent's projectsCost with the summary
  await db
    .update(projectsCost)
    .set({
      eventSummary: eventSummary,
      updatedAt: sql`NOW()`,
    })
    .where(eq(projectsCost.projectEventId, parentId));
}
