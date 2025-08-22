import React, {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {IoMenu} from "react-icons/io5";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {Badge} from "@/components/ui/badge";
import {CiTrash, CiEdit, CiLock} from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter, DataTableViewOptions
} from "@/components/custom/table";
import type {ColumnDef} from "@tanstack/react-table";
import {Text} from "lucide-react";

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
  toolbarContent?: React.ReactNode
}

const DataTableUser = ({
                         data, loading, onDeleteClicked,
                         onEditClicked, onPasswordChange, toolbarContent
                       }: Props) => {
  const {t} = useTranslation();

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "#",
      size: 80,
      enableSorting: false,
      indexed: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"No"} className={"justify-center"}/>)
      },
      cell: ({row, table}) => {
        return <div
          className="text-center">{(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1}</div>
      },
    },
    {
      accessorKey: "name",
      enableSorting: true,
      header: ({column}) => {
        return (<div className={"flex w-full justify-center"}><DataTableColumnHeader column={column} title={"Name"}
                                                                                     className={"justify-center"}/>
        </div>)
      },
      cell: ({cell, row}) => (
        <div>
          <div className={"break-all"}>
            {cell.getValue() as string}
          </div>
          <div className={"break-all text-foreground/70"}>
            {row.original?.email}
          </div>
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search name...",
        variant: "text",
        icon: Text,
        disableHiding: true,
      },
    },
    {
      accessorKey: "role",
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Role"}/>)
      },
      cell: ({cell}) => {
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
      cell: ({row}) => {
        return (
          <div
            className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={"icon"} disabled={loading}><IoMenu/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEditClicked(row.original)}>
                    <CiEdit/> {t("shared.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPasswordChange(row.original)}>
                    <CiLock/> {t("labels.changePassword")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onClick={() => onDeleteClicked(row.original)} className={"text-destructive"}>
                    <CiTrash className={"text-destructive"}/> {t("shared.delete")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    },
  ], [loading]);


  const {table} = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: -1,
    initialState: {
      columnPinning: {left: ["action"]},
      pagination: {pageIndex: 0, pageSize: 5},
    },
    manualSorting: false,
    manualPagination: false,
    onPaginationChange: (updater: any) => {
      const next = typeof updater === "function" ? updater(table.getState().pagination) : updater;
    }
  });

  return (
    <div className={""}>
      <DataTable table={table}>
        <div className={"flex flex-row gap-2 justify-between"}>
          <div className={"flex flex-row gap-2"}>
            <DataTableFilter table={table}/>
            <DataTableViewOptions table={table}/>
          </div>
          {toolbarContent}
        </div>
      </DataTable>
    </div>
  );
}

export default DataTableUser