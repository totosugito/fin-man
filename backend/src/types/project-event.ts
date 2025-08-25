import {Type} from "@sinclair/typebox";
import {EnumTransactionType} from "../db/schema/enum-projects.ts";

export const eventCost = Type.Optional(Type.Object({
  transactionType: Type.Optional(Type.Enum(EnumTransactionType)),
  budgetCurrency: Type.Optional(Type.String({maxLength: 3})),
  budget: Type.Optional(Type.String()),
  actualCurrency: Type.Optional(Type.String({maxLength: 3})),
  actual: Type.Optional(Type.String()),
  hasActual: Type.Optional(Type.Boolean()),
  actualCreatedAt: Type.Optional(Type.String({format: 'date'})),
}))
