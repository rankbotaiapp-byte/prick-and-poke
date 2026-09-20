import { useHalo } from "@/components/axiom-shell";
import { haloGradient } from "@/lib/axiom/halo";
import { initialsFrom } from "@/lib/axiom/image";
import { cn } from "@/lib/utils";

export function TeamPortrait({
  name,
  image,
  size = 64,
  className,
}: {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const { theme, colors, mood } = useHalo();
  const gradient = haloGradient(theme, colors);
  const initials = initialsFrom(name);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        data-mood={mood}
        aria-hidden="true"
      >
        <div className="halo-bloom" style={{ background: gradient, borderRadius: 9999 }} />
        <div className="halo-line" style={{ background: gradient, borderRadius: 9999 }} />
      </div>
      <div className="absolute inset-[3px] flex items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
    </div>
  );
}
