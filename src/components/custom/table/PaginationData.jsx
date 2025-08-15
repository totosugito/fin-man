import {twMerge} from "tailwind-merge";
import {useTranslation} from "react-i18next";
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink} from "@/components/ui/pagination";

const PaginationData = ({pageIndex, setPageIndex, rowsPerPage, rowsCount, ...props}) => {
  const {t} = useTranslation();
  const pageCount = Math.ceil(rowsCount / rowsPerPage);

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxDisplayedPages = 1; // Number of pages to show before and after the current page

    // Show pages before and after the current page index
    for (let i = 0; i < pageCount; i++) {
      pageNumbers.push(i);
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
      filteredPageNumbers.push(pageNumbers[0]);
      if ((idxLeftStart + 1) > 2) {
        filteredPageNumbers.push('...');
      }
    }

    // add center pagination
    for (let j = idxLeftStart; j < idxLeftEnd; j++) {
      filteredPageNumbers.push(pageNumbers[j]);
    }

    // add end pagination
    if (idxLeftEnd < pageCount) {
      if (idxLeftEnd < pageCount) {
        filteredPageNumbers.push('...');
      }
      filteredPageNumbers.push(pageNumbers[pageCount - 1]);
    }
    return filteredPageNumbers;
  }

  const pageNumbers = generatePageNumbers();
  let startIndex = (rowsPerPage * pageIndex) + 1;
  if (startIndex >= rowsCount) {
    startIndex = 1;
  }

  const endIndex = Math.min(startIndex + rowsPerPage - 1, rowsCount);
  const totalPages = pageNumbers.length;

  return (
    <div className={twMerge("flex items-center gap-2", props?.styleContainer)}>
      <div className={twMerge("text-nowrap text-muted-foreground", props?.styleLabel)}>
        <span className="text-foreground">{rowsCount > 0 ? startIndex : 0}</span> - <span className="text-foreground">{endIndex}</span> {t("shared.of")}  <span className="text-foreground">{rowsCount}</span>
      </div>
      <Pagination>
        <PaginationContent>
          {(totalPages > 1) &&
            pageNumbers.map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? <PaginationEllipsis/> :
                  <PaginationLink isActive={pageIndex === page} onClick={() => {
                    if (page !== '...') {
                      setPageIndex(page);
                      props?.onPageIndexChange(page);
                    }
                  }}>{(page !== '...') ? page + 1 : page}</PaginationLink>}
              </PaginationItem>
            ))}
        </PaginationContent>
      </Pagination>
    </div>
  )
};
export default PaginationData
