import {AppRoute} from "@/constants/api";
import {BreadcrumbItem, BreadcrumbLink} from "@/components/ui/breadcrumb";
import {Link} from "@tanstack/react-router";

const Report = () => {
  return(
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link href={AppRoute.report.dailyReport.list} to={AppRoute.report.dailyReport.list}>Table Daily Report</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )
};
export default Report;