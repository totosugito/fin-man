import {createFileRoute} from '@tanstack/react-router'
import {showNotifError, showNotifSuccess} from "@/lib/show-notif";
import {PageTitle} from "@/components/app";
import {SkeTable} from "@/components/custom/skeleton";
import {DialogModal, DialogModalForm} from "@/components/custom/components";
import * as React from "react";
import {FormUserAdd, FormUserEdit, FormPasswordUpdate, DataTableUser} from '@/components/pages/admin/user/list';
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
  validateSearch: (search: Record<string, unknown>): { sort?: string; order?: 'asc' | 'desc' } => {
    return {
      sort: search.sort as string | undefined,
      order: search.order as 'asc' | 'desc' | undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const {t} = useTranslation()
  const queryClient = useQueryClient();
  const {sort, order} = Route.useSearch();

  const dataListQuery = useAdminUserList({sort, order});
  const dataCreateMutation = useAdminUserCreate();
  const dataPutMutation = useAdminUserPut();
  const dataDeleteMutation = useAdminUserDelete();
  const userUpdatePasswordMutation = useAdminChangePassword();

  const [confirmationCreate, setConfirmationCreate] = useState<ModalFormProps | null>(null);
  const [confirmationPut, setConfirmationPut] = useState<ModalFormProps | null>(null);
  const [confirmationDelete, setConfirmationDelete] = useState<ModalProps | null>(null);
  const [confirmationUpdatePassword, setConfirmationUpdatePassword] = useState<ModalFormProps | null>(null);

  const isLoading = () => {
    return (dataDeleteMutation.isPending || dataCreateMutation.isPending || dataPutMutation.isPending || dataListQuery.isPending
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
    },
    defaultValue: {
      name: "",
      email: "",
      password: "",
      role: "",
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
        dataDeleteMutation.mutate(
          {body: {userId: item?.id}},
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({queryKey: ['admin-user-list', sort, order]});
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
        dataCreateMutation.mutate({body}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['admin-user-list', sort, order]});
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
        dataPutMutation.mutate({id: item?.id, body: body}, {
          onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['admin-user-list', sort, order]});
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
          newPassword: body.password
        }

        userUpdatePasswordMutation.mutate({id: item?.id, body: newBody}, {
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

  const ViewAddUser = () => {
    return (
      <div>
        <Button variant={"outline"} size={"sm"} onClick={onDataCreated} disabled={isLoading()}>
          {isLoading() ? <span className={"animate-spin rounded-full h-3 w-3 border-b-2 border-current"}/> :
            <LuUserPlus/>} {t("shared.userAdd")}
        </Button>
      </div>
    )
  }

  return (
    <div className={"divContent"}>
      <PageTitle title={<div>User List</div>} showSeparator={false}/>

      {(dataListQuery.isPending) && <div className={"h-full w-full flex"}>
        <SkeTable/>
      </div>}

      {dataListQuery.isError &&
        <div className={"text-lg text-destructive"}>Error: {dataListQuery?.error?.message}</div>}

      {dataListQuery.isSuccess &&
        <div className={"bg-card p-2 flex flex-col gap-2"}>


          <DataTableUser data={dataListQuery?.data}
                         onEditClicked={onDataPut}
                         onDeleteClicked={onDeleteData}
                         onPasswordChange={onPasswordChange}
                         loading={isLoading()}
                         toolbarContent={<ViewAddUser/>}
          />
        </div>
      }

      {confirmationCreate && <DialogModalForm modal={confirmationCreate}/>}
      {confirmationPut && <DialogModalForm modal={confirmationPut}/>}
      {confirmationUpdatePassword && <DialogModalForm modal={confirmationUpdatePassword}/>}
      {confirmationDelete && <DialogModal modal={confirmationDelete} variantSubmit={"destructive"}/>}
    </div>
  )
}
