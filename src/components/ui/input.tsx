import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-sm border border-border bg-muted px-3 text-sm text-foreground placeholder:text-subtle outline-none transition-[border-color,box-shadow] duration-quick ease-smooth focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
