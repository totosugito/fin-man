import TableRowsPerPage from "@/components/custom/table/RowsPerPage";
import PaginationData from "@/components/custom/table/PaginationData";
import React, {useState} from "react";

type Props = {
  total: number
  page: number,
  view: number,
  paginationList?: number[],
  onPageSizeChange: (rowsPerPage: number, pageIndex: number) => void,
}
const PaginationView = ({
                          total, page, view, paginationList=[5, 10, 20, 50], onPageSizeChange
                        }: Props) => {
  const [pageIndex, setPageIndex] = useState(page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(view ?? 5);

  return (
    <div className="flex items-center justify-between px-4">
      <div></div>
      <div className={`flex gap-4 ${total > rowsPerPage ? "flex-col sm:flex-row" : "flex-row"}`}>
        <TableRowsPerPage rowsPerPage={rowsPerPage}
                          paginationShowAll={false}
                          paginationList={paginationList}
                          onPageSizeChange={(e: any) => {
                            let value = Number(e);
                            setRowsPerPage(value);

                            setPageIndex(0);
                            onPageSizeChange(value, 0);
                          }}
        />
        <PaginationData
          rowsCount={total ?? 0}
          pageIndex={pageIndex} setPageIndex={setPageIndex}
          rowsPerPage={rowsPerPage} paginationList={paginationList}
          onPageIndexChange={(pageIndex_: number) => {
            onPageSizeChange(rowsPerPage, pageIndex_);
          }}/>
      </div>
    </div>
  )
}
export default PaginationView