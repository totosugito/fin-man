import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CiEdit, CiTrash } from "react-icons/ci";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IoEllipsisVertical } from "react-icons/io5";
import { getProjectStatusStyle } from "@/lib/app-utils";
import { getDaysFromCurrentDate } from "@/lib/my-utils";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ProjectCardViewProps = {
  data: any[];
  loading: boolean;
  onEditClicked: (item: any) => void;
  onDeleteClicked: (item: any) => void;
  onShowDetail: (id: string) => void;
  t?: (key: string) => string;
};

// Cost display component for project cards
const ProjectCostSummary: React.FC<{ cost: any }> = ({ cost }) => { 
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  if (!cost || typeof cost !== 'object' || Object.keys(cost).length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No cost data
      </div>
    );
  }

  const formatAmount = (amount: string | number) => {
    const num = parseFloat(String(amount));
    if (isNaN(num) || num === 0) return '0';
    if (Math.abs(num) >= 1000000) return `${(num/1000000).toFixed(2)}M`;
    if (Math.abs(num) >= 1000) return `${(num/1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatFullAmount = (amount: number) => {
    return new Intl.NumberFormat().format(Math.abs(amount));
  };

  const getCurrencyData = () => {
    return Object.entries(cost).map(([currency, transactionTypes]: [string, any]) => {
      const income = transactionTypes?.income || { budget: '0', actual: '0' };
      const expense = transactionTypes?.expense || { budget: '0', actual: '0' };
      
      const budgetIncome = parseFloat(income.budget || '0');
      const budgetExpense = parseFloat(expense.budget || '0');
      const actualIncome = parseFloat(income.actual || '0');
      const actualExpense = parseFloat(expense.actual || '0');
      
      const budgetNet = budgetIncome - budgetExpense;
      const actualNet = actualIncome - actualExpense;
      const variance = actualNet - budgetNet;
      
      // Better hasActual detection
      const hasActual = (actualIncome !== 0 || actualExpense !== 0) &&
                       (actualIncome !== budgetIncome || actualExpense !== budgetExpense);
      
      // Calculate progress percentage (budget utilization)
      const totalBudget = budgetIncome + budgetExpense;
      const totalActual = actualIncome + actualExpense;
      const utilizationPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
      
      return {
        currency,
        budgetNet,
        actualNet,
        variance,
        hasActual,
        utilizationPercent: Math.min(utilizationPercent, 100),
        budgetIncome,
        budgetExpense,
        actualIncome,
        actualExpense
      };
    }).filter(item => item.budgetNet !== 0 || item.actualNet !== 0);
  };

  const currencyData = getCurrencyData();
  
  if (currencyData.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No cost data
      </div>
    );
  }

  const getStatusColor = (variance: number, hasActual: boolean, budgetNet: number) => {
    if (!hasActual) return budgetNet >= 0 ? 'text-green-600' : 'text-red-600';
    if (variance >= 0) return 'text-green-600';
    if (Math.abs(variance) / Math.abs(budgetNet || 1) <= 0.1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (variance: number, hasActual: boolean) => {
    if (!hasActual) return 'bg-blue-500';
    if (variance >= 0) return 'bg-green-500';
    if (Math.abs(variance) / Math.abs(variance || 1) <= 0.1) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      {currencyData.slice(0, 2).map(({ 
        currency, 
        budgetNet, 
        actualNet, 
        variance, 
        hasActual, 
        utilizationPercent,
        budgetIncome,
        budgetExpense,
        actualIncome,
        actualExpense
      }) => (
        <Popover 
          key={currency} 
          open={openPopover === currency} 
          onOpenChange={(open) => setOpenPopover(open ? currency : null)}
        >
          <PopoverTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-muted-foreground">{currency}</span>
                <span className={cn("font-medium", getStatusColor(variance, hasActual, budgetNet))}>
                  {hasActual ? formatAmount(actualNet) : formatAmount(budgetNet)}
                  {hasActual && (
                    <span className="text-muted-foreground ml-1">({Math.round(utilizationPercent)}%)</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className={cn("h-1.5 rounded-full transition-all", getProgressColor(variance, hasActual))}
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-sm">{currency} Cost Analysis</h4>
                <div className={cn("font-bold", getStatusColor(variance, hasActual, budgetNet))}>
                  {hasActual ? (
                    <span>{variance >= 0 ? '+' : ''}{formatAmount(variance)}</span>
                  ) : (
                    <span>{budgetNet >= 0 ? '+' : ''}{formatAmount(budgetNet)}</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Net:</span>
                  <span className={budgetNet >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {budgetNet >= 0 ? '+' : ''}{formatAmount(budgetNet)}
                  </span>
                </div>
                {hasActual && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual Net:</span>
                    <span className={actualNet >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {actualNet >= 0 ? '+' : ''}{formatAmount(actualNet)}
                    </span>
                  </div>
                )}
                {hasActual && (
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Variance:</span>
                    <span className={getStatusColor(variance, hasActual, budgetNet)}>
                      {variance >= 0 ? '+' : ''}{formatAmount(variance)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Breakdown</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Income</div>
                    <div className="text-green-600">Budget: +{formatAmount(budgetIncome)}</div>
                    {hasActual && <div className="text-green-600">Actual: +{formatAmount(actualIncome)}</div>}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Expense</div>
                    <div className="text-red-600">Budget: -{formatAmount(budgetExpense)}</div>
                    {hasActual && <div className="text-red-600">Actual: -{formatAmount(actualExpense)}</div>}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Budget Utilization</span>
                  <span>{Math.round(utilizationPercent)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full transition-all", getProgressColor(variance, hasActual))}
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}
      {currencyData.length > 2 && (
        <div className="text-xs text-muted-foreground text-center">
          +{currencyData.length - 2} more currencies
        </div>
      )}
    </div>
  );
};

export const ProjectCardView: React.FC<ProjectCardViewProps> = ({
  data,
  loading,
  onEditClicked,
  onDeleteClicked,
  onShowDetail,
  t = (key) => key, // Default translation function that returns the key
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No projects found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle
                  className="text-lg cursor-pointer hover:underline"
                  onClick={() => onShowDetail(item.id)}
                >
                  {item.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {item.description}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                    <IoEllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onEditClicked(item)}>
                      <CiEdit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteClicked(item)}
                    >
                      <CiTrash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge className={getProjectStatusStyle(item.status)}>
                  {item.status}
                </Badge>
              </div>
              
              {/* Cost Summary */}
              <div className="border-t pt-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">Cost Summary</div>
                <ProjectCostSummary cost={item.cost} />
              </div>
              
              {item.updatedAt && (
                <div className="text-xs text-muted-foreground">
                  {t('labels.lastUpdated')}: {getDaysFromCurrentDate(t, item.updatedAt)?.value}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
