import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/axiom")({
  component: AxiomLanding,
});

function AxiomLanding() {
  return (
    <main className="flex flex-col gap-6 px-5 pb-12 pt-10">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Axiom</p>
      <h1 className="font-display text-3xl font-medium tracking-display">
        A shop that stays open after the chair goes home.
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Booking for barbers, tattoo artists, and food trucks. The customer sees your shop. You
        unlock the desk with four digits. Axiom answers only from what you saved.
      </p>
      <p className="text-sm text-muted-foreground">
        Built for one person running a chair — not a chain.
      </p>
      <a
        href="mailto:hello@neweraapps.com?subject=Axiom%20shop"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        Get a shop built
      </a>
      <p className="text-xs text-subtle">Name, niche, and a phone number. That is enough to start.</p>
    </main>
  );
}
