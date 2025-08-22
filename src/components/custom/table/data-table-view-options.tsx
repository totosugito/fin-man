"use client";

import type { Table } from "@tanstack/react-table";
import { Check, ChevronsUpDown, Settings2, X } from "lucide-react";
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

// Add this type definition for column meta
interface ColumnMeta {
  label?: string;
  initialVisible?: boolean;
}

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  defaultVisibleColumns?: string[];
  onApply?: (visibleColumns: string[]) => void;
}

export function DataTableViewOptions<TData>({
  table,
  defaultVisibleColumns,
  onApply,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [pendingVisibility, setPendingVisibility] = React.useState<Record<string, boolean>>({});

  // Initialize pending visibility state
  React.useEffect(() => {
    const initialVisibility = table.getAllLeafColumns().reduce((acc, column) => {
      acc[column.id] = column.getIsVisible();
      return acc;
    }, {} as Record<string, boolean>);
    setPendingVisibility(initialVisibility);
  }, [table]);
  // Set initial column visibility based on meta.initialVisible and notify parent
  React.useEffect(() => {
    table.getAllLeafColumns().forEach(column => {
      const meta = column.columnDef.meta as ColumnMeta | undefined;
      if (meta?.initialVisible !== undefined) {
        column.toggleVisibility(meta.initialVisible);
      }
    });
  }, [table]);

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

  const handleReset = () => {
    // Use provided defaultVisibleColumns or fall back to all columns
    const columnsToShow = defaultVisibleColumns || table.getAllLeafColumns().map(col => col.id);

    // Create a new visibility state based on defaultVisibleColumns
    const newVisibility = table.getAllLeafColumns().reduce((acc, column) => {
      const shouldBeVisible = columnsToShow.includes(column.id);
      // Update the table's column visibility
      column.toggleVisibility(shouldBeVisible);
      // Update our local state
      acc[column.id] = shouldBeVisible;
      return acc;
    }, {} as Record<string, boolean>);

    // Update the pending visibility state
    setPendingVisibility(newVisibility);
    
    // Trigger onApply with the default visible columns
    onApply?.(columnsToShow);
    setOpen(false);
  };

  const toggleAllColumns = (value: boolean) => {
    const newVisibility = { ...pendingVisibility };
    Object.keys(newVisibility).forEach(key => {
      newVisibility[key] = value;
    });
    setPendingVisibility(newVisibility);
  };

  const allColumnsSelected = React.useMemo(() => {
    return Object.values(pendingVisibility).every(Boolean);
  }, [pendingVisibility]);

  const someColumnsSelected = React.useMemo(() => {
    return Object.values(pendingVisibility).some(Boolean) && !allColumnsSelected;
  }, [pendingVisibility, allColumnsSelected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
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
                    allColumnsSelected || someColumnsSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                  )}>
                    {allColumnsSelected ? (
                      <Check className="h-4 w-4" />
                    ) : someColumnsSelected ? (
                      <div className="h-1 w-2 bg-primary" />
                    ) : null}
                  </div>
                  <span>Select All</span>
                </div>
              </CommandItem>
              <Separator className="my-1" />
              {columns.map((column) => {
                const meta = column.columnDef.meta as ColumnMeta | undefined;
                return (
                  <CommandItem
                    key={column.id}
                    onSelect={() => {
                      setPendingVisibility(prev => ({
                        ...prev,
                        [column.id]: !prev[column.id]
                      }));
                    }}
                    className="justify-between"
                  >
                    <span className="truncate">
                      {meta?.label ?? column.id}
                    </span>
                    <div className={cn(
                      "ml-2 flex h-4 w-4 items-center justify-center rounded border border-primary",
                      pendingVisibility[column.id] ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-4 w-4" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-between border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 px-2 lg:px-3"
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
