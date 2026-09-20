import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useHalo, useHaloMood, useHaloTheme } from "@/components/axiom-shell";
import { HeroField, ImageField, PortraitField } from "@/components/image-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDayTime, money } from "@/lib/axiom/format";
import { FLAG_LABEL } from "@/lib/axiom/ground";
import { HALO_THEME_LIST, HALO_THEMES, sanitizeHaloColors } from "@/lib/axiom/halo";
import { parseHours } from "@/lib/axiom/hours";
import { NICHES } from "@/lib/axiom/niches";
import {
  addLedgerTruth,
  addMember,
  addOffering,
  addPost,
  getStudio,
  removeLedgerTruth,
  removeMember,
  removeOffering,
  removePost,
  setBookingStatus,
  setLocation,
  updateMember,
  updateOffering,
  updateStudio,
} from "@/lib/axiom/server";
import { useStudioSession } from "@/lib/axiom/store";
import type { AxiomReceipt, HaloTheme, Offering, StudioPayload, TeamMember } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio/$slug")({
  component: StudioPage,
});

function StudioPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const session = useStudioSession((s) => s.session);
  const ready = useStudioSession((s) => s.ready);
  const leave = useStudioSession((s) => s.leave);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["studio", slug],
    enabled: ready && session?.slug === slug,
    queryFn: () => getStudio({ data: { slug, pin: session!.pin } }),
    refetchInterval: 12_000,
  });

  useHaloMood("focus");
  useHaloTheme(
    (query.data?.haloTheme as HaloTheme | undefined) ?? "spectrum",
    query.data?.haloColors ?? null,
  );

  useEffect(() => {
    if (ready && session?.slug !== slug) {
      void navigate({ to: "/admin" });
    }
  }, [ready, session, slug, navigate]);

  if (!ready || session?.slug !== slug) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Opening studio…</p>;
  }
  if (query.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading the book…</p>;
  }
  if (query.error || !query.data) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Could not open this studio.</p>
        <Button className="mt-4" variant="outline" onClick={() => leave()}>
          Leave
        </Button>
      </main>
    );
  }

  const studio = query.data;
  const copy = NICHES[studio.niche];
  const pin = session.pin;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["studio", slug] });
  }

  return (
    <main className="flex flex-col gap-4 px-4 pb-8 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {copy.label}
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-display">{studio.name}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            leave();
            void navigate({ to: "/admin" });
          }}
        >
          Lock
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Changes land on the public page as soon as you save.
      </p>
      <Tabs defaultValue="presence">
        <TabsList>
          <TabsTrigger value="presence">Presence</TabsTrigger>
          <TabsTrigger value="team">{copy.teamLabel}</TabsTrigger>
          <TabsTrigger value="offer">{copy.offeringLabel}</TabsTrigger>
          <TabsTrigger value="place">Place</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="loop">Receipts</TabsTrigger>
        </TabsList>
        <TabsContent value="presence">
          <PresenceForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="team">
          <TeamForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="offer">
          <OfferingForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="place">
          <PlaceForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="posts">
          <PostForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="book">
          <BookingsList studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="loop">
          <ReceiptsPanel studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
      </Tabs>
      <Button asChild variant="outline">
        <Link to="/b/$slug" params={{ slug }}>
          View public page
        </Link>
      </Button>
    </main>
  );
}

function PresenceForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(studio.name);
  const [tagline, setTagline] = useState(studio.tagline);
  const [about, setAbout] = useState(studio.about);
  const [haloTheme, setHaloTheme] = useState<HaloTheme>(studio.haloTheme);
  const [hoursJson, setHoursJson] = useState(studio.hoursJson);
  const [heroImage, setHeroImage] = useState<string | null>(studio.heroImage);
  const seeded = studio.haloColors ?? HALO_THEMES[studio.haloTheme];
  const [tube, setTube] = useState(seeded[0] ?? "#5ce1e6");
  const [pulse, setPulse] = useState(seeded[1] ?? "#7a6cff");
  const [ember, setEmber] = useState(seeded[2] ?? "#ff5c8a");
  const [busy, setBusy] = useState(false);
  const { setColors, setTheme } = useHalo();

  useEffect(() => {
    const next = sanitizeHaloColors([tube, pulse, ember, tube, pulse, ember]);
    if (next) setColors(next);
  }, [tube, pulse, ember, setColors]);

  function applyColors(nextTheme: HaloTheme, next: string[]) {
    setHaloTheme(nextTheme);
    setTheme(nextTheme);
    setTube(next[0]);
    setPulse(next[1] ?? next[0]);
    setEmber(next[2] ?? next[0]);
    setColors(next);
  }

  async function save() {
    setBusy(true);
    try {
      parseHours(hoursJson);
      const haloColors = sanitizeHaloColors([tube, pulse, ember, tube, pulse, ember]);
      await updateStudio({
        data: { slug, pin, name, tagline, about, haloTheme, hoursJson, heroImage, haloColors },
      });
      if (haloColors) setColors(haloColors);
      toast.success("Presence saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Tagline" value={tagline} onChange={setTagline} />
      <HeroField label="Hero image" value={heroImage} onChange={setHeroImage} />
      <p className="text-xs text-subtle">This sits behind the name on the public page. Switch it whenever the room changes.</p>
      <div className="flex flex-col gap-1.5">
        <Label>About</Label>
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={600} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Halo preset</Label>
        <div className="grid grid-cols-4 gap-2">
          {HALO_THEME_LIST.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => applyColors(theme, HALO_THEMES[theme])}
              className={cn(
                "rounded-md border px-2 py-2 text-xs capitalize",
                haloTheme === theme ? "border-accent bg-card" : "border-border bg-muted",
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Tube colors</Label>
        <p className="text-xs text-subtle">These flow in the neon rim. The ring updates while you pick.</p>
        <div className="grid grid-cols-3 gap-2">
          <ColorStop label="Tube" value={tube} onChange={setTube} />
          <ColorStop label="Pulse" value={pulse} onChange={setPulse} />
          <ColorStop label="Ember" value={ember} onChange={setEmber} />
        </div>
      </div>
      <Button onClick={save} disabled={busy}>Save presence</Button>
    </div>
  );
}

function ColorStop({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-md border border-border bg-muted px-2 py-2">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full cursor-pointer rounded-sm bg-transparent" />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
