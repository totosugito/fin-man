import {
  ColumnDef,
  ExpandedState,
  Row,
} from "@tanstack/react-table";
import React, {useEffect, useMemo, useState} from "react";
import {ProjectMember} from "@/lib/project-utils";
import {DataTable, DataTableColumnHeader, useDataTable} from "@/components/custom/table";
import {FolderIcon, FolderDownIcon, FolderInputIcon, FileIcon} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {EnumProjectEventType} from "backend/src/db/schema";
import {CostView} from "./CostView";

type Props = {
  defaultCurrency: string;
  data: any;
  onCreateGroup: (item: any) => void;
  onCreateEvent: (item: any) => void;
  onDeleteData: (item: any) => void;
  onUpdateData: (item: any) => void;
};

export const DataTableView = ({
                                defaultCurrency = "", data, onCreateGroup,
                                onCreateEvent, onDeleteData, onUpdateData
                              }: Props) => {
  const iconSize = 18;
  const styleFolder = "text-blue-500";
  const [maxDepth, setMaxDepth] = useState(1);

  useEffect(() => {
    setMaxDepth(data?.maxDepth || 1);
  }, [data?.maxDepth]);

  const columns = useMemo<ColumnDef<ProjectMember>[]>(() => {
    return [
      {
        accessorKey: "name",
        enableSorting: true,
        header: ({column}) => {
          return (<DataTableColumnHeader column={column} title={"Name"} className={""}/>)
        },
        cell: ({cell, row}: { cell: any; row: Row<ProjectMember> }) => {
          const eventType = row.original?.eventType;
          const isFolder = eventType === EnumProjectEventType.folder;
          return (
            <ContextMenu>
              <ContextMenuTrigger asChild className="w-full h-full">
                <div className="flex items-center gap-1" style={{paddingLeft: `${row.depth * 1.8}rem`}}>
                  {row.getCanExpand() && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation(); // prevent context menu
                        row.getToggleExpandedHandler()?.();
                      }}
                      className="cursor-pointer"
                    >
                  <span className={styleFolder}>
                    {row.getIsExpanded() ? (
                      <FolderDownIcon size={iconSize}/>
                    ) : (
                      <FolderInputIcon size={iconSize}/>
                    )}
                  </span>
                    </div>
                  )}

                  <div className={"flex flex-row gap-1 items-center"}>
                    {isFolder ? (row.getCanExpand() ? "" : <FolderIcon size={iconSize} className={styleFolder}/>) : <FileIcon size={iconSize}/>}
                    <span className={isFolder ? "font-semibold" : ""}>{cell.getValue() as string}</span>
                  </div>
                </div>

              </ContextMenuTrigger>
              <ContextMenuContent className="w-40">
                {isFolder &&
                  <>
                    <ContextMenuItem onClick={() => onCreateGroup(row.original)}>
                      New Group
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateEvent(row.original)}>
                      New Event
                    </ContextMenuItem>
                  </>
                }
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
          );
        },
      },
      {
        accessorKey: "cost.budgetIncome",
        enableSorting: true,
        size: 100,
        header: ({column}) => {
          return (<DataTableColumnHeader column={column} title={"Budget Income"} className={"w-full flex-1 justify-end"}/>)
        },
        cell: ({row}: { cell: any; row: Row<ProjectMember> }) => {
          return (<CostView
            maxDepth={maxDepth}
            currency={defaultCurrency}
            cell={row.original}
            objKey={"budgetIncome"}
            objKeyCurrency={"budgetIncomeCurrency"}
          />)
        }
      },
      {
        accessorKey: "cost.budgetExpense",
        enableSorting: true,
        size: 100,
        header: ({column}) => {
          return (<DataTableColumnHeader column={column} title={"Budget Expense"} className={"w-full flex-1 justify-end"}/>)
        },
        cell: ({row}: { cell: any; row: Row<ProjectMember> }) => {
          return (<CostView
            maxDepth={maxDepth}
            currency={defaultCurrency}
            cell={row.original}
            objKey={"budgetExpense"}
            objKeyCurrency={"budgetExpenseCurrency"}
          />)
        }
      },
      {
        accessorKey: "cost.realIncome",
        enableSorting: true,
        size: 100,
        header: ({column}) => {
          return (<DataTableColumnHeader column={column} title={"Real Income"} className={"w-full flex-1 justify-end"}/>)
        },
        cell: ({row}: { cell: any; row: Row<ProjectMember> }) => {
          return (<CostView
            maxDepth={maxDepth}
            currency={defaultCurrency}
            cell={row.original}
            objKey={"realIncome"}
            objKeyCurrency={"realIncomeCurrency"}
          />)
        }
      },
      {
        accessorKey: "cost.realExpense",
        enableSorting: true,
        size: 100,
        header: ({column}) => {
          return (<DataTableColumnHeader column={column} title={"Real Expense"} className={"w-full flex-1 justify-end"}/>)
        },
        cell: ({row}: { cell: any; row: Row<ProjectMember> }) => {
          return (<CostView
            maxDepth={maxDepth}
            currency={defaultCurrency}
            cell={row.original}
            objKey={"realExpense"}
            objKeyCurrency={"realExpenseCurrency"}
          />)
        }
      },
    ];
  }, []);

  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const {table} = useDataTable({
    data: data?.events || [],
    columns,
    getSubRows: (row) => row?.children,
    pageCount: 1,
    initialState: {
      columnPinning: {left: ["action"]},
      pagination: {pageIndex: 0, pageSize: 20},
      expanded: expanded,
    },
    onExpandedChange: setExpanded,
    manualSorting: false,
    manualExpanding: false,
    manualPagination: false,
  });

  return (
    <div className={"bg-card"}>
      <DataTable table={table}>
      </DataTable>
    </div>
  )
};
