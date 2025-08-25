import { and, eq, sql } from "drizzle-orm";
import { projectsCost, projectEvents, EnumProjectEventType, EnumTransactionType } from "../../db/schema/index.ts";
import { db } from "../../db/index.ts";
import * as schema from "../../db/schema/index.ts";
import {NodePgDatabase} from "drizzle-orm/node-postgres";

interface TransactionTypeSummary {
  [currency: string]: {
    [transactionType: string]: {
      budget: string;
      actual: string;
    };
  };
}

type DbOrTx = NodePgDatabase<typeof schema>;

export const computeParentCost = async (
  parentId: string,
  tx: DbOrTx = db
) => {
  let currentParentId = parentId;

  while (currentParentId) {
    // Get the parent event
    const parentEvent = await tx.query.projectEvents.findFirst({
      where: eq(projectEvents.id, currentParentId),
      columns: {
        id: true,
        parentId: true,
      },
    });

    if (!parentEvent) break;

    // Update cost inside the same tx
    await computeEventCost(parentEvent.id, tx);

    currentParentId = parentEvent.parentId || "";

    if (!currentParentId) break;
  }
};

export const computeEventCost = async (
  parentId: string,
  tx: DbOrTx = db
) => {
  const parentEvent = await tx.query.projectEvents.findFirst({
    where: eq(projectEvents.id, parentId),
    columns: {
      path: true,
      eventType: true,
    },
  });

  if (!parentEvent) return;

  if (parentEvent.eventType === EnumProjectEventType.file) {
    return;
  }

  const isFolder = parentEvent.eventType === EnumProjectEventType.folder;

  // Get all cost entries grouped by currency and transaction type
  const costGroups = await tx
    .select({
      currency: projectsCost.budgetCurrency,
      transactionType: projectsCost.transactionType,
      budget: sql<number>`COALESCE(SUM(CAST(${projectsCost.budget} AS NUMERIC)), 0)`,
      actual: sql<number>`COALESCE(SUM(CASE WHEN ${projectsCost.hasActual} = true THEN CAST(${projectsCost.actual} AS NUMERIC) ELSE 0 END), 0)`,
    })
    .from(projectsCost)
    .innerJoin(projectEvents, eq(projectEvents.id, projectsCost.projectEventId))
    .where(
      and(
        isFolder
          ? sql`${projectEvents.path} <@ ${parentEvent.path} AND ${projectEvents.path} != ${parentEvent.path}`
          : eq(projectEvents.parentId, parentId),
        eq(projectEvents.eventType, EnumProjectEventType.file),
        sql`${projectsCost.budgetCurrency} IS NOT NULL`,
        sql`${projectsCost.budgetCurrency} != ''`
      )
    )
    .groupBy(projectsCost.budgetCurrency, projectsCost.transactionType);

  const eventSummary: TransactionTypeSummary = {};

  // Process cost groups
  for (const group of costGroups) {
    if (group.currency && group.transactionType) {
      if (!eventSummary[group.currency]) {
        eventSummary[group.currency] = {};
      }
      
      eventSummary[group.currency][group.transactionType] = {
        budget: group.budget.toString(),
        actual: group.actual.toString()
      };
    }
  }

  // Ensure both income and expense are present for each currency
  // Get all unique currencies from the cost groups
  const currencies = [...new Set(costGroups.map(g => g.currency).filter((c): c is string => Boolean(c)))];
  
  for (const currency of currencies) {
    if (!eventSummary[currency]) {
      eventSummary[currency] = {};
    }
    
    // Ensure both income and expense exist for this currency
    if (!eventSummary[currency][EnumTransactionType.income]) {
      eventSummary[currency][EnumTransactionType.income] = {
        budget: "0",
        actual: "0"
      };
    }
    
    if (!eventSummary[currency][EnumTransactionType.expense]) {
      eventSummary[currency][EnumTransactionType.expense] = {
        budget: "0",
        actual: "0"
      };
    }
  }

  await tx
    .update(projectsCost)
    .set({
      eventSummary: eventSummary,
      updatedAt: sql`NOW()`,
    })
    .where(eq(projectsCost.projectEventId, parentId));
};
