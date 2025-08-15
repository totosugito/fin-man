import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils";

type Props = {containerStyle?: string}
const SkeParagraph = ({containerStyle="min-h-[300px]"}: Props) => {

  return(
    <div className={cn("flex flex-col h-full w-full items-start gap-2 p-5", containerStyle)}>
      <Skeleton className={"h-[30px] w-[40%]"}/>
      <Skeleton className={"h-[20px] w-[100%]"}/>
      <Skeleton className={"h-[20px] w-[100%]"}/>
      <Skeleton className={"h-[20px] w-[100%]"}/>
      <Skeleton className={"h-[20px] w-[100%]"}/>
      <Skeleton className={"h-[20px] w-[100%]"}/>
      <Skeleton className={"h-[20px] w-[70%]"}/>
    </div>
  )
}
export default SkeParagraph