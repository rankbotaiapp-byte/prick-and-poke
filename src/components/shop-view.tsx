import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Atmosphere, NicheMark } from "@/components/atmosphere";
import { useHaloTheme } from "@/components/axiom-shell";
import { HaloFrame } from "@/components/halo-frame";
import { HeroScene } from "@/components/hero-scene";
import { PoweredByAxiom } from "@/components/powered-by-axiom";
import { CrewBlocks } from "@/components/proof-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatDayTime, money, relativeFrom } from "@/lib/axiom/format";
import { hoursLabel, isOpenAt, parseHours } from "@/lib/axiom/hours";
import { NICHES } from "@/lib/axiom/niches";
import { askAxiom } from "@/lib/axiom/server";
import type { BusinessProfile, HaloTheme, Niche } from "@/lib/axiom/types";

export function ShopView({
  business,
  slug,
}: {
  business: BusinessProfile | null;
  slug: string;
}) {
  useHaloTheme(
    (business?.haloTheme as HaloTheme | undefined) ?? "spectrum",
    business?.haloColors ?? null,
  );

  if (!business) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">That studio is not on Axiom.</p>
      </main>
    );
  }

  const copy = NICHES[business.niche];
  const hours = parseHours(business.hoursJson);
  const open = isOpenAt(hours, new Date());
  const isTruck = business.niche === "food_truck";

  return (
    <main className="relative pb-8">
      {business.heroImage ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden opacity-[0.18]">
          <img src={business.heroImage} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      ) : null}

      <HeroScene niche={business.niche} image={business.heroImage} className="h-52">
        <div className="flex h-full flex-col justify-between p-5">
          <NicheMark niche={business.niche} />
          <div>
            <h1 className="font-display text-3xl font-medium tracking-display">{business.name}</h1>
            <p className="mt-1 text-sm text-foreground/85">{business.tagline}</p>
          </div>
        </div>
      </HeroScene>

      <div className="relative flex flex-col gap-5 px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-subtle">{hoursLabel(hours)}</p>
            {business.locationName ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {business.locationName}
              </p>
            ) : null}
          </div>
          <Badge tone={open ? "live" : "closed"}>{open ? "Open" : "After hours"}</Badge>
        </div>

        {!open ? (
          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {isTruck
              ? "Window may be closed. Pickup holds are still on."
              : "Closed for walk-ins. Axiom is still taking the book."}
          </p>
        ) : null}

        <AskAxiom slug={slug} niche={business.niche} />

        {isTruck || business.locationNote ? (
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {copy.locationLabel}
            </p>
            <p className="mt-2 font-display text-lg font-medium tracking-display">
              {business.locationName || (isTruck ? "Lot posts daily" : "Location posts daily")}
            </p>
            {business.locationNote ? (
              <p className="mt-1 text-sm text-muted-foreground">{business.locationNote}</p>
            ) : null}
            <p className="mt-2 text-xs text-subtle">{relativeFrom(business.locationUpdatedAt)}</p>
          </Card>
        ) : null}

        {business.about ? (
          <p className="text-sm leading-normal text-muted-foreground">{business.about}</p>
        ) : null}

        {isTruck ? <MenuBlock business={business} copyLabel={copy.offeringLabel} /> : null}
        {!isTruck ? <CrewBlocks slug={slug} /> : null}
        {!isTruck ? <MenuBlock business={business} copyLabel={copy.offeringLabel} /> : null}

        <Separator />
        <Button asChild size="lg" className="w-full">
          <Link to="/book/$slug" params={{ slug }}>
            {copy.bookLabel}
          </Link>
        </Button>
        <PoweredByAxiom className="pb-2" />
      </div>
    </main>
  );
}

function MenuBlock({
  business,
  copyLabel,
}: {
  business: BusinessProfile;
  copyLabel: string;
}) {
  if (business.offerings.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{copyLabel}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {business.offerings.map((offering) => (
          <div key={offering.id} className="overflow-hidden rounded-lg bg-card/90">
            <HaloFrame>
              {offering.image ? (
                <img src={offering.image} alt="" className="h-36 w-full object-cover" />
              ) : (
                <Atmosphere niche={business.niche} className="h-20" />
              )}
            </HaloFrame>
            <div className="p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{offering.title}</p>
                <p className="tabular-nums text-sm">{money(offering.priceCents)}</p>
              </div>
              {offering.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{offering.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AskAxiom({ slug, niche }: { slug: string; niche: Niche }) {
  const askRef = useRef<HTMLInputElement>(null);
  const [asking, setAsking] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const copy = NICHES[niche];

  async function onAsk() {
    const typed = askRef.current?.value?.trim() ?? "";
    if (!typed) return;
    setAsking(true);
    try {
      const result = await askAxiom({ data: { slug, question: typed } });
      if (result.ok) setAdvice(result.text);
      else toast.error(result.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Axiom is quiet");
    } finally {
      setAsking(false);
    }
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Ask Axiom</p>
      <p className="text-xs text-subtle">Answers only from this shop.</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onAsk();
        }}
      >
        <Input
          ref={askRef}
          name="question"
          placeholder={copy.askPlaceholder}
          autoComplete="off"
          maxLength={240}
        />
        <Button type="submit" variant="secondary" disabled={asking}>
          {asking ? "Checking…" : "Ask"}
        </Button>
      </form>
      {advice ? (
        <p role="status" className="border-l border-border pl-3 text-sm text-muted-foreground">
          {advice}
        </p>
      ) : null}
    </Card>
  );
}
