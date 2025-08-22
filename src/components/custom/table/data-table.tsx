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
      className={cn("flex w-full flex-col gap-2 overflow-hidden", className)}
      {...props}
    >
      {children}
      <div className={cn("w-full overflow-hidden", styles?.container?.default)}>
        <Table className="w-full"
        style={{
          // width: table.getCenterTotalSize(),
          }}
        >
          <TableHeader className="w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        className={cn("bg-[#fafafa] dark:bg-[#28313e] py-1 px-2 border h-10 relative group", styles?.TableHead?.default)}
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

                        {header.column.getCanResize() && (
                          <div
                            {...{
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              className:
                                "absolute top-0 h-full w-0 cursor-col-resize user-select-none touch-none -right-0 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px",
                            }}
                          />
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
                  className="w-full"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("bg-card border py-1 px-2", styles?.TableCell?.default)}
                      style={{
                        ...getCommonPinningStyles({column: cell.column, withBorder: pinned?.withBorder ?? true}),
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
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
