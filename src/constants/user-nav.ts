import {MdOutlineDashboard, MdOutlineWorkHistory} from "react-icons/md";
import {TbFileReport} from "react-icons/tb";
import {HiOutlineDocumentChartBar, HiOutlineUsers} from "react-icons/hi2";
import {LuTable2} from "react-icons/lu";
import {AppRoute} from "@/constants/api";
import { CiBoxList } from "react-icons/ci";
import { GoFileDirectory } from "react-icons/go";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiGuideLine } from "react-icons/ri";
import { BsBracesAsterisk } from "react-icons/bs";
import { GrScorecard } from "react-icons/gr";
import { PiUsersThree } from "react-icons/pi";
import { BsGrid } from "react-icons/bs";
import { IoIosNotificationsOutline } from "react-icons/io";

export const AdminNav = {
  user: {},
  teams: {},
  navGroups: [
    {
      title: "MONITOR",
      items: [
        {
          title: "Project",
          url: AppRoute.project.list,
          icon: MdOutlineDashboard,
        },
    ]},
    {
      title: "ADMIN",
      items: [
        {
          title: "Users",
          url: AppRoute.admin.user.list,
          icon: HiOutlineUsers,
        },
      ],
      permitUser: false,
      permitContractor: false
    }
  ]
}

export const UserNav = {
  ...AdminNav,
  navGroups: AdminNav.navGroups.filter(group => group.permitUser)
}