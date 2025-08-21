import {ProjectMember} from "@/lib/project-utils";
import {EnumProjectEventType} from "backend/src/db/schema";
import {cn} from "@/lib/utils";

type CostItem = {
  budgetIncome: string;
  budgetIncomeCurrency?: string;
  budgetExpense: string;
  budgetExpenseCurrency?: string;
  realIncome: string;
  realIncomeCurrency?: string;
  realExpense: string;
  realExpenseCurrency?: string;
};

type ProjectSettings = {
  showEmptyCost: boolean
}

interface CostData {
  [currency: string]: CostItem;
}

const isEmptyCost = (value: string | undefined) => {
  return value === "0" || value === "" || value === "0.00";
}

type PropsCurrencyView = {
  currency: string,
  value: string | undefined,
  className?: string,
  isFolder?: boolean
}

const CurrencyView = ({currency, value, className, isFolder}: PropsCurrencyView) => {
  if (!value) {
    return <div/>
  }

  return (
    <div className={cn("text-right font-mono items-center", className)}>{isFolder ? String.fromCharCode(9679) : ""}{currency} {value}</div>
  )
}

const FolderCostView = ({currency, value, objKey, settings, className}:
                        { currency: string, value: CostData, objKey: keyof CostItem, settings?: ProjectSettings, className?: string }) => {
  const showEmpty = settings?.showEmptyCost || false;

  if (currency === "") {
    return (
      <div className={""}>
        {Object.entries(value).map(([key, val]) => {
          if (showEmpty) {
            return <div key={key}>{key} {val[objKey]}</div>
          } else {
            return (isEmptyCost(val[objKey] as string) ? null :
              <CurrencyView key={key} currency={key} value={val[objKey]} className={className} isFolder={true}/>)
          }
        })}
      </div>
    );
  }

  const display = value?.[currency]?.[objKey];
  if (showEmpty) {
    return (<CurrencyView currency={currency} value={display}/>)
  }

  return (isEmptyCost(display) ? null : <CurrencyView currency={currency} value={display}/>)
}

type Props = {
  spacingPixel?: number;
  maxDepth: number;
  currency: string;
  cell: ProjectMember;
  objKey: keyof CostItem;
  objKeyCurrency: keyof CostItem,
  settings?: ProjectSettings
}
export const CostView = ({spacingPixel = 10, maxDepth, currency, cell, objKey, objKeyCurrency, settings}: Props) => {
  const eventType = cell.eventType;
  const depth = cell.depth;
  const className = (objKey.includes("Expense")) ? "text-red-600" : "text-green-600";

  const showEmpty = settings?.showEmptyCost || false;
  if (!showEmpty && isEmptyCost(cell.cost[objKey])) {
    return <div/>
  }

  if (eventType === EnumProjectEventType.folder) {
    return (<div className={"text-right"} style={{paddingRight: `${(maxDepth - depth + 2) * spacingPixel}px`}}>
      <FolderCostView currency={currency} value={cell.cost} objKey={objKey} settings={settings} className={className}/>
    </div>)
  }

  // event file/transaction
  const display = cell.cost[objKey];
  if (showEmpty) {
    return (
      <CurrencyView currency={cell.cost[objKeyCurrency]} value={display}/>
    )
  }

  return (isEmptyCost(display) ? null : <CurrencyView currency={cell.cost[objKeyCurrency]} value={display} className={className}/>)
}