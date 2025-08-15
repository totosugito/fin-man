import React from "react";
import {cn} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";

type PageTitleProps = {
  title?: React.ReactElement | string;
  rightTitle?: React.ReactElement | string;
  right?: React.ReactElement;
  description?: React.ReactElement;
  isSubHeader?: boolean;
  showSeparator?: boolean;
  className?: string;
  classNameTitle?: string;
  classNameRight?: string;
  classNameDescription?: string;
};

const PageTitle = ({title, right, rightTitle, description, isSubHeader = false, showSeparator = false, ...props}: PageTitleProps) => {
  return (
    <div>
      <div className={cn("flex sm:flex-row flex-col gap-2 items-start justify-between", props?.className)}>
        {(title || description) &&
          <div className={"flex flex-col"}>
            <div className={"flex flex-row flex-wrap gap-y-0 gap-x-4 items-center"}>
            {title && <div className={cn("flex items-start", isSubHeader ? "font-bold" : "text-xl font-bold tracking-tight md:text-2xl", props?.classNameTitle)}>{title}</div>}
            {rightTitle && <div className={""}>{rightTitle}</div>}
            </div>
            {description && <div className={cn("text-muted-foreground", props?.classNameDescription)}>{description}</div>}
          </div>}
        {right && <div className={cn("", props?.classNameRight)}>{right}</div>}
      </div>
      {showSeparator && <Separator className={"mt-2"}/>}
    </div>
  )
}
export default PageTitle