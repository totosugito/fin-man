import React from "react";
import {useSidebar} from "@/components/ui/sidebar";
import {cn} from "@/lib/utils";
import {APP_CONFIG} from "@/constants/config";

type Props = {
  className?: string
}

const AppLogo = ({className=""}: Props) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className='content-center flex flex-row cursor-pointer' onClick={() => {}}>
      <div className={cn("flex items-center justify-center justify-items-center rounded-full bg-card shadow-sm", isCollapsed ? "p-[4px]" : "p-[6px]")} >
        <img src={APP_CONFIG?.app?.logo} width={isCollapsed ? 26 : 28} height={isCollapsed ? 26 : 28} alt={"shadow-sm"}/>
      </div>
      <div className={cn('grid flex-1 text-left text-sm leading-tight', isCollapsed ? "" : "ml-2", className)}>
        <span className='truncate font-semibold'>{APP_CONFIG?.app?.name}</span>
        <span className='truncate text-xs'>{APP_CONFIG?.app?.description}</span>
      </div>
    </div>
  )
}
export default AppLogo