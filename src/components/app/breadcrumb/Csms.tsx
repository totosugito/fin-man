import {AppRoute} from "@/constants/api";
import {BreadcrumbItem, BreadcrumbLink} from "@/components/ui/breadcrumb";
import {Link} from "@tanstack/react-router";

const Csms = () => {
  return(
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link href={AppRoute.csms.dashboard} to={AppRoute.csms.dashboard}>CSMS</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )
};
export default Csms;