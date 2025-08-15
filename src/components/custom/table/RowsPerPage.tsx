import {useTranslation} from "react-i18next";
import {twMerge} from "tailwind-merge";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select";

export const SHOW_ALL_KEY = "all";
type Props = {
  rowsPerPage: number
  paginationList?: number[]
  paginationShowAll?: boolean
  onPageSizeChange: (index: number|string) => void
  styleContainer?: string
}
const RowsPerPage = ({rowsPerPage, paginationList = [5, 10, 20, 50], paginationShowAll=true, ...props}: Props) => {
  const {t} = useTranslation();

  return (
    <div className={twMerge("flex flex-row gap-2 items-center", props?.styleContainer)}>
      <Select defaultValue={paginationList.includes(rowsPerPage) ? (rowsPerPage).toString() : SHOW_ALL_KEY} onValueChange={(e) => {
        props?.onPageSizeChange(e);
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Select page"/>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className={"opacity-60"}>{t("shared.rowsPerPage")}</SelectLabel>
            {paginationList.map(size => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
            {paginationShowAll && <SelectItem value={SHOW_ALL_KEY}>{t("shared.showAll")}</SelectItem>}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export default RowsPerPage
