import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import React from "react";

type CardCustomProps = {
  CardIcon?: React.ComponentType;
  title?: string;
  description?: string;
  rightTitle?: string;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
}

const CardCustom = ({CardIcon, title, description, rightTitle, children, ...props}: CardCustomProps) => {
  return (
    <Card className={cn("p-2 ", props.className)}>
      <CardContent className={cn("flex flex-col p-0 gap-0", props.contentClassName)}>
        {(title || rightTitle) &&
          <div className={cn("flex flex-row gap-2 items-center justify-between", props?.titleClassName)}>
            <div>
              {CardIcon ? <CardIcon/> : <span/>}
              <div className={"text-md font-bold"}>{title}</div>
            </div>
            {rightTitle && <div className={"text-end"}>{rightTitle}</div>}
          </div>
        }
        {children}
      </CardContent>
    </Card>
  )
}
export default CardCustom;