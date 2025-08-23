"use client";

import type { Table } from "@tanstack/react-table";
import { Search, CircleXIcon } from "lucide-react";
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
    
    // If table has manual filtering enabled, only update the filter state
    // The parent component will handle the actual filtering via onColumnFiltersChange
    if (table.options.manualFiltering) {
      if (searchColumnIds.length === 0) {
        table.setGlobalFilter(value || undefined);
      } else {
        // For manual filtering with specific columns, set a special filter
        table.setColumnFilters([{ id: 'search', value: value || undefined }]);
      }
      return;
    }

    // Original automatic filtering logic for non-manual tables
    if (searchColumnIds.length === 0) {
      table.setGlobalFilter(value || undefined);
    } else {
      table.setGlobalFilter(undefined);
      table.resetColumnFilters();
      
      if (value) {
        const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
          return searchColumnIds.some(colId => {
            const cellValue = row.getValue(colId);
            if (cellValue == null) return false;
            
            return String(cellValue)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          });
        };
        
        table.options.globalFilterFn = globalFilterFn;
        table.setGlobalFilter(value);
      }
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
              <CircleXIcon className="h-4 w-4" />
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