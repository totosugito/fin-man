import {toast} from "sonner";
import * as React from "react";

export const showNotifSuccess = ({message}: {message: React.ReactNode}) => {
  return(
    toast.custom((t) => (
      <div
        className={"toastSuccess"}
        onClick={() => toast.dismiss(t)}>
        {message}
      </div>
    ))
  )
}

export const showNotifError = ({message}: { message: React.ReactNode }) => {
  return(
    toast.custom((t) => (
      <div
        className={"toastError"}
        onClick={() => toast.dismiss(t)}>
        {message}
      </div>
    ))
  )
}
