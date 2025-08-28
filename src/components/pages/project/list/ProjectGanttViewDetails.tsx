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
import { CiTrash, CiEdit } from "react-icons/ci";
import {
    useDataTable,
    DataTable,
    DataTableColumnHeader,
    DataTableFilter
} from "@/components/custom/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Text, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyList } from "@/constants/app-enum";
import { Badge } from "@/components/ui/badge";

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
        events?: Array<{
            id: string;
            name: string;
            description: string | null;
            eventType: string;
            transactionType: string;
            budgetCurrency: string | null;
            budget: string | null;
            actualCurrency: string | null;
            actual: string | null;
            hasActual: boolean;
            actualCreatedAt: string | null;
            path: string;
        }>;
    }>;
    createdAt: string;
    updatedAt: string;
}

// Gantt cell component for displaying monthly events table
const GanttCellDetails: React.FC<{
    monthData: Project['monthlyData'][0] | undefined;
    isCurrentMonth?: boolean;
    projectId: string;
    projectName: string;
    yearMonth: string;
}> = ({ monthData, isCurrentMonth = false, projectId, projectName, yearMonth }) => {
    const { t } = useTranslation();

    if (!monthData || !monthData.events || monthData.events.length === 0) {
        return (
            <div className={cn(
                "h-32 flex items-center justify-center text-xs text-muted-foreground",
                isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
            )}>
                <span className="text-muted-foreground">No events</span>
            </div>
        );
    }

    const events = monthData.events;

    const eventColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: "name",
            enableSorting: false,
            header: () => (
                <div className="text-xs font-medium">Event</div>
            ),
            cell: ({ cell, row }) => (
                <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-[12px] truncate" title={cell.getValue() as string}>
                            {cell.getValue() as string}
                        </div>
                        <Badge
                            variant={row.original?.transactionType === 'income' ? 'default' : 'destructive'}
                            className="text-[8px] px-1 py-0 h-3 mt-0.5"
                        >
                            {row.original?.transactionType}
                        </Badge>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "budget",
            size: 80,
            enableSorting: false,
            header: () => (
                <div className="text-xs font-medium text-right">Budget</div>
            ),
            cell: ({ row }) => {
                const budget = row.original?.budget;
                const currency = row.original?.budgetCurrency;
                const transactionType = row.original?.transactionType;

                if (!budget || !currency) return <div className="text-right text-[12px] text-muted-foreground">-</div>;

                const baseColorClass = transactionType === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400';

                const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';

                return (
                    <div className="text-right text-[12px]">
                        <div className={`font-mono ${currencyColorClass}`}>{currency}</div>
                        <div className={`font-mono ${baseColorClass}`}>{parseFloat(budget).toLocaleString()}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "actual",
            size: 80,
            enableSorting: false,
            header: () => (
                <div className="text-xs font-medium text-right">Actual</div>
            ),
            cell: ({ row }) => {
                const actual = row.original?.actual;
                const currency = row.original?.actualCurrency;
                const hasActual = row.original?.hasActual;
                const transactionType = row.original?.transactionType;

                if (!hasActual || !actual || !currency) {
                    return <div className="text-right text-[12px] text-muted-foreground">-</div>;
                }

                const baseColorClass = transactionType === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400';

                const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';

                return (
                    <div className="text-right text-[12px]">
                        <div className={`font-mono ${currencyColorClass}`}>{currency}</div>
                        <div className={`font-mono font-medium ${baseColorClass}`}>{parseFloat(actual).toLocaleString()}</div>
                    </div>
                );
            },
        },
    ], []);

    const { table } = useDataTable({
        data: events,
        columns: eventColumns,
        pageCount: -1,
        initialState: {
            pagination: { pageIndex: 0, pageSize: 5 },
        },
        manualSorting: false,
        manualPagination: false
    });

    return (
        <div className={cn(
            "h-64 overflow-y-auto text-xs",
            isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
        )}>
            <div className="font-semibold mb-1">{projectName}</div>
            <DataTable table={table} pageSizeOptions={[5, 10, 20]}>
            </DataTable>
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

export const ProjectGanttViewDetails = ({
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
        // Add month columns with uniform width
        const monthColumns: ColumnDef<Project>[] = monthHeaders.map((month) => ({
            accessorKey: `month_${month.yearMonth}`,
            size: 550,
            minSize: 550,
            maxSize: 550,
            enableResizing: false,
            enableSorting: false,
            header: () => (
                <div className={cn(
                    "text-center text-xs font-medium p-1 w-full",
                    month.isCurrentMonth && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100"
                )}>
                    <div>{month.label}</div>
                    <div className="text-[10px] text-muted-foreground">Events Detail</div>
                </div>
            ),
            cell: ({ row }) => {
                const monthData = row.original?.monthlyData?.find(
                    (data) => data.yearMonth === month.yearMonth
                );
                return (
                    <div className="w-full">
                        <GanttCellDetails
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

        return [...monthColumns, actionColumn];
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