import {ProjectMember} from "@/lib/project-utils";
import {EnumProjectEventType} from "backend/src/db/schema";

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

const CurrencyView = ({currency, value}: { currency: string, value: string | undefined }) => {
  if (!value) {
    return <div/>
  }

  return (
    <div className={"text-right font-mono"}>{currency} {value}</div>
  )
}

const FolderCostView = ({currency, value, objKey, settings}:
                        { currency: string, value: CostData, objKey: keyof CostItem, settings?: ProjectSettings }) => {
  const showEmpty = settings?.showEmptyCost || false;

  if (currency === "") {
    return (
      <div className={""}>
        {Object.entries(value).map(([key, val]) => {
          if (showEmpty) {
            return <div key={key}>{key} {val[objKey]}</div>
          } else {
            return (isEmptyCost(val[objKey] as string) ? null : <CurrencyView key={key} currency={key} value={val[objKey]}/>)
          }
        })}
      </div>
    );
  }

  const display = value?.[currency]?.[objKey];
  if(showEmpty) {
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

  const showEmpty = settings?.showEmptyCost || false;
  if (!showEmpty && isEmptyCost(cell.cost[objKey])) {
    return <div/>
  }

  if (eventType === EnumProjectEventType.folder) {
    return (<div className={"text-right"} style={{paddingRight: `${(maxDepth - depth + 1) * spacingPixel}px`}}>
      <FolderCostView currency={currency} value={cell.cost} objKey={objKey} settings={settings}/>
    </div>)
  }

  // event file/transaction
  const display = cell.cost[objKey];
  if(showEmpty) {
    return (
      <CurrencyView currency={cell.cost[objKeyCurrency]} value={display}/>
    )
  }

  return (isEmptyCost(display) ? null : <CurrencyView currency={cell.cost[objKeyCurrency]} value={display}/>)
}