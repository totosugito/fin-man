"use client";

import type { Table } from "@tanstack/react-table";
import { Check, ChevronsUpDown, Columns3 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

import type { ColumnMeta } from "./types/types";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  visibleColumns?: string[];
  onApply?: (visibleColumns: string[]) => void;
}

export function DataTableViewOptions<TData>({
  table,
  visibleColumns,
  onApply,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  
  // Initialize pendingVisibility state
  const [pendingVisibility, setPendingVisibility] = React.useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Get columns that can be toggled (not disabled)
  const toggleableColumns = React.useMemo(() => {
    return table.getAllLeafColumns().filter(column => {
      const meta = column.columnDef.meta as ColumnMeta<TData> | undefined;
      return !meta?.disableHiding;
    });
  }, [table]);

  // Initialize or update visibility when table or visibleColumns changes
  React.useEffect(() => {
    const columns = table.getAllLeafColumns();
    const newVisibility: Record<string, boolean> = {};
    
    columns.forEach(column => {
      const meta = column.columnDef.meta as ColumnMeta<TData> | undefined;
      const isVisible = meta?.disableHiding 
        ? true // Always show disabled columns
        : visibleColumns 
          ? visibleColumns.includes(column.id)
          : column.getIsVisible();
      
      newVisibility[column.id] = isVisible;
      
      if (isInitialized) {
        column.toggleVisibility(isVisible);
      }
    });
    
    setPendingVisibility(prev => ({
      ...prev,
      ...newVisibility
    }));
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [table, visibleColumns, isInitialized]);

  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== "undefined" && column.getCanHide(),
        ),
    [table],
  );

  const handleApply = () => {
    // Apply visibility changes
    Object.entries(pendingVisibility).forEach(([columnId, isVisible]) => {
      const column = table.getColumn(columnId);
      if (column) {
        column.toggleVisibility(isVisible);
      }
    });

    // Get all visible columns and notify parent
    const visibleColumns = Object.entries(pendingVisibility)
      .filter(([_, isVisible]) => isVisible)
      .map(([columnId]) => columnId);

    onApply?.(visibleColumns);
    setOpen(false);
  };

  const toggleAllColumns = (value: boolean) => {
    const newVisibility = table.getAllLeafColumns().reduce((acc, column) => {
      acc[column.id] = value;
      return acc;
    }, {} as Record<string, boolean>);
    setPendingVisibility(newVisibility);
  };

  const allColumnsSelected = React.useMemo(() => {
    return table.getAllLeafColumns().every(column => pendingVisibility[column.id]);
  }, [table, pendingVisibility]);

  const someColumnsSelected = React.useMemo(() => {
    const visibleColumns = Object.entries(pendingVisibility).filter(([_, isVisible]) => isVisible);
    return visibleColumns.length > 0 && visibleColumns.length < table.getAllLeafColumns().length;
  }, [table, pendingVisibility]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          className="ml-auto flex"
        >
          <Columns3 />
          View
          <ChevronsUpDown className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => toggleAllColumns(!allColumnsSelected)}
                className="justify-between"
              >
                <div className="flex items-center">
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary",
                    allColumnsSelected || someColumnsSelected ? "bg-primary" : "opacity-50 [&_svg]:invisible"
                  )}>
                    {allColumnsSelected ? (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    ) : someColumnsSelected ? (
                      <div className="h-1 w-2 bg-primary" />
                    ) : null}
                  </div>
                  <span>Select All</span>
                </div>
              </CommandItem>
              <Separator className="my-1" />
              {columns.map((column) => {
                const meta = column.columnDef.meta as ColumnMeta<TData> | undefined;
                return (
                  <CommandItem
                    key={column.id}
                    onSelect={() => {
                      if (meta?.disableHiding) return;
                      setPendingVisibility(prev => ({
                        ...prev,
                        [column.id]: !prev[column.id]
                      }));
                    }}
                    className={cn(
                      "justify-start",
                      meta?.disableHiding && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={meta?.disableHiding}
                  >
                    <div className={cn(
                      "ml-0 flex h-4 w-4 items-center justify-center rounded border",
                      meta?.disableHiding 
                        ? "border-gray-300 bg-gray-100" 
                        : "border-primary",
                      pendingVisibility[column.id] ? "bg-primary" : "opacity-50 [&_svg]:invisible"
                    )}>
                      {meta?.disableHiding ? (
                        <Check className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="truncate">
                      {meta?.label ?? column.id}
                      {meta?.disableHiding && (
                        <span className="ml-2 text-xs text-muted-foreground">(required)</span>
                      )}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-2">
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleApply();
              }}
            >
              Apply
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
