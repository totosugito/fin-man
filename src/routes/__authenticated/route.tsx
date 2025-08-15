import {createFileRoute, Outlet, redirect} from '@tanstack/react-router'
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar.js";
import AppSidebar from "@/components/app/AppSidebar.jsx";
import {AdminNav} from "@/constants/user-nav.js";
import * as React from "react";
import {APP_CONFIG} from "@/constants/config.js";
import {useAuth} from "@/hooks/use-auth.js";
export const Route = createFileRoute('/__authenticated')({
  loader: ({context}) => {
    if (!context?.auth?.isAuthenticated) {
      throw redirect({to: APP_CONFIG.path.defaultPublic})
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const auth = useAuth();
  const userRole = auth?.user?.user?.role;

  // const webNav: any = userRole === USER_ROLE.admin.value ? AdminNav : (userRole === USER_ROLE.user.value ? UserNav : ContractorNav)
  const webNav: any = AdminNav
  return(
    <div className={"h-screen flex flex-row overflow-auto"}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar navItems={webNav}/>

        <SidebarInset  className={"flex flex-1 overflow-x-hidden"}>
          <Outlet/>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
