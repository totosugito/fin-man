import {flexRender, type Table as TanstackTable} from "@tanstack/react-table";
import type * as React from "react";
import {DataTablePagination} from "./data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {getCommonPinningStyles} from "./lib/data-table";
import {cn} from "@/lib/utils";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  pinned?: {
    withBorder?: boolean
  },
  styles?: {
    container: {
      default?: string,
    }
    TableHead?: {
      default?: string,
    }
    TableCell?: {
      default?: string,
    }
  }
}

export function DataTable<TData>({
                                   table,
                                   actionBar,
                                   children,
                                   className,
                                   pageSizeOptions,
                                   pinned,
                                   styles,
                                   ...props
                                 }: DataTableProps<TData> & { pageSizeOptions?: number[] }) {
  const rowLength = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div
      className={cn("flex w-full flex-col gap-2 overflow-auto", className)}
      {...props}
    >
      {children}
      <div className={cn("overflow-hidden", styles?.container?.default)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        className={cn("bg-[#fafafa] dark:bg-[#28313e] py-1 pl-4 pr-1 border", styles?.TableHead?.default)}
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          ...getCommonPinningStyles({column: header.column, withBorder: pinned?.withBorder ?? true}),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </TableHead>
                    )
                  }
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("bg-card border py-1", styles?.TableCell?.default)}
                      style={{
                        ...getCommonPinningStyles({column: cell.column, withBorder: pinned?.withBorder ?? true}),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2">
        <DataTablePagination
          pageIndex={table.getState().pagination.pageIndex}
          setPageIndex={table.setPageIndex}
          pageSize={table.getState().pagination.pageSize}
          setPageSize={table.setPageSize}
          rowsCount={table.getRowCount()}
          pageSizeOptions={pageSizeOptions}
        />

        {(actionBar && (rowLength > 0)) && actionBar}
      </div>
    </div>
  );
}
