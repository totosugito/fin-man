import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoMenu } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CiTrash, CiEdit, CiLock } from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter, DataTableViewOptions,
  createRowNumberColumn
} from "@/components/custom/table";
import type { ColumnDef } from "@tanstack/react-table";
import { Text } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  data: Record<string, any>;
  loading: boolean;
  onDeleteClicked: (item: any) => void;
  onEditClicked: (item: any) => void;
  onPasswordChange: (item: any) => void;
  toolbarContent?: React.ReactNode;
  onPaginationChange?: (paginationData: { page: number; limit: number; total?: number; totalPages?: number }) => void;
  paginationData?: {
    page: number; // Current page (1-based)
    limit: number; // Page size
    total: number; // Total row count
    totalPages: number; // Total pages
  };
}

const DataTableUser = ({
  data, loading, onDeleteClicked,
  onEditClicked, onPasswordChange, toolbarContent,
  onPaginationChange, paginationData = { page: 1, limit: 5, total: 0, totalPages: 0 }
}: Props) => {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<User>[]>(() => [
    createRowNumberColumn({ accessorKey: "rowNum", id: "rowNum", paginationData: paginationData }), 
    {
      accessorKey: "name",
      enableSorting: true,
      enableColumnFilter: true,
      header: ({ column }) => {
        return (<div className={"flex w-full justify-center"}><DataTableColumnHeader column={column} title={"Name"}
          className={"justify-center"} />
        </div>)
      },
      cell: ({ cell, row }) => (
        <div>
          <div className={"break-all"}>
            {cell.getValue() as string}
          </div>
          <div className={"break-all text-foreground/70"}>
            {row.original?.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      header: ({ column }) => {
        return (<DataTableColumnHeader column={column} title={"Role"} />)
      },
      cell: ({ cell }) => {
        const role_ = cell.getValue();
        let className;
        if (role_ === "admin") {
          className = "border-red-700 bg-red-300 text-neutral-700";
        } else if (role_ === "user") {
          className = "border-green-700 bg-green-300 text-neutral-700";
        } else {
          className = "border-gray-700 bg-gray-300 text-neutral-700";
        }
        return (
          <Badge className={className}>{role_ as string}</Badge>
        )
      },
    },
    {
      accessorKey: "action",
      size: 60,
      header: "",
      cell: ({ row }) => {
        return (
          <div
            className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={"icon"} disabled={loading}><IoMenu /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEditClicked(row.original)}>
                    <CiEdit /> {t("shared.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPasswordChange(row.original)}>
                    <CiLock /> {t("labels.changePassword")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteClicked(row.original)} className={"text-destructive"}>
                    <CiTrash className={"text-destructive"} /> {t("shared.delete")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    },
  ], [loading]);


  const { table } = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: paginationData.totalPages || -1,
    initialState: {
      columnPinning: { left: ["rowNum", "action"] },
      pagination: { pageIndex: paginationData.page - 1, pageSize: paginationData.limit }, // Convert 1-based to 0-based
    },
    manualSorting: false,
    manualPagination: true,
    onPaginationChange: (updater: any) => {
      const nextPagination = typeof updater === "function" ? updater(table.getState().pagination) : updater;
      
      // Call parent pagination handler if provided
      if (onPaginationChange) {
        onPaginationChange({
          page: nextPagination.pageIndex + 1, // Convert 0-based to 1-based
          limit: nextPagination.pageSize,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
        });
      }
    },
    manualFiltering: false,
    onColumnFiltersChange: (updater: any) => {
      const nextFilters = typeof updater === "function" ? updater(table.getState().columnFilters) : updater;
    },
  });

  return (
    <div className={""}>
      <DataTable 
        table={table} 
        totalRowCount={paginationData.total}
        paginationData={paginationData}
      >
        <div className={"flex flex-row gap-2 justify-between"}>
          <div className={"flex flex-row gap-2"}>
            <DataTableFilter table={table} searchColumnIds={["name", "role"]} searchPlaceholder="Search by name or role..." />
            <DataTableViewOptions table={table} />
          </div>
          {toolbarContent}
        </div>
      </DataTable>
    </div>
  );
}

export default DataTableUser