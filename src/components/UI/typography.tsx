import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

export const typographyVariants = cva("text-xl", {
  variants: {
    variant: {
      h1: "text-5xl font-extrabold tracking-tight ",
      h2: "text-3xl border-b  font-semibold tracking-tight first:mt-0",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      p: "leading-10 text-lg font-normal tracking-tight text-text",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof typographyVariants> {}

const Typography = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, variant, ...props }, ref) => {
    const Comp = variant ?? "p";
    return (
      <Comp
        className={cn(typographyVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Typography.displayName = "Typography";

export default Typography;
