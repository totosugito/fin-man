import {AppRoute} from "@/constants/api";
import {BreadcrumbItem, BreadcrumbLink} from "@/components/ui/breadcrumb";
import {Link} from "@tanstack/react-router";

const Dashboard = () => {
  return(
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link href={AppRoute.dashboard.hsePerformance} to={AppRoute.dashboard.hsePerformance}>HSE Performance</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )
};
export default Dashboard;