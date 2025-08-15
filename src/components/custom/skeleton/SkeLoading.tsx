import {Loader2} from "lucide-react";
import * as React from "react";
import {cn} from "@/lib/utils";

type Props = {
  loading: boolean;
  className?: string
}
const SkeLoading = ({loading, className}: Props) => {
  if(loading) {
    return(
      <div className={cn("absolute w-full h-full z-10 flex items-center justify-center bg-foreground/20 rounded-lg", className)}>
        <Loader2 className="animate-spin text-background w-12 h-12" />
      </div>
    )
  }
  return(<span/>)
}
export default SkeLoading