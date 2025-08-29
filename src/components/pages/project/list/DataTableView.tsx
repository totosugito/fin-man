import React, {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {IoMenu} from "react-icons/io5";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Badge} from "@/components/ui/badge";
import {CiTrash, CiEdit, CiLock} from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter,
  createRowNumberColumn
} from "@/components/custom/table";
import type {ColumnDef} from "@tanstack/react-table";
import {Text} from "lucide-react";
import {getProjectStatusStyle} from "@/lib/app-utils";
import {getDaysFromCurrentDate} from "@/lib/my-utils";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  cost?: any;
  createdAt: string;
  updatedAt: string;
  deleted_at: string;
}

// Compact cost display for table rows
const TableCostDisplay: React.FC<{ cost: any }> = ({ cost }) => { 
  if (!cost || typeof cost !== 'object' || Object.keys(cost).length === 0) {
    return <div className="text-xs text-muted-foreground">No data</div>;
  }

  const formatAmount = (amount: string | number) => {
    const num = parseFloat(String(amount));
    if (isNaN(num) || num === 0) return '0';
    if (Math.abs(num) >= 1000000) return `${(num/1000000).toFixed(1)}M`;
    if (Math.abs(num) >= 1000) return `${(num/1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getCurrencyData = () => {
    return Object.entries(cost).map(([currency, transactionTypes]: [string, any]) => {
      const income = transactionTypes?.income || { budget: '0', actual: '0' };
      const expense = transactionTypes?.expense || { budget: '0', actual: '0' };
      
      const budgetNet = parseFloat(income.budget || '0') - parseFloat(expense.budget || '0');
      const actualNet = parseFloat(income.actual || '0') - parseFloat(expense.actual || '0');
      const variance = actualNet - budgetNet;
      
      return {
        currency,
        budgetNet,
        actualNet,
        variance,
        hasActual: actualNet !== 0
      };
    }).filter(item => item.budgetNet !== 0 || item.actualNet !== 0);
  };

  const currencyData = getCurrencyData();
  
  if (currencyData.length === 0) {
    return <div className="text-xs text-muted-foreground">No data</div>;
  }

  // Show only the first currency for table view to keep it compact
  const firstCurrency = currencyData[0];
  const { currency, budgetNet, actualNet, variance, hasActual } = firstCurrency;
  
  const getStatusColor = () => {
    if (!hasActual) return budgetNet >= 0 ? 'text-green-600' : 'text-red-600';
    if (variance >= 0) return 'text-green-600';
    if (Math.abs(variance) / Math.abs(budgetNet) <= 0.1) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1">
        <span className="font-mono text-muted-foreground">{currency}</span>
        <span className="text-muted-foreground">{formatAmount(budgetNet)}</span>
        {hasActual && (
          <>
            <span className="text-muted-foreground">→</span>
            <span className={cn("font-medium", getStatusColor())}>
              {formatAmount(actualNet)}
            </span>
          </>
        )}
        {!hasActual && (
          <span className={cn("font-medium", getStatusColor())}>
            {formatAmount(budgetNet)}
          </span>
        )}
      </div>
      {currencyData.length > 1 && (
        <div className="text-muted-foreground mt-0.5">
          +{currencyData.length - 1} more
        </div>
      )}
    </div>
  );
};

type Props = {
  data: Record<string, any>;
  loading: boolean;
  onDeleteClicked: (item: any) => void;
  onEditClicked: (item: any) => void;
  onShowDetail: (id: string) => void;
  toolbarContent?: React.ReactNode
}

export const DataTableView = ({
                                data, loading, onDeleteClicked,
                                onEditClicked, toolbarContent,
                                onShowDetail,
                              }: Props) => {
  const {t} = useTranslation();

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    createRowNumberColumn({ accessorKey: "rowNum", id: "rowNum" }), 
    {
      accessorKey: "name",
      enableSorting: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Name"} className={"justify-center"}/>)
      },
      cell: ({cell, row}) => (
        <div>
          <div className={"break-all hover:underline cursor-pointer font-semibold"} onClick={() => onShowDetail(row.original?.id)}>
            {cell.getValue() as string}
          </div>
          <div className={"break-all text-foreground/70"}>
            {row.original?.description}
          </div>
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search project name...",
        variant: "text",
        icon: Text,
      },
    },
    {
      accessorKey: "cost",
      size: 120,
      enableSorting: false,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Cost Summary"} className={"justify-center"}/>) 
      },
      cell: ({row}) => {
        return <TableCostDisplay cost={row.original?.cost} />;
      },
    },
    {
      accessorKey: "status",
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Status"}/>)
      },
      cell: ({cell}) => {
        const value = cell.getValue() as string;
        const className = getProjectStatusStyle(value);
        return (
          <Badge className={className}>{value}</Badge>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Updated at"}/>)
      },
      cell: ({cell}) => {
        const value = getDaysFromCurrentDate(t, cell.getValue() as string);
        return (
          <div className={"flex flex-col items-center w-fit gap-1"}>
            <Badge className={value?.style}>{value?.labels}</Badge>
            <div className={"text-xs text-foreground/70"}>{value?.value}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "action",
      size: 60,
      header: "",
      cell: ({row}) => {
        return (
          <div
            className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={"icon"} disabled={loading}><IoMenu/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="start">
                <DropdownMenuGroup className={"gap-1"}>
                  <DropdownMenuItem onClick={() => onEditClicked(row.original)}>
                    <CiEdit/> {t("shared.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onClick={() => onDeleteClicked(row.original)} className={"text-destructive"}>
                    <CiTrash className={"text-destructive"}/> {t("shared.delete")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    },
  ], [loading]);

  const {table} = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: 1,
    initialState: {
      columnPinning: {left: ['rowNum', 'action']},
      pagination: {pageIndex: 0, pageSize: 10},
    },
    manualSorting: false,
  });

  return (
    <div className={""}>
      <DataTable table={table}>
        <DataTableFilter table={table}>
          {toolbarContent}
        </DataTableFilter>
      </DataTable>
    </div>
  );
}
