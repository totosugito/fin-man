import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {cn} from "@/lib/utils";
import React from "react";
import {useTranslation} from "react-i18next";
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink} from "@/components/ui/pagination";

interface DataTablePaginationProps extends React.ComponentProps<"div"> {
  pageIndex: number;
  setPageIndex: (pageIndex: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  rowsCount: number;
  pageSizeOptions?: number[];
  paginationData?: { // Optional pagination object for manual pagination
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPaginationChange?: (paginationData: { page: number; limit: number; total: number; totalPages: number }) => void;
}

export function DataTablePagination({
                                             pageIndex, setPageIndex, pageSize, setPageSize,
                                             rowsCount,
                                             pageSizeOptions = [5, 10, 20, 30, 40, 50],
                                             paginationData,
                                             onPaginationChange,
                                             className,
                                           }: DataTablePaginationProps) {

  const {t} = useTranslation();
  const maxDisplayedPages = 1; // Number of pages to show before and after the current page
  
  // Use pagination object data when available (for manual pagination)
  const currentPageIndex = paginationData ? paginationData.page - 1 : pageIndex; // Convert 1-based to 0-based
  const currentPageSize = paginationData ? paginationData.limit : pageSize;
  const totalRowsCount = paginationData ? paginationData.total : rowsCount;
  const pageCount = paginationData ? paginationData.totalPages : Math.ceil(rowsCount / pageSize);
  
  // Handle page changes
  const handlePageChange = (newPageIndex: number) => {
    if (paginationData && onPaginationChange) {
      // For manual pagination, use callback with pagination object
      onPaginationChange({
        page: newPageIndex + 1, // Convert 0-based to 1-based
        limit: currentPageSize,
        total: paginationData.total,
        totalPages: paginationData.totalPages,
      });
    } else {
      // For automatic pagination, use TanStack Table methods
      setPageIndex(newPageIndex);
    }
  };
  
  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    if (paginationData && onPaginationChange) {
      // For manual pagination, use callback with pagination object
      onPaginationChange({
        page: 1, // Reset to first page when changing page size
        limit: newPageSize,
        total: paginationData.total,
        totalPages: Math.ceil(paginationData.total / newPageSize),
      });
    } else {
      // For automatic pagination, use TanStack Table methods
      setPageSize(newPageSize);
    }
  };

  const generatePageNumbers = (): number[] => {
    const pageNumbers_ = [];

    // Show pages before and after the current page index
    for (let i = 0; i < pageCount; i++) {
      pageNumbers_.push(i);
    }

    // Add ellipses when necessary
    const filteredPageNumbers = [];

    // set left pagination
    let idxLeftStart = (currentPageIndex - maxDisplayedPages) < 0 ? 0 : (currentPageIndex - maxDisplayedPages);
    let addToTheRight = (currentPageIndex - idxLeftStart) < maxDisplayedPages ? (maxDisplayedPages - (currentPageIndex - idxLeftStart)) : 0;
    let idxRightPos = currentPageIndex + maxDisplayedPages + addToTheRight + 1;
    let idxLeftEnd = idxRightPos >= pageCount ? pageCount : idxRightPos;
    if ((idxLeftEnd - idxLeftStart) < (maxDisplayedPages * 2 + 1)) {
      idxLeftStart = (idxLeftEnd - (maxDisplayedPages * 2) - 1) < 0 ? 0 : (idxLeftEnd - (maxDisplayedPages * 2) - 1);
    }

    // --------------------------------------------------------------------------------
    // ADD PAGINATION
    // --------------------------------------------------------------------------------
    // add start pagination
    if (idxLeftStart > 0) {
      filteredPageNumbers.push(pageNumbers_[0]);
      if ((idxLeftStart + 1) > 2) {
        filteredPageNumbers.push(-1);
      }
    }

    // add center pagination
    for (let j = idxLeftStart; j < idxLeftEnd; j++) {
      filteredPageNumbers.push(pageNumbers_[j]);
    }

    // add end pagination
    if (idxLeftEnd < pageCount) {
      if (idxLeftEnd < pageCount) {
        filteredPageNumbers.push(-1);
      }
      filteredPageNumbers.push(pageNumbers_[pageCount - 1]);
    }
    return filteredPageNumbers;
  }

  const pageNumbers = generatePageNumbers();
  let startIndex = (currentPageSize * currentPageIndex) + 1;
  if (startIndex >= totalRowsCount) {
    startIndex = 1;
  }

  const endIndex = Math.min(startIndex + currentPageSize - 1, totalRowsCount);
  const totalPages = pageNumbers.length;

  return (
    <div className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto sm:flex-row sm:gap-8",
        className,
      )}>
      <div>
        <div className="flex items-center justify-center text-sm text-foreground">
          {t("labels.row")} {totalRowsCount > 0 ? startIndex : 0}<span className={"text-foreground px-[2px]"}>-</span>
          {endIndex}<span className={"text-foreground px-[2px]"}>{t("labels.of")}</span>
          {totalRowsCount}
        </div>
        {/*<div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">*/}
        {/*  {table.getFilteredSelectedRowModel().rows.length} of{" "}*/}
        {/*  {table.getFilteredRowModel().rows.length} row(s) selected.*/}
        {/*</div>*/}
      </div>

      {(totalRowsCount >= (pageSizeOptions?.[0] ?? 5)) &&
        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <Select
              value={`${currentPageSize}`}
              onValueChange={(value) => {
                handlePageSizeChange(Number(value));
              }}
            >
              <SelectTrigger className="w-[8.0rem]">
                <SelectValue placeholder={currentPageSize}/>
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent className="inline-flex gap-0 -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
              {(totalPages > 0) &&
                pageNumbers.map((page: number, index: number) => (
                  <PaginationItem key={index} className="[&:first-child>a]:rounded-s-md [&:last-child>a]:rounded-e-md">
                    {page < 0 ? <PaginationEllipsis/> :
                      <PaginationLink 
                      // className="rounded-none shadow-none focus-visible:z-10 aria-disabled:pointer-events-none [&[aria-disabled]>svg]:opacity-50"
                        isActive={currentPageIndex === page}
                        onClick={() => {
                          handlePageChange(page);
                        }}
                      >
                        {page + 1}
                      </PaginationLink>}
                  </PaginationItem>
                ))}
            </PaginationContent>
          </Pagination>
        </div>
      }
    </div>
  );
}
