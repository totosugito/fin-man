import {Skeleton} from "@/components/ui/skeleton.tsx";
import {cn} from "@/lib/utils.js";

const SkeBar = ({containerStyle="min-h-[300px]"}) => {

  return(
    <div className={cn("flex flex-col h-full w-full items-start justify-center gap-2 p-5", containerStyle)}>
      <Skeleton className={"h-[30px] w-[80%]"}/>
      <Skeleton className={"h-[30px] w-[50%]"}/>
      <Skeleton className={"h-[30px] w-[30%]"}/>
      <Skeleton className={"h-[30px] w-[90%]"}/>
      <Skeleton className={"h-[30px] w-[20%]"}/>
    </div>
  )
}
export default SkeBar