import type { ReactNode } from "react";
import { Atmosphere } from "@/components/atmosphere";
import type { Niche } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

export function HeroScene({
  niche,
  image,
  className,
  children,
  veil = "full",
}: {
  niche: Niche;
  image?: string | null;
  className?: string;
  children?: ReactNode;
  veil?: "full" | "soft";
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {image ? (
        <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <Atmosphere niche={niche} className="absolute inset-0" />
      )}
      <div
        className={cn(
          "absolute inset-0",
          veil === "full"
            ? "bg-gradient-to-t from-background via-background/55 to-background/15"
            : "bg-gradient-to-t from-background/80 via-background/25 to-transparent",
        )}
      />
      <div className="relative z-10 flex h-full flex-col justify-end">{children}</div>
    </div>
  );
}
