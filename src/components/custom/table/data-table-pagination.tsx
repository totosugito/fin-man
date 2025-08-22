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
}

export function DataTablePagination({
                                             pageIndex, setPageIndex, pageSize, setPageSize,
                                             rowsCount,
                                             pageSizeOptions = [5, 10, 20, 30, 40, 50],
                                             className,
                                           }: DataTablePaginationProps) {

  const {t} = useTranslation();
  const maxDisplayedPages = 1; // Number of pages to show before and after the current page
  const pageCount = Math.ceil(rowsCount / pageSize);

  const generatePageNumbers = (): number[] => {
    const pageNumbers_ = [];

    // Show pages before and after the current page index
    for (let i = 0; i < pageCount; i++) {
      pageNumbers_.push(i);
    }

    // Add ellipses when necessary
    const filteredPageNumbers = [];

    // set left pagination
    let idxLeftStart = (pageIndex - maxDisplayedPages) < 0 ? 0 : (pageIndex - maxDisplayedPages);
    let addToTheRight = (pageIndex - idxLeftStart) < maxDisplayedPages ? (maxDisplayedPages - (pageIndex - idxLeftStart)) : 0;
    let idxRightPos = pageIndex + maxDisplayedPages + addToTheRight + 1;
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
  let startIndex = (pageSize * pageIndex) + 1;
  if (startIndex >= rowsCount) {
    startIndex = 1;
  }

  const endIndex = Math.min(startIndex + pageSize - 1, rowsCount);
  const totalPages = pageNumbers.length;

  return (
    <div className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto sm:flex-row sm:gap-8",
        className,
      )}>
      <div>
        <div className="flex items-center justify-center text-sm text-foreground">
          {t("labels.row")} {rowsCount > 0 ? startIndex : 0}<span className={"text-foreground px-[2px]"}>-</span>
          {endIndex}<span className={"text-foreground px-[2px]"}>{t("labels.of")}</span>
          {rowsCount}
        </div>
        {/*<div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">*/}
        {/*  {table.getFilteredSelectedRowModel().rows.length} of{" "}*/}
        {/*  {table.getFilteredRowModel().rows.length} row(s) selected.*/}
        {/*</div>*/}
      </div>

      {(rowsCount >= (pageSizeOptions?.[0] ?? 5)) &&
        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[8.0rem] [&[data-size]]:h-8">
                <SelectValue placeholder={pageSize}/>
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
            <PaginationContent>
              {(totalPages > 0) &&
                pageNumbers.map((page: number, index: number) => (
                  <PaginationItem key={index}>
                    {page < 0 ? <PaginationEllipsis/> :
                      <PaginationLink
                        isActive={pageIndex === page}
                        onClick={() => {
                          setPageIndex(page);
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
