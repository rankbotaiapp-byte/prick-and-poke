import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-muted px-3 py-3 text-sm text-foreground placeholder:text-subtle outline-none transition-[border-color,box-shadow] duration-quick ease-smooth focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
