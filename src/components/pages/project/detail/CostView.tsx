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

interface CostData {
  [currency: string]: CostItem;
}

const FolderCostView = ({currency, value, objKey}:
                        { currency: string, value: CostData, objKey: keyof CostItem }) => {
  if (currency === "") {
    return (
      <div className={""}>
        {Object.entries(value).map(([key, val]) => (
          <div key={key}>{key} {val[objKey]}</div>
        ))}
      </div>
    );
  }

  const curValue = value?.[currency]?.[objKey];
  if (!curValue) {
    return <div/>
  }

  return (
    <div className={""}>{currency} {curValue}</div>
  )
}

type Props = {
  spacingPixel?: number;
  maxDepth: number;
  currency: string;
  cell: ProjectMember;
  objKey: keyof CostItem;
  objKeyCurrency: keyof CostItem
}
export const CostView = ({spacingPixel=10, maxDepth, currency, cell, objKey, objKeyCurrency}: Props) => {
  const eventType = cell.eventType;
  const depth = cell.depth;

  if (eventType === EnumProjectEventType.folder) {
    return (<div className={"text-right font-mono"} style={{paddingRight: `${(maxDepth - depth + 1) * spacingPixel}px`}}>
      <FolderCostView currency={currency} value={cell.cost} objKey={objKey}/>
    </div>)
  }

  return (
    <div className={"text-right font-mono"}>{cell.cost[objKeyCurrency]} {cell.cost[objKey]}</div>
  )
}