import {SubmitHandler, useForm} from "react-hook-form";
import React from "react";
import {Form} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {LoginFormValues} from "@/types/auth";
import {FormInput, FormPassword} from "@/components/custom/forms";
import {APP_CONFIG} from "@/constants/config";
import {Loader2} from "lucide-react";

const loginFormSchema = z.object({
  email: z.string().email({message: "Invalid email address"}),
  password: z.string().min(1, {message: "Password is required"}),
})

type Props = {
  onFormSubmit: SubmitHandler<LoginFormValues>
  loading?: boolean
}

const LoginForm = ({onFormSubmit, loading}: Props) => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: APP_CONFIG.demoUser.email,
      password: APP_CONFIG.demoUser.password,
    },
  });

  const formList = {
    email: {
      name: "email",
      label: "Email",
      placeholder: "Enter your email address",
    },
    password: {
      name: "password",
      label: "Password",
      placeholder: "Enter your password",
    },
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className={"flex flex-col gap-3"}>
        <FormInput form={form} item={formList.email} className={"bg-background/60"}/>
        <FormPassword form={form} item={formList.password} className={"bg-background/60"}/>

        <Button type="submit" className={"mt-2"} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit
        </Button>
      </form>
    </Form>
  )
}
export default LoginForm;