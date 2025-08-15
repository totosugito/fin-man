import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import AppLogo from '../AppLogo';
import {NavGroup} from "./NavGroup";
import {SidebarData} from "./types";
import {cn} from "@/lib/utils";

function AppSidebar({navItems, ...props }: { navItems: SidebarData }) {
  const className = "";
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader className={"rounded-t-lg"}>
        <AppLogo className={className}/>
      </SidebarHeader>

      <SidebarContent className={cn("scrollbar overflow-x-hidden", className)}>
        {navItems.navGroups.map((props_: any, index: number) => (
          <NavGroup key={`${props_.title}-${index}`} {...props_} className={className}/>
        ))}
      </SidebarContent>
      <SidebarFooter className={"rounded-b-lg"}></SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
