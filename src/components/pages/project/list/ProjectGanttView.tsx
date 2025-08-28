import React, { useMemo, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CiTrash, CiEdit } from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter
} from "@/components/custom/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Text, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyList } from "@/constants/app-enum";
import { useProjectEventsByYearMonth } from "@/service/project-event";
import { Badge } from "@/components/ui/badge";
import { getDaysFromCurrentDate } from "@/lib/my-utils";

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

// Popover table component for displaying project events
const EventsPopoverTable: React.FC<{
  projectId: string;
  yearMonth: string;
  projectName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ projectId, yearMonth, projectName, isOpen, onOpenChange, children }) => {
  const { t } = useTranslation();
  
  const { data: eventsData, isLoading } = useProjectEventsByYearMonth({
    projectId,
    yearMonth,
    page: 1,
    limit: 50,
    enabled: isOpen
  });

  const eventColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Event Name"} className={"justify-start"} />
      ),
      cell: ({ cell, row }) => (
        <div className="flex items-center gap-2">
          {row.original?.eventType === 'folder' ? (
            <FileText className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
          <div>
            <div className="font-medium">{cell.getValue() as string}</div>
            {row.original?.description && (
              <div className="text-xs text-muted-foreground">{row.original.description}</div>
            )}
          </div>
        </div>
      ),
      meta: {
        label: "Event Name",
        placeholder: "Search event name...",
        variant: "text",
        icon: Text,
      },
    },
    {
      accessorKey: "transactionType",
      size: 120,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Type"} className={"justify-center"} />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue() as string;
        if (!value) return <div className="text-center text-xs text-muted-foreground">-</div>;
        return (
          <div className="text-center">
            <Badge variant={value === 'income' ? 'default' : 'destructive'}>
              {value}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "budget",
      size: 120,
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Budget"} className={"justify-end"} />
      ),
      cell: ({ row }) => {
        const budget = row.original?.budget;
        const currency = row.original?.budgetCurrency;
        const transactionType = row.original?.transactionType;
        
        if (!budget || !currency) return <div className="text-right text-xs text-muted-foreground">-</div>;
        
        const baseColorClass = transactionType === 'income' 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-red-600 dark:text-red-400';
        
        const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';
        
        return (
          <div className="text-right text-xs">
            <span className={`font-mono ${currencyColorClass}`}>{currency}</span>
            <span className={`font-mono ml-1 ${baseColorClass}`}>{parseFloat(budget).toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "actual",
      size: 120,
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Actual"} className={"justify-end"} />
      ),
      cell: ({ row }) => {
        const actual = row.original?.actual;
        const currency = row.original?.actualCurrency;
        const hasActual = row.original?.hasActual;
        const transactionType = row.original?.transactionType;
        
        if (!hasActual || !actual || !currency) {
          return <div className="text-right text-xs text-muted-foreground">-</div>;
        }
        
        const baseColorClass = transactionType === 'income' 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-red-600 dark:text-red-400';
        
        const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';
        
        return (
          <div className="text-right text-xs">
            <span className={`font-mono ${currencyColorClass}`}>{currency}</span>
            <span className={`font-mono ml-1 font-medium ${baseColorClass}`}>{parseFloat(actual).toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "actualCreatedAt",
      size: 120,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Date"} className={"justify-center"} />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue() as string;
        if (!value) return <div className="text-center text-xs text-muted-foreground">-</div>;
        const dateInfo = getDaysFromCurrentDate(t, value);
        return (
          <div className="text-center">
            <div className="text-xs text-muted-foreground mt-0.5">{dateInfo?.value}</div>
          </div>
        );
      },
    },
  ], [t]);

  const { table } = useDataTable({
    data: eventsData?.data || [],
    columns: eventColumns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 50 },
    },
    manualSorting: false,
  });

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <div className="p-4">
          <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <h4 className="font-medium">Events for {yearMonth}</h4>
          </div>
          <Badge variant="outline">{projectName}</Badge>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading events...</div>
            </div>
          ) : eventsData?.data?.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">No events found for this month</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-auto">
              <DataTable table={table}>
                <DataTableFilter table={table} />
              </DataTable>
            </div>
          )}
          
          {eventsData?.meta && (
            <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
              Total: {eventsData.meta.total} events
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Gantt cell component for displaying monthly financial data (actual only)
const GanttCell: React.FC<{ 
  monthData: Project['monthlyData'][0] | undefined;
  isCurrentMonth?: boolean;
  projectId: string;
  projectName: string;
  yearMonth: string;
}> = ({ monthData, isCurrentMonth = false, projectId, projectName, yearMonth }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  if (!monthData || !monthData.cost || Object.keys(monthData.cost).length === 0) {
    return (
      <div className={cn(
        "h-12 flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/50",
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
    <EventsPopoverTable
      projectId={projectId}
      yearMonth={yearMonth}
      projectName={projectName}
      isOpen={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <div 
        className={cn(
          "p-1 flex flex-col justify-center text-xs overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors",
          isCurrentMonth && "bg-blue-50 dark:bg-blue-950",
          "border border-transparent hover:border-border"
        )}
        style={{ height: `${dynamicHeight}px` }}
        onClick={() => setIsPopoverOpen(true)}
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
                    "font-mono text-[12px]",
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
                      <span className="text-green-600 dark:text-green-400 font-mono">{incomeText}</span>
                    )}
                  </div>
                  {/* Expense column */}
                  <div className="text-right">
                    {expenseText && (
                      <span className="text-red-600 dark:text-red-400 font-mono">{expenseText}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </EventsPopoverTable>
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
            <GanttCell 
              monthData={monthData} 
              isCurrentMonth={month.isCurrentMonth}
              projectId={row.original.id}
              projectName={row.original.name}
              yearMonth={month.yearMonth}
            />
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