import {ProjectMember} from "@/lib/project-utils";
import {EnumProjectEventType} from "backend/src/db/schema";
import {cn} from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

type CostItem = {
  transactionType?: string;
  budgetCurrency?: string;
  budget?: string;
  actualCurrency?: string;
  actual?: string;
  hasActual?: boolean;
};

// For folder eventSummary format
type FolderCostData = {
  [currency: string]: {
    [transactionType: string]: {
      budget: string;
      actual: string;
    };
  };
};

// Legacy format for backward compatibility
type LegacyCostItem = {
  budgetIncome: string;
  budgetIncomeCurrency?: string;
  budgetExpense: string;
  budgetExpenseCurrency?: string;
  actualIncome: string;
  actualIncomeCurrency?: string;
  actualExpense: string;
  actualExpenseCurrency?: string;
};

type ProjectSettings = {
  showEmptyCost: boolean;
  useInlineView?: boolean;
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
    <div className={cn("text-right items-center", className)}>
      {isFolder ? String.fromCharCode(9679) : ""}
      <span className={"font-mono text-[70%] text-foreground/70"}>{currency}</span> {value}</div>
  )
}

const InlineFolderCostView = ({ currency, data, isFolder, hideReal, field }: FolderSummaryProps & { hideReal?: boolean, field?: 'budget' | 'real' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const budgetIncome = parseFloat(data?.income?.budget || '0');
  const budgetExpense = parseFloat(data?.expense?.budget || '0');
  const realIncome = parseFloat(data?.income?.actual || '0');
  const realExpense = parseFloat(data?.expense?.actual || '0');
  
  const budgetNet = budgetIncome - budgetExpense;
  const realNet = realIncome - realExpense;
  const variance = realNet - budgetNet;
  const budgetUtilization = budgetNet !== 0 ? (realNet / budgetNet) * 100 : 0;
  
  const getStatusColor = () => {
    if (field === 'real') {
      // For delta/variance view in real column
      if (variance >= 0) return 'text-green-600';
      if (Math.abs(variance) / Math.abs(budgetNet) <= 0.1) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // For budget column
      return budgetNet >= 0 ? 'text-green-600' : 'text-red-600';
    }
  };
  
  const getProgressColor = () => {
    if (budgetUtilization <= 100) return 'bg-green-500';
    if (budgetUtilization <= 110) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const formatAmount = (amount: number) => {
    if (amount === 0) return '0';
    // if (Math.abs(amount) >= 1000000) return `${(amount/1000000).toFixed(1)}M`;
    // if (Math.abs(amount) >= 1000) return `${(amount/1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };
  
  const formatFullAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Determine display value based on field
  const getDisplayValue = () => {
    if (field === 'real') {
      // Show delta/variance in real column
      if (hideReal) return budgetNet; // fallback to budget if real should be hidden
      return variance;
    } else {
      // Show budget net in budget column
      return budgetNet;
    }
  };
  
  const displayValue = getDisplayValue();
  const displayLabel = field === 'real' ? 'Δ' : '';
  
  // Detailed popover content (same as CompactProgressView)
  const PopoverContentComponent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-semibold text-sm">
          {currency} {field === 'real' ? 'Delta Analysis' : 'Budget Overview'}
        </h4>
        <div className={cn("font-bold", getStatusColor())}>
          {field === 'real' ? (
            <span>{variance >= 0 ? '+' : ''}{formatFullAmount(variance)}</span>
          ) : (
            <span>{budgetNet >= 0 ? '+' : ''}{formatFullAmount(budgetNet)}</span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget Net:</span>
          <span className={budgetNet >= 0 ? 'text-green-600' : 'text-red-600'}>
            {budgetNet >= 0 ? '+' : ''}{formatFullAmount(budgetNet)}
          </span>
        </div>
        {!hideReal && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Actual Net:</span>
            <span className={realNet >= 0 ? 'text-green-600' : 'text-red-600'}>
              {realNet >= 0 ? '+' : ''}{formatFullAmount(realNet)}
            </span>
          </div>
        )}
        {!hideReal && (
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Variance:</span>
            <span className={getStatusColor()}>
              {variance >= 0 ? '+' : ''}{formatFullAmount(variance)}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 pt-2 border-t">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Breakdown</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Income</div>
            <div className="text-green-600">Budget: +{formatFullAmount(budgetIncome)}</div>
            {!hideReal && <div className="text-green-600">Actual: +{formatFullAmount(realIncome)}</div>}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Expense</div>
            <div className="text-red-600">Budget: -{formatFullAmount(budgetExpense)}</div>
            {!hideReal && <div className="text-red-600">Actual: -{formatFullAmount(realExpense)}</div>}
          </div>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Performance</span>
          <span>{Math.round(budgetUtilization)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={cn("h-2 rounded-full transition-all", getProgressColor())}
            style={{ width: `${Math.min(Math.abs(budgetUtilization), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-muted/20 rounded px-1 py-0.5 transition-colors flex items-center gap-2">
          {isFolder && <span className="text-blue-500 text-xs">●</span>}
          <span className="font-mono text-xs text-muted-foreground min-w-[28px]">{currency}</span>
          <div className="flex-1 min-w-0">
            <div className="w-full bg-muted rounded-full h-1">
              <div 
                className={cn("h-1 rounded-full transition-all", getProgressColor())}
                style={{ width: `${Math.min(Math.abs(budgetUtilization), 100)}%` }}
              />
            </div>
          </div>
          <span className={cn("font-medium text-xs whitespace-nowrap flex items-center gap-1", getStatusColor())}>
            {displayLabel && <span className="text-xs opacity-70">{displayLabel}</span>}
            {displayValue >= 0 && field === 'real' ? '+' : ''}{formatAmount(displayValue)}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top" align="start">
        <PopoverContentComponent />
      </PopoverContent>
    </Popover>
  );
};

const InlineMultiCurrencyFolderView = ({currency, value, settings, hideReal, field}: 
  { currency: string, value: FolderCostData, settings?: ProjectSettings, hideReal?: boolean, field?: 'budget' | 'real' }) => {
  const showEmpty = settings?.showEmptyCost || false;
  
  if (currency === "") {
    // Show all currencies in a horizontal layout
    const currencyEntries = Object.entries(value).filter(([currencyKey, transactionTypes]) => {
      if (showEmpty) return true;
      
      const incomeData = transactionTypes?.income || { budget: '0', actual: '0' };
      const expenseData = transactionTypes?.expense || { budget: '0', actual: '0' };
      const allEmpty = isEmptyCost(incomeData.budget) && isEmptyCost(incomeData.actual) &&
                     isEmptyCost(expenseData.budget) && isEmptyCost(expenseData.actual);
      return !allEmpty;
    });
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {currencyEntries.map(([currencyKey, transactionTypes]) => {
          const incomeData = transactionTypes?.income || { budget: '0', actual: '0' };
          const expenseData = transactionTypes?.expense || { budget: '0', actual: '0' };
          
          return (
            <InlineFolderCostView 
              key={currencyKey}
              currency={currencyKey}
              data={{ income: incomeData, expense: expenseData }}
              isFolder={false}
              hideReal={hideReal}
              field={field}
            />
          );
        })}
      </div>
    );
  }
  
  // Show specific currency
  const transactionTypes = value[currency];
  if (!transactionTypes) return <div/>;
  
  const incomeData = transactionTypes?.income || { budget: '0', actual: '0' };
  const expenseData = transactionTypes?.expense || { budget: '0', actual: '0' };
  
  if (!showEmpty) {
    const allEmpty = isEmptyCost(incomeData.budget) && isEmptyCost(incomeData.actual) &&
                   isEmptyCost(expenseData.budget) && isEmptyCost(expenseData.actual);
    if (allEmpty) return <div/>;
  }
  
  return (
    <InlineFolderCostView 
      currency={currency}
      data={{ income: incomeData, expense: expenseData }}
      isFolder={true}
      hideReal={hideReal}
      field={field}
    />
  );
};

type FolderSummaryProps = {
  currency: string;
  data: { income: { budget: string; actual: string }, expense: { budget: string; actual: string } };
  isFolder?: boolean;
  hideReal?: boolean;
  field?: 'budget' | 'real';
}

const FolderCostView = ({currency, value, objKey, settings, className}:
                        { currency: string, value: FolderCostData, objKey: string, settings?: ProjectSettings, className?: string }) => {
  const showEmpty = settings?.showEmptyCost || false;

  if (currency === "") {
    return (
      <div className={""}>
        {Object.entries(value).map(([currencyKey, transactionTypes]) => {
          const transactionType = objKey.includes('Income') ? 'income' : 'expense';
          const field = objKey.includes('budget') || objKey.includes('Budget') ? 'budget' : 'actual';
          const amount = transactionTypes?.[transactionType]?.[field] || '0';
          
          if (showEmpty) {
            return <div key={currencyKey}>{currencyKey} {amount}</div>
          } else {
            return (isEmptyCost(amount) ? null :
              <CurrencyView key={currencyKey} currency={currencyKey} value={amount} className={className} isFolder={true}/>)
          }
        })}
      </div>
    );
  }

  const transactionType = objKey.includes('Income') ? 'income' : 'expense';
  const field = objKey.includes('budget') || objKey.includes('Budget') ? 'budget' : 'actual';
  const display = value?.[currency]?.[transactionType]?.[field] || '0';
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
  objKey: string;
  objKeyCurrency: string,
  settings?: ProjectSettings
}
export const CombinedCostView = ({spacingPixel = 10, maxDepth, currency, cell, field, settings}: 
  { spacingPixel?: number; maxDepth: number; currency: string; cell: ProjectMember; field: 'budget' | 'real'; settings?: ProjectSettings }) => {
  const eventType = cell.eventType;
  const depth = cell.depth;
  const showEmpty = settings?.showEmptyCost || false;
  
  // Determine if we should hide real values (only for files with hasReal=false)
  const isRealField = field === 'real';
  const shouldHideReal = false; // Folders should always show aggregated values from backend
  
  if (eventType === EnumProjectEventType.folder) {
    // Handle new folder eventSummary format
    if (!showEmpty && (!cell.cost || Object.keys(cell.cost).length === 0)) {
      return <div/>
    }
    
    // Use inline view (ultra-compact single line)
    return (
      <div className={"text-right"} style={{paddingRight: `${(maxDepth - depth + 2) * spacingPixel}px`}}>
        <InlineMultiCurrencyFolderView currency={currency} value={cell.cost} settings={settings} hideReal={shouldHideReal} field={field}/>
      </div>
    )
  }

  // Handle file cost (new format)
  if (cell.cost && 'transactionType' in cell.cost) {
    const currencyField = field === 'budget' ? 'budgetCurrency' : 'actualCurrency';
    const display = field === 'budget' ? cell.cost.budget : cell.cost.actual;
    const displayCurrency = cell.cost[currencyField];
    const className = cell.cost.transactionType === 'income' ? 'text-green-600' : 'text-red-600';
    
    // Hide real values if hasActual is false
    if (isRealField && !cell.cost.hasActual) {
      return <div/>
    }
    
    if (!showEmpty && isEmptyCost(display)) {
      return <div/>
    }
    
    return (
      <CurrencyView currency={displayCurrency} value={display} className={className}/>
    )
  }
  
  // Legacy format support (fallback) - show both income and expense
  const incomeKey = field === 'budget' ? 'budgetIncome' : 'actualIncome';
  const expenseKey = field === 'budget' ? 'budgetExpense' : 'actualExpense';
  const incomeCurrencyKey = field === 'budget' ? 'budgetIncomeCurrency' : 'actualIncomeCurrency';
  const expenseCurrencyKey = field === 'budget' ? 'budgetExpenseCurrency' : 'actualExpenseCurrency';
  
  const incomeDisplay = cell.cost?.[incomeKey];
  const expenseDisplay = cell.cost?.[expenseKey];
  const incomeCurrency = cell.cost?.[incomeCurrencyKey];
  const expenseCurrency = cell.cost?.[expenseCurrencyKey];
  
  return (
    <div className="flex flex-col gap-0.5">
      {(!showEmpty && isEmptyCost(incomeDisplay)) ? null : (
        <CurrencyView currency={incomeCurrency} value={incomeDisplay} className="text-green-600"/>
      )}
      {(!showEmpty && isEmptyCost(expenseDisplay)) ? null : (
        <CurrencyView currency={expenseCurrency} value={expenseDisplay} className="text-red-600"/>
      )}
    </div>
  );
};

export const CostView = ({spacingPixel = 10, maxDepth, currency, cell, objKey, objKeyCurrency, settings}: Props) => {
  const eventType = cell.eventType;
  const depth = cell.depth;
  const className = (objKey.includes("Expense")) ? "text-red-600" : "text-green-600";

  const showEmpty = settings?.showEmptyCost || false;
  
  if (eventType === EnumProjectEventType.folder) {
    // Handle new folder eventSummary format
    if (!showEmpty && (!cell.cost || Object.keys(cell.cost).length === 0)) {
      return <div/>
    }
    
    return (<div className={"text-right"} style={{paddingRight: `${(maxDepth - depth + 2) * spacingPixel}px`}}>
      <FolderCostView currency={currency} value={cell.cost} objKey={objKey} settings={settings} className={className}/>
    </div>)
  }

  // Handle file cost (new format)
  if (cell.cost && 'transactionType' in cell.cost) {
    const transactionType = objKey.includes('Income') ? 'income' : 'expense';
    const isRealField = objKey.includes('real') || objKey.includes('Real');
    const field = objKey.includes('budget') || objKey.includes('Budget') ? 'budget' : 'actual';
    const currencyField = objKey.includes('budget') || objKey.includes('Budget') ? 'budgetCurrency' : 'actualCurrency';
    
    // Hide real values if hasActual is false
    if (isRealField && !cell.cost.hasActual) {
      return <div/>
    }
    
    // Only show if transaction type matches
    if (cell.cost.transactionType !== transactionType) {
      return <div/>
    }
    
    const display = field === 'budget' ? cell.cost.budget : cell.cost.actual;
    const displayCurrency = cell.cost[currencyField];
    
    if (!showEmpty && isEmptyCost(display)) {
      return <div/>
    }
    
    return (
      <CurrencyView currency={displayCurrency} value={display} className={className}/>
    )
  }
  
  // Legacy format support (fallback)
  const legacyDisplay = cell.cost?.[objKey];
  if (!showEmpty && isEmptyCost(legacyDisplay)) {
    return <div/>
  }

  return (isEmptyCost(legacyDisplay) ? null : <CurrencyView currency={cell.cost?.[objKeyCurrency]} value={legacyDisplay} className={className}/>)
}