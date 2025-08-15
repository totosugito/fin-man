import {Skeleton} from "@/components/ui/skeleton.tsx";
import {cn} from "@/lib/utils.js";

const SkeCircle = ({containerStyle="min-h-[300px]", contentStyle="h-[250px] w-[250px]"}) => {

  return(
    <div className={cn("flex h-full w-full min-h-[300px] items-center justify-center", containerStyle)}>
      <Skeleton className={cn("rounded-full", contentStyle)}/>
    </div>
  )
}
export default SkeCircle