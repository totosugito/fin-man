import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyCardProps {
  currency: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  values: {
    budgetIncome?: string;
    budgetExpense?: string;
    actualIncome?: string;
    actualExpense?: string;
  };
}

export const CurrencyCard = React.memo(({ currency, isExpanded, onToggleExpand, values }: CurrencyCardProps) => {

  return (
    <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{currency}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div className="px-3 py-1 bg-muted text-sm font-medium rounded-full">
            {currency}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Actual Section - Always visible */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Actual</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Income</span>
              <span className="font-medium text-green-600 dark:text-green-500">{values.actualIncome || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expense</span>
              <span className="font-medium text-red-600 dark:text-red-500">{values.actualExpense || '0.00'}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Balance</span>
                <span className={
                  `text-sm font-semibold ${
                    (parseFloat(values.actualIncome || '0') - parseFloat(values.actualExpense || '0')) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`
                }>
                  {(parseFloat(values.actualIncome || '0') - parseFloat(values.actualExpense || '0')).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Budget Section */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Budget</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Income</span>
                  <span className="font-medium text-green-600 dark:text-green-500">{values.budgetIncome || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expense</span>
                  <span className="font-medium text-red-600 dark:text-red-500">{values.budgetExpense || '0.00'}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Remaining</span>
                    <span className={
                      `text-sm font-semibold ${
                        (parseFloat(values.budgetIncome || '0') - parseFloat(values.budgetExpense || '0')) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`
                    }>
                      {(parseFloat(values.budgetIncome || '0') - parseFloat(values.budgetExpense || '0')).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/5 p-3 rounded-lg">
              <h4 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Budget vs Actual</span>
                  <span className={
                    `text-sm font-medium ${
                      (parseFloat(values.actualIncome || '0') - parseFloat(values.actualExpense || '0')) >= 
                      (parseFloat(values.budgetIncome || '0') - parseFloat(values.budgetExpense || '0'))
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`
                  }>
                    {(
                      (parseFloat(values.actualIncome || '0') - parseFloat(values.actualExpense || '0')) -
                      (parseFloat(values.budgetIncome || '0') - parseFloat(values.budgetExpense || '0'))
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

CurrencyCard.displayName = 'CurrencyCard';
