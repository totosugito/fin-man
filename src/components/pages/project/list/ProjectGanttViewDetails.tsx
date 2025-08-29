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
    DataTableFilter,
    createRowNumberColumn
} from "@/components/custom/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Text, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyList } from "@/constants/app-enum";
import { Badge } from "@/components/ui/badge";
import { date_to_string } from "@/lib/my-utils";

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
        const minHeight = 100; // Minimum height for empty state
        return (
            <div className={cn(
                "flex items-center justify-center text-sm text-muted-foreground",
                isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
            )}
                style={{ height: `${minHeight}px` }}>
                <span className="text-muted-foreground">No events</span>
            </div>
        );
    }

    const events = monthData.events;

    const eventColumns = useMemo<ColumnDef<any>[]>(() => [
        createRowNumberColumn({ accessorKey: "rowNum", id: "rowNum" }), 
        {
            accessorKey: "name",
            enableSorting: false,
            header: () => (
                <div className="text-sm font-semibold">Event</div>
            ),
            cell: ({ cell, row }) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                        <div className="font-medium text-sm truncate" title={cell.getValue() as string}>
                            {cell.getValue() as string}
                        </div>
                    </div>
                    <Badge
                        variant={row.original?.transactionType === 'income' ? 'default' : 'destructive'}
                        className="text-[10px] px-2 py-0"
                    >
                        {row.original?.transactionType}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: "budget",
            size: 120,
            enableSorting: false,
            header: () => (
                <div className="text-sm font-semibold text-right">Budget</div>
            ),
            cell: ({ row }) => {
                const budget = row.original?.budget;
                const currency = row.original?.budgetCurrency;
                const transactionType = row.original?.transactionType;

                if (!budget || !currency) return <div className="text-right text-sm text-muted-foreground">-</div>;

                const baseColorClass = transactionType === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400';

                const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';

                return (
                    <div className="text-right">
                        <div className={`text-xs font-mono ${currencyColorClass} mb-1`}>{currency}</div>
                        <div className={`text-sm font-mono ${baseColorClass}`}>
                            {parseFloat(budget).toLocaleString()}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "actual",
            size: 120,
            enableSorting: false,
            header: () => (
                <div className="text-sm text-right">Actual</div>
            ),
            cell: ({ row }) => {
                const actual = row.original?.actual;
                const currency = row.original?.actualCurrency;
                const hasActual = row.original?.hasActual;
                const transactionType = row.original?.transactionType;

                if (!hasActual || !actual || !currency) {
                    return <div className="text-right text-sm text-muted-foreground">-</div>;
                }

                const baseColorClass = transactionType === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400';

                const currencyColorClass = CurrencyList[currency as keyof typeof CurrencyList]?.textColor || 'text-muted-foreground';

                return (
                    <div className="text-right">
                        <div className={`text-xs font-mono ${currencyColorClass} mb-1`}>{currency}</div>
                        <div className={`text-sm font-mono ${baseColorClass}`}>
                            {parseFloat(actual).toLocaleString()}
                        </div>
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
            pagination: { pageIndex: 0, pageSize: 10 },
        },
        manualSorting: false,
        manualPagination: false
    });

    // Calculate dynamic height based on content
    const maxRowsToShow = 5;
    const rowHeight = 80; // Approximate height per row including padding
    const headerHeight = 40; // Height for table header
    const paddingHeight = 4; // Additional padding
    const actualRowCount = Math.min(events.length, maxRowsToShow);
    const calculatedHeight = headerHeight + (actualRowCount * rowHeight) + paddingHeight;
    const minHeight = headerHeight + rowHeight + paddingHeight; // At least one row height
    const dynamicHeight = Math.max(calculatedHeight, minHeight);

    return (
        <div className={cn(
            "overflow-hidden",
            isCurrentMonth && "bg-blue-50 dark:bg-blue-950"
        )}
            style={{ height: `${dynamicHeight}px` }}>
            <div 
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
            >
                <DataTable table={table} className={cn("text-sm")}>
                </DataTable>
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
        const label = date_to_string(date, 'yyyy-MM');
        months.push({ yearMonth, label, isCurrentMonth: false });
    }

    // Current month
    const currentYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const currentLabel = date_to_string(currentDate, 'yyyy-MM');
    months.push({ yearMonth: currentYearMonth, label: currentLabel, isCurrentMonth: true });

    // Next 6 months
    for (let i = 1; i <= 6; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date_to_string(date, 'yyyy-MM');
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
        const baseColumns: ColumnDef<Project>[] = [
            {
                accessorKey: "name",
                size: 200,
                minSize: 200,
                maxSize: 200,
                enableSorting: true,
                header: ({ column }) => (
                    <div className={"flex justify-center"}>
                        <DataTableColumnHeader column={column} title={"Project"} />
                    </div>
                ),
                cell: ({ cell, row }) => (
                    <div className="px-2 align-top" style={{ verticalAlign: 'top' }}>
                        <div className={"hover:underline cursor-pointer font-semibold text-sm"}
                            onClick={() => onShowDetail(row.original?.id)}>
                            {cell.getValue() as string}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {row.original?.description || 'No description'}
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

        // Add month columns with optimized width
        const monthColumns: ColumnDef<Project>[] = monthHeaders.map((month) => ({
            accessorKey: `month_${month.yearMonth}`,
            size: 500,
            minSize: 500,
            maxSize: 500,
            enableResizing: false,
            enableSorting: false,
            header: () => (
                <div className={cn(
                    "text-center text-sm font-semibold p-2 w-full",
                    month.isCurrentMonth && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100"
                )}>
                    <div className="text-base">{month.label}</div>
                </div>
            ),
            cell: ({ row }) => {
                const monthData = row.original?.monthlyData?.find(
                    (data) => data.yearMonth === month.yearMonth
                );
                return (
                    <div className="w-full align-top" style={{ verticalAlign: 'top' }}>
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
            size: 80,
            minSize: 80,
            maxSize: 80,
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size={"sm"} disabled={loading}>
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

        return [createRowNumberColumn({ accessorKey: "rowNum", id: "rowNum" }), ...baseColumns, ...monthColumns, actionColumn];
    }, [loading, monthHeaders, onDeleteClicked, onEditClicked, onShowDetail, t]);

    const { table } = useDataTable({
        data: data?.data || [],
        columns,
        pageCount: 1,
        initialState: {
            columnPinning: { left: ["rowNum", "action", "name"], right: [] },
            pagination: { pageIndex: 0, pageSize: 5 },
        },
        manualSorting: false,
        enableColumnResizing: false,
        columnResizeMode: 'onChange',
    });

    return (
        <div className="h-full overflow-y-auto" style={{ height: 'calc(100vh - 130px)' }}>
            <DataTable table={table} className="[&_td]:align-top">
                <DataTableFilter table={table}>
                    {toolbarContent}
                </DataTableFilter>
            </DataTable>
        </div>
    );
};