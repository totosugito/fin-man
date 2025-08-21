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

  // Get all budget entries grouped by their respective currencies
  const budgetGroups = await tx
    .select({
      currency: projectsCost.budgetIncomeCurrency,
      budgetIncome: sql<number>`COALESCE(SUM(CAST(${projectsCost.budgetIncome} AS NUMERIC)), 0)`,
      budgetExpense: sql<number>`COALESCE(SUM(CAST(${projectsCost.budgetExpense} AS NUMERIC)), 0)`,
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

  // Get all real income entries grouped by their currencies
  const realIncomeGroups = await tx
    .select({
      currency: projectsCost.realIncomeCurrency,
      amount: sql<number>`COALESCE(SUM(CAST(${projectsCost.realIncome} AS NUMERIC)), 0)`,
    })
    .from(projectsCost)
    .innerJoin(projectEvents, eq(projectEvents.id, projectsCost.projectEventId))
    .where(
      and(
        isFolder
          ? sql`${projectEvents.path} <@ ${parentEvent.path} AND ${projectEvents.path} != ${parentEvent.path}`
          : eq(projectEvents.parentId, parentId),
        eq(projectEvents.eventType, EnumProjectEventType.file),
        sql`${projectsCost.realIncomeCurrency} IS NOT NULL`,
        sql`${projectsCost.realIncomeCurrency} != ''`
      )
    )
    .groupBy(projectsCost.realIncomeCurrency);

  // Get all real expense entries grouped by their currencies
  const realExpenseGroups = await tx
    .select({
      currency: projectsCost.realExpenseCurrency,
      amount: sql<number>`COALESCE(SUM(CAST(${projectsCost.realExpense} AS NUMERIC)), 0)`,
    })
    .from(projectsCost)
    .innerJoin(projectEvents, eq(projectEvents.id, projectsCost.projectEventId))
    .where(
      and(
        isFolder
          ? sql`${projectEvents.path} <@ ${parentEvent.path} AND ${projectEvents.path} != ${parentEvent.path}`
          : eq(projectEvents.parentId, parentId),
        eq(projectEvents.eventType, EnumProjectEventType.file),
        sql`${projectsCost.realExpenseCurrency} IS NOT NULL`,
        sql`${projectsCost.realExpenseCurrency} != ''`
      )
    )
    .groupBy(projectsCost.realExpenseCurrency);

  const eventSummary: CurrencySummary = {};

  // Initialize all currencies with empty strings
  const allCurrencies = new Set<string>();
  
  // Process budget groups
  for (const group of budgetGroups) {
    if (group.currency) {
      allCurrencies.add(group.currency);
      eventSummary[group.currency] = eventSummary[group.currency] || {
        budgetIncome: '',
        budgetExpense: '',
        realIncome: '',
        realExpense: ''
      };
      eventSummary[group.currency].budgetIncome = group.budgetIncome.toString();
      eventSummary[group.currency].budgetExpense = group.budgetExpense.toString();
    }
  }

  // Process real income groups
  for (const group of realIncomeGroups) {
    if (group.currency) {
      allCurrencies.add(group.currency);
      eventSummary[group.currency] = eventSummary[group.currency] || {
        budgetIncome: '',
        budgetExpense: '',
        realIncome: '',
        realExpense: ''
      };
      eventSummary[group.currency].realIncome = group.amount.toString();
    }
  }

  // Process real expense groups
  for (const group of realExpenseGroups) {
    if (group.currency) {
      allCurrencies.add(group.currency);
      eventSummary[group.currency] = eventSummary[group.currency] || {
        budgetIncome: '',
        budgetExpense: '',
        realIncome: '',
        realExpense: ''
      };
      eventSummary[group.currency].realExpense = group.amount.toString();
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
