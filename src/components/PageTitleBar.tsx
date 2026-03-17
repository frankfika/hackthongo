import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageTitleBarProps = {
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  innerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageTitleBar(props: PageTitleBarProps) {
  return (
    <section className={cn("page-title-bar", props.className)}>
      <div className={cn("page-title-inner", props.align === "center" && "text-center", props.innerClassName)}>
        <h1 className={cn("page-title-heading", props.titleClassName)}>{props.title}</h1>
        {props.description ? <p className={cn("page-title-description", props.descriptionClassName)}>{props.description}</p> : null}
      </div>
    </section>
  );
}
