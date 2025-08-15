import {createFileRoute, Outlet} from '@tanstack/react-router'
import * as React from "react";

export const Route = createFileRoute('/__authenticated/admin')({
  // loader: ({context}) => {
  //   console.log("router admin", !context?.auth)
  //   if (!context?.auth?.isAuthenticated) {
  //     // throw redirect({to: APP_CONFIG.path.defaultPublic})
  //   }
  // },
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet/></div>
}
