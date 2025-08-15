import {Skeleton} from "@/components/ui/skeleton.tsx";
import {cn} from "@/lib/utils.js";

const SkeBox = ({containerStyle="min-h-[400px]", contentStyle="h-[300px] w-[80%]"}) => {

  return(
    <div className={cn("flex flex-col w-full p-2 items-center justify-center", containerStyle)}>
      <Skeleton className={cn("h-[300px] w-[80%]", contentStyle)}/>
    </div>
  )
}
export default SkeBox