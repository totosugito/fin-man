import React, {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {IoMenu} from "react-icons/io5";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Badge} from "@/components/ui/badge";
import {CiTrash, CiEdit, CiLock} from "react-icons/ci";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableFilter
} from "@/components/custom/table";
import type {ColumnDef} from "@tanstack/react-table";
import {Text} from "lucide-react";
import {getProjectStatusStyle} from "@/lib/app-utils";
import {getDaysFromCurrentDate} from "@/lib/my-utils";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deleted_at: string;
}

type Props = {
  data: Record<string, any>;
  loading: boolean;
  onDeleteClicked: (item: any) => void;
  onEditClicked: (item: any) => void;
  onShowDetail: (id: string) => void;
  toolbarContent?: React.ReactNode
}

export const DataTableView = ({
                                data, loading, onDeleteClicked,
                                onEditClicked, toolbarContent,
                                onShowDetail,
                              }: Props) => {
  const {t} = useTranslation();

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      accessorKey: "#",
      size: 40,
      enableSorting: false,
      indexed: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"No"} className={"justify-center w-full"}/>)
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
        return (<DataTableColumnHeader column={column} title={"Name"} className={"justify-center"}/>)
      },
      cell: ({cell, row}) => (
        <div>
          <div className={"break-all hover:underline cursor-pointer font-semibold"} onClick={() => onShowDetail(row.original?.id)}>
            {cell.getValue() as string}
          </div>
          <div className={"break-all text-foreground/70"}>
            {row.original?.description}
          </div>
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search project name...",
        variant: "text",
        icon: Text,
      },
    },
    {
      accessorKey: "status",
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Status"}/>)
      },
      cell: ({cell}) => {
        const value = cell.getValue() as string;
        const className = getProjectStatusStyle(value);
        return (
          <Badge className={className}>{value}</Badge>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Updated at"}/>)
      },
      cell: ({cell}) => {
        const value = getDaysFromCurrentDate(t, cell.getValue() as string);
        return (
          <div className={"flex flex-col items-center w-fit gap-1"}>
            <Badge className={value?.style}>{value?.labels}</Badge>
            <div className={"text-xs text-foreground/70"}>{value?.value}</div>
          </div>
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
                <DropdownMenuGroup className={"gap-1"}>
                  <DropdownMenuItem onClick={() => onEditClicked(row.original)}>
                    <CiEdit/> {t("shared.edit")}
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
    pageCount: 1,
    initialState: {
      columnPinning: {left: ["action"]},
      pagination: {pageIndex: 0, pageSize: 10},
    },
    manualSorting: false,
  });

  return (
    <div className={""}>
      <DataTable table={table}>
        <DataTableFilter table={table}>
          {toolbarContent}
        </DataTableFilter>
      </DataTable>
    </div>
  );
}
