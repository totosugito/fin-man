import {twMerge} from "tailwind-merge";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa6";

const ColumnHeader = ({column, title, ...props}) => {
  return (
    <div className={twMerge("group flex flex-row cursor-pointer gap-1 items-center px-[5px] py-[3px] w-full hover:text-foreground", props?.className)}
         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {/* Title */}
      <div className={twMerge(`whitespace-normal break-words font-bold `, props?.titleStyles)}>{title}</div>

      {/* Sorting */}
      {column?.getCanSort() &&
        <div className={twMerge("opacity-40 group-hover:opacity-100 transition-opacity duration-200", props?.sortingStyles)}>
          {column.getIsSorted() === "desc" ? (
            <FaSortDown className=""/>
          ) : column.getIsSorted() === "asc" ? (
            <FaSortUp className=""/>
          ) : (
            <FaSort className=""/>
          )}
        </div>}
    </div>
  )
}
export default ColumnHeader
