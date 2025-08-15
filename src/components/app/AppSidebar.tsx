import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import AppLogo from './AppLogo';
import {NavGroup} from "@/components/custom/components/NavGroup";
import {SidebarData} from "@/types/sidebar";
import {cn} from "@/lib/utils";

function AppSidebar({navItems, ...props }: { navItems: SidebarData }) {
  const className = "text-background";
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader className={"bg-primary rounded-t-lg"}>
        <AppLogo className={className}/>
      </SidebarHeader>

      <SidebarContent className={cn("scrollbar overflow-x-hidden bg-primary", className)}>
        {navItems.navGroups.map((props_: any, index: number) => (
          <NavGroup key={`${props_.title}-${index}`} {...props_} className={className}/>
        ))}
      </SidebarContent>
      <SidebarFooter className={"bg-primary rounded-b-lg"}></SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
