import {useMemo, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {IoMenu} from "react-icons/io5";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {CiTrash, CiEdit, CiLock} from "react-icons/ci";
import {useDataTable} from "@/components/custom/data-table/hooks/use-data-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar
} from "@/components/custom/data-table";
import {Checkbox} from "@/components/ui/checkbox";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Text } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type Props = {
  data: Record<string, any>;
  loading: boolean;
  onCreateClicked: () => void;
  onDeleteClicked: (item: any) => void;
  onEditClicked: (item: any) => void;
  onPasswordChange: (item: any) => void;
}

const DataTableUser = ({data, loading, onCreateClicked, onDeleteClicked, onEditClicked, onPasswordChange}: Props) => {
  const {t} = useTranslation();
  const headerClassNames = "";
  const router = useRouter();

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center gap-3">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />All</div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "id",
      accessorKey: "#",
      size: 40,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"No"} className={"justify-center w-full"}/>)
      },
      cell: ({row, table}) => {
        return <div
          className="text-center">{(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1}</div>
      },
    },
    {
      id: "action",
      accessorKey: "action",
      size: 60,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"#"} className={"justify-center"}/>)
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
      id: "name",
      accessorKey: "name",
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Name"} className={"justify-center"}/>)
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
      },
    },
    {
      id: "role",
      accessorKey: "role",
      size: 100,
      enableSorting: true,
      enableColumnFilter: true,
      header: ({column}) => {
        return (<DataTableColumnHeader column={column} title={"Role"} className={`${headerClassNames}`}/>)
      },
      cell: ({cell}) => {
        const role_ = cell.getValue();
        let className = "border-gray-700 bg-gray-300 text-neutral-700";
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
      }
    },
  ], [t, loading, onEditClicked, onPasswordChange, onDeleteClicked]);

  const [sorting, setSorting] = useState<SortingState>(() => {
    const search = new URLSearchParams(router.state.location.search);
    const sortParam = search.get("sort");
    const orderParam = search.get("order");
    if (sortParam) {
      return [{ id: sortParam, desc: orderParam === "desc" }];
    }
    return [{ id: "name", desc: true }];
  });

  // Update URL when sorting changes
  useEffect(() => {
    const search = new URLSearchParams(router.state.location.search);
    const sortParam = search.get("sort");
    const orderParam = search.get("order");

    // Only update URL if sorting state doesn't match URL params
    if (sorting.length > 0) {
      const currentSortId = sorting[0]?.id;
      const currentSortOrder = sorting[0]?.desc ? "desc" : "asc";

      if (sortParam !== currentSortId || orderParam !== currentSortOrder) {
        const sortParams = {
          sort: currentSortId,
          order: currentSortOrder,
        };

        router.navigate({
          search: (prev) => ({
            ...prev,
            ...sortParams,
          }),
          replace: true,
        });
      }
    } else if (sortParam) {
      // Clear sorting if no sort is active but URL has sort params
      router.navigate({
        search: (prev) => {
          const { sort, order, ...rest } = prev;
          return rest;
        },
        replace: true,
      });
    }
  }, [sorting, router]);

  // Update sorting state when URL changes
  useEffect(() => {
    const search = new URLSearchParams(router.state.location.search);
    const sortParam = search.get("sort");
    const orderParam = search.get("order");

    if (sortParam) {
      const newSorting = [{
        id: sortParam,
        desc: orderParam === "desc",
      }];
      
      // Only update if different to prevent unnecessary re-renders
      if (JSON.stringify(newSorting) !== JSON.stringify(sorting)) {
        setSorting(newSorting);
      }
    } else if (sorting.length > 0) {
      // Clear sorting if URL has no sort params but local state does
      setSorting([]);
    }
  }, [router.state.location.search]);

  const {table} = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: 1,
    initialState: {
      sorting,
      columnPinning: {left: ["action"]},
      pagination: {pageIndex: 0, pageSize: 10},
    },
    manualSorting: true,
    onSortingChange: (updaterOrValue) => {
      // Handle both function and direct value updates
      const newSorting = typeof updaterOrValue === 'function' 
        ? updaterOrValue(sorting)
        : updaterOrValue;
      setSorting(newSorting);
    },
  });

  return (
    <div className={"bg-card p-2"}>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}

export default DataTableUser