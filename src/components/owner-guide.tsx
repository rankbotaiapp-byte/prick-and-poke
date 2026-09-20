import { NICHES } from "@/lib/axiom/niches";
import type { Niche } from "@/lib/axiom/types";

export function OwnerGuide({ niche }: { niche: Niche }) {
  const copy = NICHES[niche];
  return (
    <section className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {copy.label} setup
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{copy.deskHint}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-foreground">
        {copy.setupSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
