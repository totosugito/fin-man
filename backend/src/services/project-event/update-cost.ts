import { and, eq, sql } from "drizzle-orm";
import { projectsCost, projectEvents, EnumProjectEventType } from "../../db/schema/index.ts";
import { db } from "../../db/index.ts";
import * as schema from "../../db/schema/index.ts";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
interface CurrencySummary {
  [currency: string]: {
    budgetIncome: string;
    budgetExpense: string;
    realIncome: string;
    realExpense: string;
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

  const currencyGroups = await tx
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

  await tx
    .update(projectsCost)
    .set({
      eventSummary: eventSummary,
      updatedAt: sql`NOW()`,
    })
    .where(eq(projectsCost.projectEventId, parentId));
};
