import { CurrencyList } from '@/constants/app-enum';
import { ObjToOptionList, ObjToOptionListValue } from '@/lib/my-utils';
import { EnumTransactionType } from 'backend/src/db/schema';
import { z } from 'zod';

const optionsCurrency = ObjToOptionListValue(CurrencyList);
export const formProjectEvent = {
  form: {
    name: {
      type: "text",
      name: "name",
      label: "Name",
      placeholder: "",
    },
    description: {
      type: "textarea",
      name: "description",
      label: "Description",
      placeholder: "",
    },
    transactionType: {
      type: "select",
      name: "transactionType",
      label: "Transaction Type",
      options: ObjToOptionList(EnumTransactionType).filter(option => option.value !== 'folder'),
    },
    budgetCurrency: {
      type: "select",
      name: "budgetCurrency",
      label: "Budget Currency",
      options: optionsCurrency,
    },
    budget: {
      type: "number",
      name: "budget",
      label: "Budget Amount",
      placeholder: "",
    },
    hasActual: {
      type: "checkbox",
      name: "hasActual",
      label: "Has Actual Data",
    },
    actualCreatedAt: {
      type: "date",
      name: "actualCreatedAt",
      label: "Actual Created At",
      placeholder: "",
    },
    actualCurrency: {
      type: "select",
      name: "actualCurrency",
      label: "Actual Currency",
      options: optionsCurrency,
    },
    actual: {
      type: "number",
      name: "actual",
      label: "Actual Amount",
      placeholder: "",
    },
  },
  schema: {
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    transactionType: z.enum(["income", "expense"]),
    budgetCurrency: z.string().min(1, "Budget Currency is required"),
    budget: z.number().min(0, "Budget amount must be positive"),
    actualCurrency: z.string().min(1, "Actual Currency is required"),
    actual: z.number().min(0, "Actual amount must be positive"),
    hasActual: z.boolean().optional(),
    actualCreatedAt: z.date().optional(),
  },
  defaultValue: {
    name: "",
    description: "",
    transactionType: "expense" as const,
    budgetCurrency: CurrencyList.IDR.value,
    budget: 0,
    actualCurrency: CurrencyList.IDR.value,
    actual: 0,
    hasActual: false,
    actualCreatedAt: new Date(),
  }
};