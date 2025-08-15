import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils";

type Props = {
  containerStyle?: string
  rows?: number
  cols?: number
  contentStyle?: string
  skeStyle?: string
}
const SkeTable = ({
                    containerStyle = "",
                    rows = 6,
                    cols = 5,
                    contentStyle = "h-[30px]",
                    skeStyle = "h-[30px]"
                  }: Props) => {

  return (
    <div className={cn(`flex flex-col min-h-[300px] gap-4 p-4 w-full`, containerStyle)}>
      {[...Array(rows)].map((_, i) => (
        <div className={cn(`grid grid-cols-5 gap-4 w-full`, contentStyle)} key={i}>
          {
            [...Array(cols)].map((_, j) => (
              <Skeleton key={`${i}-${j}`} className={cn("", skeStyle)}/>
            ))
          }
        </div>
      ))}
    </div>
  )
}
export default SkeTable