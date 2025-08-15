import * as React from 'react'
import {
  createFileRoute,
  redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import LayoutLogin from "@/components/pages/auth/LayoutLogin";
import { SubmitHandler } from 'react-hook-form'
import {LoginFormValues} from "@/types/auth";
import {useLoginMutation} from "@/service/auth";
import {showNotifError} from "@/lib/show-notif";
import {AppRoute} from "@/constants/api";
import {EnumUserRole} from "backend/src/db/schema";

const fallback = '/' as const
export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const loginMutation = useLoginMutation();

  const onFormSubmit: SubmitHandler<LoginFormValues> = (data) => {
    const email = data?.['email'] ?? "";
    const password = data?.['password'] ?? "";

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    loginMutation.mutate(
      {body: formData},
      {
        onSuccess: (data: any) => {
          if (data?.user?.role === EnumUserRole.admin) {
            navigate({to: AppRoute.project.list}).then(() => {
            })
          } else {
            navigate({to: search.redirect || fallback})
          }
        },
        onError: (error) => showNotifError({message: error?.message}),
      }
    );
  }

  return (
    <LayoutLogin onFormSubmit={onFormSubmit} loading={loginMutation.isPending}/>
  )
}

export default LoginComponent