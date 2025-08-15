import React from "react";
import {
  flexRender,
  getCoreRowModel, getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import {useEffect, useState} from "react";
import TablePagination from "./PaginationData.jsx"
import TableSearch from "./Search.jsx"
import TableRowsPerPage, {SHOW_ALL_KEY} from "./RowsPerPage.jsx"
import {useTranslation} from "react-i18next";
import {MdCheck, MdCheckBox, MdCheckBoxOutlineBlank, MdSearch, MdSearchOff} from "react-icons/md";
import ColumnHeader from "./ColumnHeader.jsx";
import {Button} from "@/components/ui/button.js";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.js";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.js";
import {cn} from "@/lib/utils.js";
import {CiTrash} from "react-icons/ci";
import {showNotifError} from "@/lib/show-notif.js";

const ACTION_LIST = {
  selectAll: "Select All",
  selectNone: "Select None",
  deleteSelected: "Delete Selected",
}

const TableData = ({
                     columns, data,
                     tableProps,
                     headerProps,
                     bodyProps,
                     toolBarProps,
                     paginationProps,
                     pinColumns,
                     ...props
                   }) => {
  const defaultTableProps = {
    containerStyles: "",
    containerTableStyles: "",
    tableStyles: "",
    tableLayout: "fixed", // fixed, auto
  }
  const defaultHeaderProps = {
    visible: true,
    rowStyles: "",
    columnStyles: "",
    cellStyles: "",
    sticky: true,
  }
  const defaultBodyProps = {
    rowStyles: "",
    cellStyles: "",
  }
  const defaultToolBarProps = {
    buttonStyle: "",
    actionToolbar: false,
    actionButtons: false,
    topLeft: null,
    topRight: null,
    bottomLeft: null,
    top: {
      visible: true,
      className: "",
    },
    bottom: {
      visible: true,
      className: "",
    },
    search: {
      visible: true,
      placeholder: "Search...",
    },
  }
  const defaultPaginationProps = {
    pageIndex: 0,
    pageSize: 5,
    paginationList: [5, 10, 20, 50],
    paginationShowAll: true,
    usePagination: false,
    totalRows: 0,
    onPageSizeChange: (pageSize) => {
      if (props.onPageSizeChange) {
        props.onPageSizeChange(pageSize);
      }
    },
    onPageIndexChange: (pageIndex) => {
      if (props.onPageIndexChange) {
        props.onPageIndexChange(pageIndex);
      }
    },
  }
  const tableProps_ = {...defaultTableProps, ...tableProps};
  const headerProps_ = {...defaultHeaderProps, ...headerProps};
  const bodyProps_ = {...defaultBodyProps, ...bodyProps};
  const toolBarProps_ = {...defaultToolBarProps, ...toolBarProps};
  const paginationProps_ = {...defaultPaginationProps, ...paginationProps};

  const {t} = useTranslation();
  const [sorting, setSorting] = useState([]);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(paginationProps_?.pageSize ?? 5); // Default rows per page
  const [pageIndex, setPageIndex] = useState(paginationProps_?.pageIndex ?? 0); // Track current page
  const [searchQuery, setSearchQuery] = useState(''); // Track search query
  const [showSearchView, setShowSearchView] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [totalRows, setTotalRows] = useState(0);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectRowsAction, setSelectRowsAction] = useState(false);

  useEffect(() => {
    let totalRows_;
    if (paginationProps_?.usePagination === true) {
      totalRows_ = paginationProps_?.totalRows;
    } else {
      totalRows_ = data.length;
    }
    setTotalRows(totalRows_);

    const totalPages = Math.ceil(totalRows_ / tableRowsPerPage);
    if (pageIndex >= totalPages) {
      setPageIndex(0);
    }
  }, [tableRowsPerPage, pageIndex, data]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    onColumnPinningChange: () => {
    }, // Optional, if you want to make it dynamic
    getPinnedColumns: true,
    state: {
      expanded,
      sorting,
      globalFilter: searchQuery,
      columnPinning: {
        left: pinColumns?.left ?? [], // <-- Freeze "name" column to the left
        right: pinColumns?.right ?? []       // You can also freeze to the right
      },
      pagination: (paginationProps_?.usePagination === true) ?
        {
          pageIndex: 0,
          pageSize: tableRowsPerPage
        } : {
          pageIndex,
          pageSize: tableRowsPerPage
        }
    },
    onGlobalFilterChange: setSearchQuery, // Change setGlobalFilter to setSearchQuery
    onPaginationChange: (updater) => {
      // This code automatically compute the page index relative by computation the current index and the total page size (rowsPerPage)
      // const newPagination = typeof updater === "function" ? updater({
      //   pageIndex,
      //   pageSize: tableRowsPerPage
      // }) : updater;

      // // Dynamically check if pageSize equals the total row count
      // if (newPagination.pageSize === totalRows) {
      //   newPagination.pageIndex = 0;
      // }

      // setPageIndex(newPagination.pageIndex);
      // setTableRowsPerPage(newPagination.pageSize);
      // paginationProps_.onPageSizeChange(newPagination.pageSize, newPagination.pageIndex);
    }
  })

  const onActionChanged = (v) => {
    // e.preventDefault();
    if (v === ACTION_LIST.selectAll) {
      table.toggleAllPageRowsSelected(true);
      props?.onActionChanged(ACTION_LIST.selectAll, []);
    } else if (v === ACTION_LIST.selectNone) {
      table.toggleAllPageRowsSelected(false);
      props?.onActionChanged(ACTION_LIST.selectNone, []);
    } else if (v === ACTION_LIST.deleteSelected) {
      const selected_ = table.getSelectedRowModel().rows.map((row) => row.original);

      if(selected_.length === 0) {
        showNotifError({message: "Please select at least one row"});
        return;
      }
      props?.onActionChanged(ACTION_LIST.deleteSelected, selected_);
    }
    setSelectedAction("");
  }
  return (
    <div
      className={cn("flex flex-col rounded-lg w-full overflow-auto gap-2", tableProps_?.containerStyles)}>
      {toolBarProps_.top.visible &&
        <div className={cn("flex justify-between items-center gap-2 px-1 py-1 ", toolBarProps_.top.className)}>
          {
            toolBarProps_.actionToolbar &&
            <Select defaultValue={selectedAction} onValueChange={(value) => onActionChanged(value)} value={selectedAction}>
              <SelectTrigger className="">
                <SelectValue placeholder="Select an action"/>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ACTION_LIST.selectNone}>{t("labels.selectNone")}</SelectItem>
                  <SelectItem value={ACTION_LIST.selectAll}>{t("labels.selectAll")}</SelectItem>
                  <SelectItem value={ACTION_LIST.deleteSelected}>{t("labels.deleteSelected")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          }
          {
            toolBarProps_.actionButtons &&
            <div className={"flex flex-row gap-2"}>
              <Button variant={"outline"} className={cn("", toolBarProps_.buttonStyle)} onClick={(event) => {
                event.preventDefault();
                setSelectRowsAction(!selectRowsAction);
                selectRowsAction ? onActionChanged(ACTION_LIST.selectNone) : onActionChanged(ACTION_LIST.selectAll);
              }}>
                {selectRowsAction ? <MdCheckBoxOutlineBlank className={"text-lg"}/> : <MdCheck className={"text-lg"}/>}
                {selectRowsAction ? "Uncheck" : "Check"}
                  </Button>
              <Button variant={"outline"} className={cn("text-destructive", toolBarProps_.buttonStyle)} onClick={(event) => {
                event.preventDefault();
                onActionChanged(ACTION_LIST.deleteSelected);
                table.resetRowSelection();
              }}>
                <CiTrash className={"text-lg"}/> Delete
              </Button>
            </div>
          }

          <div>{toolBarProps_.topLeft}</div>

          <div className={"flex flex-row gap-2"}>
            <div>{toolBarProps_.topRight}</div>
            {showSearchView && <TableSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                            placeholder={toolBarProps_.search.placeholder}/>}
            {toolBarProps_.search.visible &&
              <Button variant={"outline"} size={"icon"} className={cn("", toolBarProps_.buttonStyle)}
                      onClick={(event) => {
                        event.preventDefault();
                        setShowSearchView((!showSearchView))
                      }}>{showSearchView ? <MdSearchOff className={"text-lg"}/> :
                <MdSearch className={"text-lg"}/>}</Button>}
          </div>
        </div>
      }

      <div className={cn("overflow-auto w-full [&>div]:max-h-[calc(100vh-150px)]", tableProps_?.containerTableStyles)}>
        <Table className={cn("", tableProps_.tableStyles)}>
          {headerProps_.visible ?
            <TableHeader className={cn(
              headerProps_?.sticky === true ? "sticky top-0 z-10" : "")}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}
                          className={cn(
                            "font-bold border-t-[1px] border-b-[1px] bg-muted/50",
                            headerProps_.rowStyles
                          )}>

                  {headerGroup.headers.map((header, index) => {

                    const isPinnedLeft = header.column.getIsPinned() === 'left';
                    const isPinnedRight = header.column.getIsPinned() === 'right';

                    return (
                      <TableHead key={header.id}
                                 colSpan={header.colSpan}
                                 style={{
                                   left: header.column.getIsPinned() === "left" ? header.column.getStart() : undefined,
                                   right: header.column.getIsPinned() === "right" ? 0 : undefined,
                                   width: header.column.getSize(),
                                   // maxWidth: header.column.getSize(),
                                   // minWidth: header.column.getSize(),
                                 }}
                                 className={cn(
                                   "border-l-[1px] border-r-[1px] p-1",
                                   isPinnedLeft ? "sticky left-0 z-10 bg-background" : "",
                                   isPinnedRight ? "sticky right-0 z-10 bg-background" : "",
                                   headerProps_.columnStyles)}

                      >
                        {
                          header.isPlaceholder ? null :
                            <div
                              style={{minWidth: header.getSize()}}
                              className={cn("flex flex-row w-full", headerProps_.cellStyles)}>
                              {
                                flexRender(
                                  typeof header.column.columnDef.header === "string" ? (props) =>
                                      (<ColumnHeader column={header.column} title={header.column.columnDef.header} {...props}/>) :
                                    header.column.columnDef.header,
                                  header.getContext()
                                )
                              }
                            </div>
                        }
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader> :
            <TableHeader className={""}>
            </TableHeader>
          }
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    // key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn("", bodyProps_.rowStyles)}>
                    {row.getVisibleCells().map((cell) => {
                        const isPinnedLeft = cell.column.getIsPinned() === 'left';
                        const isPinnedRight = cell.column.getIsPinned() === 'right';

                        return (
                          <TableCell key={cell.id}
                                     className={cn(
                                       isPinnedLeft && "sticky left-0 z-0 bg-background",
                                       isPinnedRight && "sticky right-0 z-0 bg-background",
                                       "border-l-[1px] border-r-[1px] border-b-[1px] align-top py-1", bodyProps_.cellStyles)}
                                     style={{
                                       left: cell.column.getIsPinned() === "left" ? cell.column.getStart() : undefined,
                                       right: cell.column.getIsPinned() === "right" ? 0 : undefined,
                                       // width: cell.column.getSize(),
                                     }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      }
                    )}
                  </TableRow>

                  {/* Expanded Content Row (Uses renderDetailPanel) */}
                  {row.getIsExpanded() && (
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      <TableCell colSpan={columns.length}
                                 className={cn("border-l-[1px] border-r-[1px] border-b-[1px] align-top", bodyProps_.cellStyles)}>
                        {props?.renderDetailPanel(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("shared.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {(toolBarProps_.bottom.visible && (totalRows > paginationProps_.paginationList?.[0])) &&
        <div className="flex items-center justify-between pb-1 px-1">
          <div className={""}>{toolBarProps_.bottomLeft}</div>
          <div className={"w-full"}></div>
          <div
            className={`flex gap-4 ${table.getFilteredRowModel().rows.length > tableRowsPerPage ? "flex-col sm:flex-row" : "flex-row"}`}>
            <TableRowsPerPage rowsPerPage={tableRowsPerPage}
                              paginationShowAll={paginationProps_.paginationShowAll}
                              paginationList={paginationProps_.paginationList}
                              onPageSizeChange={(e) => {
                                let value = Number(e);
                                if (e === SHOW_ALL_KEY) {
                                  value = totalRows;
                                }
                                setTableRowsPerPage(value);

                                setPageIndex(0);
                                table.setPageSize(value); // Update the page size in TanStack Table
                                paginationProps_.onPageSizeChange(value, 0);
                              }}
            />
            <TablePagination
              rowsCount={paginationProps_?.usePagination ? paginationProps_?.totalRows : table.getFilteredRowModel().rows.length}
              pageIndex={pageIndex} setPageIndex={setPageIndex}
              rowsPerPage={tableRowsPerPage} paginationList={paginationProps_.paginationList}
              onPageIndexChange={(pageIndex_) => {
                paginationProps_.onPageIndexChange(tableRowsPerPage, pageIndex_);
              }}
            />
          </div>
        </div>
      }
    </div>
  );
}
export default TableData
