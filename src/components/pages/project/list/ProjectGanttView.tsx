import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoMenu } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { CiTrash, CiEdit } from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter
} from "@/components/custom/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Text } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyList } from "@/constants/app-enum";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  monthlyData: Array<{
    yearMonth: string;
    cost: {
      [currency: string]: {
        income: {
          budget: string;
          actual: string;
        };
        expense: {
          budget: string;
          actual: string;
        };
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

// Gantt cell component for displaying monthly financial data (actual only)
const GanttCell: React.FC<{ 
  monthData: Project['monthlyData'][0] | undefined;
  isCurrentMonth?: boolean;
}> = ({ monthData, isCurrentMonth = false }) => {
  if (!monthData || !monthData.cost || Object.keys(monthData.cost).length === 0) {
    return (
      <div className={cn(
        "h-12 flex items-center justify-center text-xs text-muted-foreground",
        isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
      )}>
        -
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

  const getCurrencyData = () => {
    return Object.entries(monthData.cost).map(([currency, transactionTypes]) => {
      const income = transactionTypes?.income || { budget: '0', actual: '0' };
      const expense = transactionTypes?.expense || { budget: '0', actual: '0' };
      
      const actualIncome = parseFloat(income.actual || '0');
      const actualExpense = parseFloat(expense.actual || '0');
      
      return {
        currency,
        actualIncome,
        actualExpense,
        hasActualData: actualIncome !== 0 || actualExpense !== 0
      };
    }).filter(item => item.hasActualData);
  };

  const currencyData = getCurrencyData();
  
  if (currencyData.length === 0) {
    return (
      <div className={cn(
        "h-12 flex items-center justify-center text-xs text-muted-foreground",
        isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
      )}>
        -
      </div>
    );
  }

  // Show all currencies using table layout with right-aligned values
  // Calculate dynamic height based on number of currencies
  const baseHeight = 56; // h-12 = 48px
  const heightPerCurrency = 32; // Approximate height needed per currency
  const dynamicHeight = Math.max(baseHeight, currencyData.length * heightPerCurrency + 12); // +12px for padding
  
  return (
    <div 
      className={cn(
        "p-1 flex flex-col justify-center text-xs overflow-hidden",
        isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
      )}
      style={{ height: `${dynamicHeight}px` }}
    >
      <div className="flex flex-col gap-1 h-full justify-center">
        {currencyData.map(({ currency, actualIncome, actualExpense }) => {
          const incomeText = actualIncome > 0 ? formatAmount(actualIncome) : '';
          const expenseText = actualExpense > 0 ? formatAmount(actualExpense) : '';
          
          // If no actual data, show dash
          if (!incomeText && !expenseText) {
            return (
              <div key={currency} className="flex items-center justify-center">
                <span className="font-mono text-[10px] text-muted-foreground">-</span>
              </div>
            );
          }
          
          return (
            <div key={currency} className="flex flex-col gap-0.5">
              {/* Currency label */}
              <div className="text-center">
                <span className={cn(
                  "font-mono text-[10px] font-medium",
                  CurrencyList[currency as keyof typeof CurrencyList]?.textColor || "text-muted-foreground"
                )}>
                  {currency}
                </span>
              </div>
              {/* Values table */}
              <div className="grid grid-cols-2 gap-1 text-[12px]">
                {/* Income column */}
                <div className="text-right">
                  {incomeText && (
                    <span className="text-green-600 dark:text-green-400 font-mono font-medium">{incomeText}</span>
                  )}
                </div>
                {/* Expense column */}
                <div className="text-right">
                  {expenseText && (
                    <span className="text-red-600 dark:text-red-400 font-mono font-medium">{expenseText}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Generate month headers for the past 6 months and next 6 months
const generateMonthHeaders = () => {
  const months: { yearMonth: string; label: string; isCurrentMonth: boolean }[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Previous 6 months
  for (let i = 6; i > 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ yearMonth, label, isCurrentMonth: false });
  }
  
  // Current month
  const currentYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  months.push({ yearMonth: currentYearMonth, label: currentLabel, isCurrentMonth: true });
  
  // Next 6 months
  for (let i = 1; i <= 6; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ yearMonth, label, isCurrentMonth: false });
  }
  
  return months;
};

type Props = {
  data: Record<string, any>;
  loading: boolean;
  onDeleteClicked: (item: any) => void;
  onEditClicked: (item: any) => void;
  onShowDetail: (id: string) => void;
  toolbarContent?: React.ReactNode;
}

export const ProjectGanttView = ({
  data,
  loading,
  onDeleteClicked,
  onEditClicked,
  toolbarContent,
  onShowDetail,
}: Props) => {
  const { t } = useTranslation();
  const monthHeaders = generateMonthHeaders();

  const columns = useMemo<ColumnDef<Project>[]>(() => {
    const baseColumns: ColumnDef<Project>[] = [
      {
        accessorKey: "name",
        size: 250,
        minSize: 250,
        maxSize: 250,
        enableSorting: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={"Project"} className={"justify-center"} />
        ),
        cell: ({ cell, row }) => (
          <div className="">
            <div className={"break-all hover:underline cursor-pointer font-semibold text-sm"} 
                 onClick={() => onShowDetail(row.original?.id)}>
              {cell.getValue() as string}
            </div>
          </div>
        ),
        meta: {
          label: "Project",
          placeholder: "Search project name...",
          variant: "text",
          icon: Text,
        },
      }
    ];

    // Add month columns with uniform width
    const monthColumns: ColumnDef<Project>[] = monthHeaders.map((month) => ({
      accessorKey: `month_${month.yearMonth}`,
      size: 150,
      minSize: 150,
      maxSize: 150,
      enableResizing: false,
      enableSorting: false,
      header: () => (
        <div className={cn(
          "text-center text-xs font-medium p-1 w-full",
          month.isCurrentMonth && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100"
        )}>
          <div>{month.label}</div>
          <div className="text-[10px] text-muted-foreground">Actual</div>
        </div>
      ),
      cell: ({ row }) => {
        const monthData = row.original?.monthlyData?.find(
          (data) => data.yearMonth === month.yearMonth
        );
        return (
          <div className="w-full">
            <GanttCell monthData={monthData} isCurrentMonth={month.isCurrentMonth} />
          </div>
        );
      },
    }));

    // Add action column
    const actionColumn: ColumnDef<Project> = {
      accessorKey: "action",
      size: 60,
      header: "",
      cell: ({ row }) => {
        return (
          <div className="text-center sticky right-0 bg-background border-l border-gray-200 p-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={"icon"} disabled={loading}>
                  <IoMenu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="start">
                <DropdownMenuGroup className={"gap-1"}>
                  <DropdownMenuItem onClick={() => onEditClicked(row.original)}>
                    <CiEdit /> {t("shared.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteClicked(row.original)} className={"text-destructive"}>
                    <CiTrash className={"text-destructive"} /> {t("shared.delete")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    };

    return [...baseColumns, ...monthColumns, actionColumn];
  }, [loading, monthHeaders, onDeleteClicked, onEditClicked, onShowDetail, t]);

  const { table } = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: 1,
    initialState: {
      columnPinning: { left: ["#", "name"], right: ["action"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    manualSorting: false,
    enableColumnResizing: false,
    columnResizeMode: 'onChange',
  });

  return (
    <div className="">
      <DataTable table={table}>
        <DataTableFilter table={table}>
          {toolbarContent}
        </DataTableFilter>
      </DataTable>
    </div>
  );
};