import LoginForm from "./LoginForm";
import React from "react";
import {LoginFormValues} from "@/types/auth";
import {SubmitHandler} from "react-hook-form";

type Props = {
  onFormSubmit: SubmitHandler<LoginFormValues>
  loading?: boolean
}
const LayoutLogin = ({onFormSubmit, loading}: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-56 h-56 bg-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -right-10 w-64 h-64 bg-blue-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-10 left-1/2 w-36 h-36 bg-indigo-500 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>
      <div className={"relative"}>
        <div
          className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-background/30 bg-background/70 p-8 shadow-lg backdrop-blur-sm backdrop-filter transition-all sm:w-[400px]">

          <div className="flex flex-col items-center gap-2">
            <div className={"text-3xl font-bold text-primary mb-2 text-shadow-md/20 text-center"}>Financial Management</div>
            <div className={"text-xl font-bold"}>LOGIN</div>
            <div>Please login with your account</div>
          </div>

          <LoginForm onFormSubmit={onFormSubmit} loading={loading}/>
        </div>
      </div>
    </div>
  )
}
export default LayoutLogin;