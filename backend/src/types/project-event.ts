import {Type} from "@sinclair/typebox";

export const eventCost = Type.Optional(Type.Object({
  budgetIncomeCurrency: Type.Optional(Type.String({maxLength: 3})),
  budgetIncome: Type.Optional(Type.String()),
  budgetExpenseCurrency: Type.Optional(Type.String({maxLength: 3})),
  budgetExpense: Type.Optional(Type.String()),
  realIncomeCreatedAt: Type.Optional(Type.String({format: 'date'})),
  realIncomeCurrency: Type.Optional(Type.String({maxLength: 3})),
  realIncome: Type.Optional(Type.String()),
  realExpenseCreatedAt: Type.Optional(Type.String({format: 'date'})),
  realExpenseCurrency: Type.Optional(Type.String({maxLength: 3})),
  realExpense: Type.Optional(Type.String()),
}))
