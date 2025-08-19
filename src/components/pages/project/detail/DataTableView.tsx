import {
  ColumnDef,
  ExpandedState,
  Row,
} from "@tanstack/react-table";
import {useMemo, useState} from "react";
import {ProjectMember} from "@/lib/project-utils";
import {DataTable, useDataTable} from "@/components/custom/table";
import {ChevronRight, ChevronDown} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {EnumProjectEventType} from "backend/src/db/schema";

type Props = {
  data: any,
  onCreateGroup: (item: any) => void,
  onDeleteData: (item: any) => void,
  onUpdateData: (item: any) => void,
}

export const DataTableView = ({data, onCreateGroup, onDeleteData, onUpdateData}: Props) => {


  const columns = useMemo<ColumnDef<ProjectMember>[]>(() => {
    return [
      {
        header: "name",
        accessorKey: "name",
        cell: ({cell, row}: { cell: any, row: Row<ProjectMember> }) => {
          const eventType = row.original?.eventType;
          const isFolder = eventType === EnumProjectEventType.folder;
          return (
            <div className="flex items-center justify-between group" style={{paddingLeft: `${row.depth * 1.8}rem`}}>
              <div className="flex items-center gap-1">
                {row.getCanExpand() && (
                  <div
                    onClick={row.getToggleExpandedHandler()}
                    className="cursor-pointer"
                  >
                  <span className="text-muted-foreground">
                    {row.getIsExpanded() ? <ChevronRight size={15}/> : <ChevronDown size={15}/>}
                  </span>
                  </div>
                )}
                <span>{cell.getValue() as string}</span>
              </div>

              <ContextMenu>
                <ContextMenuTrigger className="w-full h-full">
                  <div className="w-full h-full absolute inset-0"/>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                  {isFolder && <ContextMenuItem onClick={() => onCreateGroup(row.original)}>
                    New Group
                  </ContextMenuItem>
                  }
                  <ContextMenuItem onClick={() => console.log('Insert clicked', row.original)}>
                    New Event
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onUpdateData(row.original)}>
                    Edit
                  </ContextMenuItem>
                  <ContextMenuSeparator/>
                  <ContextMenuItem
                    onClick={() => onDeleteData(row.original)}
                    className="text-red-600 focus:text-red-600"
                  >
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          )
        }
      },
      {
        header: "budgetIncome",
        accessorKey: "cost.budgetIncome"
      },
      {
        header: "budgetExpense",
        accessorKey: "cost.budgetExpense"
      },
      {
        header: "realIncome",
        accessorKey: "cost.realIncome"
      },
      {
        header: "realExpense",
        accessorKey: "cost.realExpense"
      }
    ];
  }, []);

  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const {table} = useDataTable({
    data: data || [],
    columns,
    getSubRows: (row) => row?.subRows,
    pageCount: 1,
    initialState: {
      columnPinning: {left: ["action"]},
      pagination: {pageIndex: 0, pageSize: 10},
      expanded: expanded
    },
    onExpandedChange: setExpanded,
    manualSorting: false,
    manualExpanding: false
  });


  return (
    <div>
      <DataTable table={table}>
      </DataTable>
    </div>
  )
}