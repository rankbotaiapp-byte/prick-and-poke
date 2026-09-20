import { Link } from "@tanstack/react-router";
import { Atmosphere, NicheMark } from "@/components/atmosphere";
import { Badge } from "@/components/ui/badge";
import { hoursLabel, isOpenAt, parseHours } from "@/lib/axiom/hours";
import { relativeFrom } from "@/lib/axiom/format";
import { NICHES } from "@/lib/axiom/niches";
import type { BusinessCard as Card } from "@/lib/axiom/types";

export function BusinessCard({ business }: { business: Card }) {
  const hours = parseHours(business.hoursJson);
  const open = isOpenAt(hours, new Date());
  const copy = NICHES[business.niche];

  return (
    <Link
      to="/b/$slug"
      params={{ slug: business.id }}
      className="block overflow-hidden rounded-xl border border-border bg-card transition-[border-color] duration-quick hover:border-foreground/25"
    >
      <Atmosphere niche={business.niche} className="h-36">
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <NicheMark niche={business.niche} />
          <div>
            <h2 className="font-display text-xl font-medium tracking-display text-foreground">
              {business.name}
            </h2>
            <p className="mt-1 text-sm text-foreground/80">{business.tagline}</p>
          </div>
        </div>
      </Atmosphere>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {business.locationName || copy.locationLabel}
            {business.niche === "food_truck" && business.locationUpdatedAt
              ? ` · ${relativeFrom(business.locationUpdatedAt)}`
              : ""}
          </p>
          <p className="text-xs text-subtle">{hoursLabel(hours)}</p>
        </div>
        <Badge tone={open ? "live" : "closed"}>{open ? "Open" : "After hours"}</Badge>
      </div>
    </Link>
  );
}
