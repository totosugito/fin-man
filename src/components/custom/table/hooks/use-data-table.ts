import {
  ColumnFiltersState, ExpandedState,
  getCoreRowModel, getExpandedRowModel, getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableOptions,
  TableState,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table";
import * as React from "react";
import {useState} from "react";

interface UseDataTableProps<TData>
  extends Omit<
    TableOptions<TData>,
    |
    "state" |
    "pageCount" |
    "getCoreRowModel" |
    "getSubRows"
  >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  getSubRows?: (row: TData) => TData[] | undefined;
  initialState?: Omit<Partial<TableState>, "sorting" | "columnFilters"> & {
  };
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    manualSorting = false,
    manualFiltering = false,
    manualPagination = false,
    manualExpanding = false,
    onSortingChange,
    onPaginationChange,
    onColumnFiltersChange,
    onExpandedChange,
    getSubRows,
    ...tableProps
  } = props;

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(initialState?.expanded ?? {});

  // const handleExpandedChange = (updater: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
  //   setExpanded(updater);
  //   onExpandedChange?.(updater);
  // };

  const handleSortingChange = manualSorting ? onSortingChange : setSorting;
  const handlePaginationChange = manualPagination ? onPaginationChange : setPagination;
  const handleColumnFiltersChange = manualFiltering ? onColumnFiltersChange : setColumnFilters;
  const handleExpandedChange = manualExpanding ? onExpandedChange : setExpanded;

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      expanded
    },
    getSubRows: getSubRows || ((row: any) => row?.subRows),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: handleExpandedChange,

    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: manualPagination,
    manualSorting: manualSorting,
    manualFiltering: manualFiltering,
    manualExpanding: manualExpanding,
    meta: {
      ...(tableProps.meta ?? {}),
    }
  });

  return { table };
}