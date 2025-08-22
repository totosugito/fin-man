"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ColumnWithMeta, ColumnMeta } from "./types/types";

interface DataTableFilterProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableFilter<TData>({
                                          table,
                                          children,
                                          className,
                                          ...props
                                        }: DataTableFilterProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-0",
        className,
      )}
      {...props}
    >
      <div className="relative flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}

        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="ghost"
            size="sm"
            className="w-[32px] h-[32px] mr-[2px] mt-[2px] text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onReset}
          >
            <X/>
          </Button>
        )}
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: ColumnWithMeta<TData>;
}

function DataTableToolbarFilter<TData>({
                                         column,
                                       }: DataTableToolbarFilterProps<TData>) {
  {
    const columnMeta = column.columnDef.meta as ColumnMeta<TData> | undefined;

    const onFilterRender = React.useCallback(() => {
      if (!columnMeta?.variant) return null;

      switch (columnMeta.variant) {
        case "text":
          return (
            <Input
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="lg:w-56 focus-visible:ring-[0px] pe-9"
            />
          );

        case "number":
          return (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
              />
              {columnMeta.unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {columnMeta.unit}
                </span>
              )}
            </div>
          );
        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}