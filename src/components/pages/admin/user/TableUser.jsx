import {ColumnHeader, TableData} from "@/components/custom/table/index.ts";
import {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {IoMenu} from "react-icons/io5";
import {Button} from "@/components/ui/button.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import { CiTrash, CiEdit, CiLock } from "react-icons/ci";

const TableUser = ({data, loading, onCreateClicked, onDeleteClicked, onEditClicked, onPasswordChange}) => {
  const {t} = useTranslation();
  const headerClassNames = "";

  const columns = useMemo(() => [
    {
      accessorKey: "#",
      size: 40,
      enableSorting: false,
      disableSortBy: true,
      indexed: true,
      header: ({column}) => {
        return (<ColumnHeader column={column} title={"No"} className={"justify-center"}/>)
      },
      cell: ({row, table}) => {
        return <div
          className="text-center">{(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1}</div>
      },
    },
    {
      accessorKey: "action",
      size: 60,
      enableSorting: false,
      header: ({column}) => {
        return (<ColumnHeader column={column} title={"#"} className={"justify-center"}/>)
      },
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
                  <Separator/>
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
    {
      accessorKey: "name",
      header: "Full Name",
      enableSorting: true,
      size: 150,
      cell: ({cell, row}) => (
        <div>
        <div className={"break-all"}>
          {cell.getValue()}
        </div>
          <div className={"break-all text-foreground/70"}>
            {row.original?.email}
          </div>
        </div>
      )
    },
    {
      accessorKey: "role",
      size: 100,
      enableSorting: true,
      header: ({column}) => {
        return (<ColumnHeader column={column} title={"Role"} className={`${headerClassNames}`}/>)
      },
      cell: ({cell}) => {
        const role_ = cell.getValue();
        let className = "border-gray-700 bg-gray-300 text-neutral-700";
        if (role_ === "admin") {
          className = "border-red-700 bg-red-300 text-neutral-700";
        }
        else if (role_ === "user") {
          className = "border-green-700 bg-green-300 text-neutral-700";
        }
        else {
          className = "border-gray-700 bg-gray-300 text-neutral-700";
        }
        return (
          <Badge className={className}>{role_}</Badge>
        )
      }
    },
  ], [])

  return (
    <div className={""}>
      <TableData columns={columns} data={data?.data || []}
                 toolBarProps={{
                   top: {
                     visible: false
                   },
                   search: {
                     visible: false
                   }
                 //   topLeft:
                 //     <Button variant={"default"} onClick={onCreateClicked} disabled={loading}>
                 //       {loading ? <span className={"animate-spin rounded-full h-3 w-3 border-b-2 border-current"}/> : <LuUserPlus/>} {t("shared.userAdd")}
                 //     </Button>
                 }}
                 tableProps={{
                   containerStyles: "bg-card"
                 }}
                 bodyProps={{
                   cellStyles: "align-middle",
                   rowStyles: "align-middle"
                 }}
                 paginationProps={{
                   pageSize: data?.meta?.limit ?? 10,
                   pageIndex: data?.meta?.page ?? 1,
                   onPageSizeChange: (rowSize, pageIndex) => {
                   },
                   onPageIndexChange: (rowSize, pageIndex) => {
                   }
                 }}
      />
    </div>
  );
}

export default TableUser