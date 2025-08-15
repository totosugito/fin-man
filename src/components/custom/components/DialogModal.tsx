/**
 * v0 by Vercel.
 * @see https://v0.dev/t/ccoYAeAgkWu
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import * as React from "react";
import {useState} from "react";
import {cn} from "@/lib/utils";
import {DialogModalProps} from "@/types/dialog";



const DialogModal: React.FC<DialogModalProps> = ({
                                                   modal = {
                                                     title: "Title",
                                                     desc: "Text Descriptions",
                                                     content: <div/>,
                                                     textConfirm: "Yes",
                                                     textCancel: "No",
                                                     onConfirmClick: undefined,
                                                     onCancelClick: undefined,
                                                     modal: true,
                                                   },
                                                   onDismissOutside = false,
                                                   classNameConfirm = "",
                                                   classNameCancel = "",
                                                   variantSubmit = "default",
                                                   ...props
                                                 }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          modal?.onCancelClick?.();
        }
      }}
      modal={modal?.modal}
    >
      <DialogContent
        aria-describedby={undefined}
        onInteractOutside={(e) => {
          if (!onDismissOutside) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!onDismissOutside) e.preventDefault();
        }}
        className={cn("", props?.className)}
      >
        <DialogHeader>
          <DialogTitle>{modal?.title}</DialogTitle>
          {modal?.desc && <DialogDescription>{modal?.desc}</DialogDescription>}
        </DialogHeader>

        {modal?.content && modal?.content}

        {modal?.textCancel && modal?.textConfirm && (
          <DialogFooter>
            {modal?.textCancel && (
              <Button variant="outline" onClick={modal?.onCancelClick}  className={"min-w-[80px]"}>
                {modal.textCancel}
              </Button>
            )}
            {modal?.textConfirm && (
              <Button variant={variantSubmit as any} onClick={modal?.onConfirmClick}  className={"min-w-[80px]"}>{modal.textConfirm}</Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialogModal;