import type { ReactNode } from "react";
import { useHalo } from "@/components/axiom-shell";
import { haloGradient } from "@/lib/axiom/halo";
import { cn } from "@/lib/utils";

export function HaloFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme, colors } = useHalo();
  const gradient = haloGradient(theme, colors);

  return (
    <div className={cn("relative overflow-hidden rounded-lg p-[3px]", className)}>
      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[9px] bg-card">{children}</div>
    </div>
  );
}
