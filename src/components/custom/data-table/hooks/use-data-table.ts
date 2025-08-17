"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import type { ExtendedColumnSort, ExtendedColumnFilter, JoinOperator } from "../types/data-table";

interface UseDataTableProps<TData>
  extends Omit<
    TableOptions<TData>,
    |
    "state" |
    "pageCount" |
    "getCoreRowModel"
  >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting" | "columnFilters"> & {
    sorting?: ExtendedColumnSort<TData>[];
    columnFilters?: ExtendedColumnFilter<TData>[];
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
    onSortingChange,
    onPaginationChange,
    onColumnFiltersChange,
    ...tableProps
  } = props;

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  const [pagination, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [advancedFilters, setAdvancedFilters] = React.useState<ExtendedColumnFilter<TData>[]>(initialState?.columnFilters ?? []);
  const [joinOperator, setJoinOperator] = React.useState<JoinOperator>("and");

  const handleSortingChange = manualSorting ? onSortingChange : setSorting;
  const handlePaginationChange = manualPagination ? onPaginationChange : setPagination;
  const handleColumnFiltersChange = manualFiltering ? onColumnFiltersChange : setColumnFilters;

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
    },
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
    meta: {
        ...(tableProps.meta ?? {}),
        advancedFilters,
        setAdvancedFilters,
        joinOperator,
        setJoinOperator,
    }
  });

  return { table };
}