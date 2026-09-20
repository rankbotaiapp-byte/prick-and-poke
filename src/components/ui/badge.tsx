import { cn } from "@/lib/utils";

function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & { tone?: "default" | "live" | "closed" | "ok" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "default" && "border-border text-muted-foreground",
        tone === "live" && "border-foreground/20 text-foreground",
        tone === "closed" && "border-border text-subtle",
        tone === "ok" && "border-success/40 text-success",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
