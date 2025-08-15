import React, {useState} from 'react';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {Separator} from '@/components/ui/separator';
import {ThemeToggle} from '@/components/custom/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.js";
import {MdLogout} from "react-icons/md";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button.js";
import {FaRegUser} from "react-icons/fa";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.js";
import {useAuthStore} from "@/stores/useAuthStore.js";
import DialogModal from "@/components/custom/components/DialogModal";
import {useLogoutMutation} from "@/service/auth.js";
import {ModalProps} from "@/types/dialog";

type Props = {
  title?: React.ReactNode;
}

export default function AppNavbar({title, ...props}: Props) {
  const {t} = useTranslation();
  const user: any = useAuthStore((state) => state?.user ?? null);
  const [confirmationModal, setConfirmationModal] = useState<ModalProps | null>(null);

  const [offset, setOffset] = React.useState(0)
  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  const logOffMutation = useLogoutMutation();
  const onLogoutClick = () => {
    setConfirmationModal({
      title: t("dialog.logOutTitle"),
      desc: t("dialog.logOutDesc"),
      textConfirm: t("shared.logout"),
      textCancel: t("shared.cancel"),
      onConfirmClick: () => {
        logOffMutation.mutate(undefined, {
          onSuccess: () => {
            setConfirmationModal(null);
          },
          onError: () => {
            setConfirmationModal(null);
          }
        });
      },
      onCancelClick: () => setConfirmationModal(null),
    })
  }

  return (
    <header
      className='flex h-12 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10 bg-muted'>
      <div className='flex items-center gap-2 pl-2 flex-1'>
        <SidebarTrigger variant={"outline"} onClick={() => {}}/>
        <Separator orientation={"vertical"} className={'h-6'} style={{height: "20px"}}/>
        {title}
      </div>

      <div className='flex items-center gap-2 px-4'>
        <ThemeToggle/>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"ghost"} size={"icon"} className='rounded-full'>
              <FaRegUser/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className={"flex flex-row gap-2 items-center"}>
                <Avatar className='h-8 w-8 rounded-full'>
                  <AvatarImage
                    src={user?.image || ''}
                    alt={user?.name || ''}
                  />
                  <AvatarFallback className='rounded-lg text-background font-bold bg-chart-3 shadow-md'>{user ? user?.user?.name?.substring(0, 2)?.toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <div className={"flex flex-col"}>
                  <div className='truncate font-semibold'>{user?.user?.name ?? ""}</div>
                  <div className={'text-xs text-muted-foreground'}>{user?.user?.email ?? ""}</div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator/>
            {/*<DropdownMenuItem className='flex items-center gap-2' onClick={()=> {}}>*/}
            {/*  <TbLockPassword/> {t("shared.changePassword")}*/}
            {/*</DropdownMenuItem>*/}
            {/*<DropdownMenuSeparator/>*/}
            <DropdownMenuItem onClick={onLogoutClick}><MdLogout/> Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {confirmationModal && <DialogModal modal={confirmationModal}/>}
    </header>
  );
}