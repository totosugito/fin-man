import {createFileRoute} from '@tanstack/react-router'
import {showNotifError, showNotifSuccess} from "@/lib/show-notif";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {BreadCrumbDashboard} from "@/components/app/breadcrumb";
import {PageTitle, AppNavbar} from "@/components/app";
import {SkeTable} from "@/components/custom/skeleton";
import {DialogModal, DialogModalForm} from "@/components/custom/components";
import * as React from "react";
import {FormUserAdd, TableUser, FormUserEdit, FormPasswordUpdate} from '@/components/pages/admin/user';
import {useQueryClient} from '@tanstack/react-query';
import {
  useAdminChangePassword,
  useAdminUserCreate,
  useAdminUserDelete,
  useAdminUserList,
  useAdminUserPut
} from "@/service/admin-users";
import {useState} from "react";
import {ModalFormProps, ModalProps} from "@/types/dialog";
import {z} from "zod"
import {LuUserPlus} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {useTranslation} from "react-i18next";
import {ObjToOptionList} from "@/lib/my-utils";
import {EnumUserRole} from "backend/src/db/schema";

export const Route = createFileRoute('/__authenticated/admin/__users/users')({
  component: RouteComponent,
})

function RouteComponent() {
  const {t} = useTranslation()
  const queryClient = useQueryClient();

  const userListQuery = useAdminUserList();
  const userCreateMutation = useAdminUserCreate();
  const userPutMutation = useAdminUserPut();
  const userDeleteMutation = useAdminUserDelete();
  const userUpdatePasswordMutation = useAdminChangePassword();

  const [confirmationCreate, setConfirmationCreate] = useState<ModalFormProps | null>(null);
  const [confirmationPut, setConfirmationPut] = useState<ModalFormProps | null>(null);
  const [confirmationDelete, setConfirmationDelete] = useState<ModalProps | null>(null);
  const [confirmationUpdatePassword, setConfirmationUpdatePassword] = useState<ModalFormProps | null>(null);

  const isLoading = () => {
    return (userDeleteMutation.isPending || userCreateMutation.isPending || userPutMutation.isPending || userListQuery.isPending
    );
  }

  const [formData, setFormData] = React.useState({
    form: {
      name: {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Name",
      },
      email: {
        type: "email",
        name: "email",
        label: "Email",
        placeholder: "Email",
      },
      password: {
        type: "password",
        name: "password",
        label: "Password",
        placeholder: "Password",
      },
      role: {
        type: "select",
        name: "role",
        label: "Role",
        placeholder: "Role",
        options: ObjToOptionList(EnumUserRole)
      },
    },
    schema: {
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email").min(1, "Email is required"),
      password: z.string({required_error: "Password is required"}).min(8, "Password must be at least 8 characters"),
      role: z.string().min(1, "Role is required"),
      sub_contractor: z.array(z.string())
    },
    defaultValue: {
      name: "",
      email: "",
      password: "",
      role: "",
      sub_contractor: []
    }
  });

  const formChangePassword = {
    form: {
      password: {
        type: "password",
        name: "password",
        label: "Password",
        placeholder: "Password",
      },
      confirmPassword: {
        type: "password",
        name: "confirmPassword",
        label: "Confirm Password",
        placeholder: "Confirm Password",
      },
    },
    schema: {
      password: z.string({required_error: "Password is required"}).min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string({required_error: "Confirm Password is required"}).min(8, "Confirm Password must be at least 8 characters"),
    },
    defaultValue: {
      password: "",
      confirmPassword: "",
    }
  }

  const onDeleteData = (item: any) => {
    setConfirmationDelete({
      title: "Delete User",
      desc: "Permanently remove user and all of its data. This action is not reversible. So, please confirm with caution.",
      content: <div>Are you sure you want to delete user <span
        className={"font-bold text-primary"}>{item?.email ?? ""}</span> ?</div>,
      textConfirm: "Delete",
      textCancel: "Cancel",
      onConfirmClick: () => {
        userDeleteMutation.mutate(
          {body: {userId: item?.id}},
          {
            onSuccess: () => {
              queryClient.invalidateQueries({queryKey: ['admin-user-list']});
              showNotifSuccess({message: "User deleted successfully"});
            },
            onError: (error: any) => showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message}),
          }
        );
        setConfirmationDelete(null);
      },
      onCancelClick: () => setConfirmationDelete(null),
    })
  }

  const onDataCreated = () => {
    setConfirmationCreate({
      title: "Add User",
      desc: "Please fill the form below to create new user.",
      defaultValue: formData.defaultValue,
      child: formData.form,
      schema: formData.schema,
      content: <FormUserAdd/>,
      onCancelClick: () => setConfirmationCreate(null),
      onConfirmClick: (body: Record<string, any>) => {
        userCreateMutation.mutate({body}, {
          onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-user-list']});
            showNotifSuccess({message: "User created successfully"});
            setConfirmationCreate(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  };

  const onDataPut = (item: any) => {
    const {password, ...newSchema} = formData.schema;
    let newItem = {...item};

    setConfirmationPut({
      title: "Update User",
      desc: "Please fill the form below to update user.",
      defaultValue: newItem,
      child: formData.form,
      schema: newSchema,
      content: <FormUserEdit/>,
      textConfirm: "Update",
      onCancelClick: () => setConfirmationPut(null),
      onConfirmClick: (body: Record<string, any>) => {
        let {email, ...newBody} = body;
        userPutMutation.mutate({id: item?.id, body: {...newBody}}, {
          onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-user-list']});
            showNotifSuccess({message: "User updated successfully"});
            setConfirmationPut(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  };

  const onPasswordChange = (item: any) => {
    setConfirmationUpdatePassword({
      title: "Change Password",
      desc: "Please fill the form below to update user password.",
      child: formChangePassword.form,
      schema: formChangePassword.schema,
      defaultValue: formChangePassword.defaultValue,
      content: <FormPasswordUpdate/>,
      textConfirm: "Change Password",
      onCancelClick: () => setConfirmationUpdatePassword(null),
      onConfirmClick: (body: Record<string, string>) => {
        if (body.password !== body.confirmPassword) {
          showNotifError({message: "Password and Confirm Password must be the same"});
          return;
        }

        const newBody = {
          userId: item?.id,
          newPassword: body.password
        }

        userUpdatePasswordMutation.mutate({body: newBody}, {
          onSuccess: () => {
            showNotifSuccess({message: "User updated password successfully"});
            setConfirmationUpdatePassword(null);
          },
          onError: (error: any) => {
            showNotifError({message: (error?.response?.data?.message || error?.response?.data?.error) ?? error?.message})
          },
        });
      },
    });
  }

  return (
    <div className={"divPage"}>
      <AppNavbar title={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadCrumbDashboard/>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>User List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }/>
      <div className={"divContent"}>
        <PageTitle title={<div>User List</div>} showSeparator={false}/>

        {(userListQuery.isPending) && <div className={"h-full w-full flex"}>
          <SkeTable/>
        </div>}

        {userListQuery.isError &&
          <div className={"text-lg text-destructive"}>Error: {userListQuery?.error?.message}</div>}

        {userListQuery.isSuccess &&
          <div className={"flex flex-col gap-2"}>
            <div>
              <Button variant={"default"} onClick={onDataCreated} disabled={isLoading()}>
                {isLoading() ? <span className={"animate-spin rounded-full h-3 w-3 border-b-2 border-current"}/> :
                  <LuUserPlus/>} {t("shared.userAdd")}
              </Button>
            </div>
            <TableUser data={userListQuery?.data}
                       onCreateClicked={onDataCreated}
                       onEditClicked={onDataPut}
                       onDeleteClicked={(item: any) => onDeleteData(item)}
                       onPasswordChange={(item: any) => onPasswordChange(item)}
                       loading={isLoading()}
            />
          </div>
        }

      </div>

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationUpdatePassword && <DialogModalForm modal={confirmationUpdatePassword}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
