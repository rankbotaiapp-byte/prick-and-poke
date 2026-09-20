import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BUSINESS } from "@/config/business";
import { NicheMark } from "@/components/atmosphere";
import { HeroScene } from "@/components/hero-scene";
import { ShopView } from "@/components/shop-view";
import { Button } from "@/components/ui/button";
import { HOST_SLUG } from "@/lib/axiom/host";
import { NICHE_LIST, NICHES } from "@/lib/axiom/niches";
import { getBusiness } from "@/lib/axiom/server";
import type { Niche } from "@/lib/axiom/types";

export const Route = createFileRoute("/")({
  loader: () => (BUSINESS.active ? getBusiness({ data: { slug: HOST_SLUG } }) : Promise.resolve(null)),
  component: Home,
});

const DEMO: Record<Niche, { slug: string; line: string }> = {
  barber: { slug: "ember-fade", line: "Chairs, albums, and a book that stays open after six." },
  tattoo: { slug: "atelier-ink", line: "Artist albums, flash, and session holds." },
  food_truck: { slug: "solstice-kitchen", line: "Today's lot, the menu, and pickup holds." },
};

function Home() {
  const business = Route.useLoaderData();
  if (BUSINESS.active) {
    return <ShopView business={business} slug={HOST_SLUG} />;
  }
  return <FactoryHome />;
}

function FactoryHome() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col px-4 pb-8 pt-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Factory</p>
      <h1 className="mt-2 font-display text-2xl font-medium tracking-display">Build a shop</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a niche. Open the demo to see what a customer sees. Build one to name it and set the PIN.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {NICHE_LIST.map((niche) => {
          const copy = NICHES[niche];
          const demo = DEMO[niche];
          return (
            <div key={niche} className="overflow-hidden rounded-xl border border-border bg-card">
              <HeroScene niche={niche} image={copy.hero} className="h-36">
                <div className="flex h-full flex-col justify-between p-4">
                  <NicheMark niche={niche} />
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-display">{copy.label}</h2>
                    <p className="mt-1 text-sm text-foreground/80">{demo.line}</p>
                  </div>
                </div>
              </HeroScene>
              <div className="grid grid-cols-2 gap-2 p-3">
                <Button asChild variant="secondary" size="sm">
                  <Link to="/b/$slug" params={{ slug: demo.slug }}>
                    Open demo
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    void navigate({
                      to: "/admin",
                      search: { new: "1", niche },
                    })
                  }
                >
                  Build this
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
