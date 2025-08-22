"use client";

import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();

  const handleSort = (direction: 'asc' | 'desc' | 'toggle') => {
    if (direction === 'toggle') {
      // Toggle through sort states: none -> asc -> desc -> none
      if (!isSorted) {
        column.toggleSorting(false);
      } else if (isSorted === 'asc') {
        column.toggleSorting(true);
      } else {
        column.clearSorting();
      }
    } else if (isSorted === direction) {
      column.clearSorting();
    } else {
      column.toggleSorting(direction === 'desc');
    }
    setIsOpen(false);
  };

  if (!canSort) {
    return <div className={cn("flex items-center", className)}>{title}</div>;
  }

  return (
    <div 
      className={cn("group flex items-center space-x-1 cursor-pointer select-none hover:text-foreground transition-colors w-fit", className)}
      onClick={() => handleSort('toggle')}
    >
      <span className="group-hover:text-foreground whitespace-nowrap">{title}</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 group-hover:text-foreground data-[state=open]:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isSorted === 'desc' ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : isSorted === 'asc' ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start ${isSorted === 'asc' ? 'bg-accent' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSort('asc');
              }}
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Sort A → Z
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start ${isSorted === 'desc' ? 'bg-accent' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSort('desc');
              }}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Sort Z → A
            </Button>
            {isSorted && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort('toggle');
                }}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Clear sort
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}