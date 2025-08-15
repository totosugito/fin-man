import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  numeric,
  char,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {users} from "./auth.ts";
import {ltree} from "./custom/ltree.ts";
import {
  EnumProjectEventType,
  EnumProjectStatus,
  EnumProjectType,
  PgEnumProjectEventType,
  PgEnumProjectStatus,
  PgEnumProjectType
} from "./enum-projects.ts";


// ===== PROJECTS TABLE =====
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    extra: jsonb("extra").default(sql`'{}'::jsonb`),
    type: PgEnumProjectType("type").notNull().default(EnumProjectType.project),
    status: PgEnumProjectStatus("status").notNull().default(EnumProjectStatus.draft),
    tags: text("tags").array().notNull().default(sql`'{}'`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_projects_name").on(table.name),
    index("idx_projects_user_name").on(table.userId, table.name),
  ]
);

// ===== PROJECT EVENTS TABLE =====
export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .$type<string>()
      .references((): AnyPgColumn => projectEvents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    extra: jsonb("extra").default(sql`'{}'::jsonb`),
    eventType: PgEnumProjectEventType("event_type").notNull().default(EnumProjectEventType.folder),
    sortOrder: integer("sort_order").default(0),

    // Now explicitly an ltree type in DB
    path: ltree("path").notNull(),
    depth: integer("depth").generatedAlwaysAs(sql`nlevel(path) - 1`),

    note: text("note").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_project_events_parent_id").on(table.parentId),
    index("idx_project_events_parent_sort").on(table.parentId, table.sortOrder),
    index("idx_project_events_name").on(table.name),
    // Path GIST index is added manually in raw migration
  ]
);

// ===== PROJECTS COST TABLE =====
export const projectsCost = pgTable(
  "projects_cost",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectEventId: uuid("project_event_id")
      .notNull()
      .references(() => projectEvents.id, { onDelete: "cascade" }),

    budgetIncomeCurrency: char("budget_income_currency", { length: 3 }).default("IDR"),
    budgetIncome: numeric("budget_income", { precision: 18, scale: 2 }).default("0"),

    budgetExpenseCurrency: char("budget_expense_currency", { length: 3 }).default("IDR"),
    budgetExpense: numeric("budget_expense", { precision: 18, scale: 2 }).default("0"),

    realIncomeCurrency: char("real_income_currency", { length: 3 }).default("IDR"),
    realIncome: numeric("real_income", { precision: 18, scale: 2 }).default("0"),
    realIncomeCreatedAt: timestamp("real_income_created_at", {
      withTimezone: true,
    }),

    realExpenseCurrency: char("real_expense_currency", { length: 3 }).default("IDR"),
    realExpense: numeric("real_expense", { precision: 18, scale: 2 }).default("0"),
    realExpenseCreatedAt: timestamp("real_expense_created_at", {
      withTimezone: true,
    }),
    eventSummary: jsonb("event_summary").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_projects_cost_event_id").on(table.projectEventId),
  ]
);
