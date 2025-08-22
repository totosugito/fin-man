"use client";

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableFilterProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumnIds?: string[];
}

export function DataTableFilter<TData>({
  table,
  children,
  className,
  searchPlaceholder = "Search...",
  searchColumnIds = [],
  ...props
}: DataTableFilterProps<TData>) {
  const [searchValue, setSearchValue] = React.useState("");

  // Handle global search
  const handleGlobalSearch = (value: string) => {
    setSearchValue(value);

    if (searchColumnIds.length === 0) {
      // If no specific columns provided, search in all string columns
      const stringColumns = table.getAllColumns().filter(column =>
        'accessorFn' in column.columnDef || 'accessorKey' in column.columnDef
      );

      table.setGlobalFilter(value);

      // Also set individual column filters for searchable columns
      stringColumns.forEach(column => {
        column.setFilterValue(value || undefined);
      });
    } else {
      // Search only in specified columns
      searchColumnIds.forEach(columnId => {
        const column = table.getColumn(columnId);
        if (column) {
          column.setFilterValue(value || undefined);
        }
      });
    }
  };

  const onReset = React.useCallback(() => {
    setSearchValue("");
    table.resetColumnFilters();
    table.setGlobalFilter(undefined);
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
      <div className="relative flex-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            className="w-64 pl-8 pr-8 focus-visible:ring-[0px]"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 pt-1 text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground"
              onClick={onReset}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Individual column filters (optional) */}
      {React.Children.count(children) > 0 && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}