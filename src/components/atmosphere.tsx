import type { ReactNode } from "react";
import { NICHES } from "@/lib/axiom/niches";
import type { Niche } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

const NICHE_CLASS: Record<Niche, string> = {
  barber: "atmosphere-barber",
  tattoo: "atmosphere-tattoo",
  food_truck: "atmosphere-food",
};

export function Atmosphere({
  niche,
  className,
  children,
}: {
  niche: Niche;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("atmosphere", NICHE_CLASS[niche] ?? "atmosphere-spectrum", className)}>
      {children}
    </div>
  );
}

export function Monogram({
  name,
  niche,
}: {
  name: string;
  niche: Niche;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-md font-display text-sm font-medium tracking-display text-foreground",
        NICHE_CLASS[niche] ?? "atmosphere-spectrum",
        "atmosphere",
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function NicheMark({ niche }: { niche: Niche }) {
  return (
    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
      {NICHES[niche].label}
    </span>
  );
}
