import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { BUSINESS } from "@/config/business";
import { PinPad } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listChairs, verifyChair } from "@/lib/axiom/crew";
import { HOST_SLUG } from "@/lib/axiom/host";
import { NICHE_LIST, NICHES } from "@/lib/axiom/niches";
import { createStudio, listBusinesses, verifyStudio } from "@/lib/axiom/server";
import { useChairSession, useStudioSession } from "@/lib/axiom/store";
import type { Niche } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  loader: () => listBusinesses(),
  component: AdminPage,
});

function AdminPage() {
  const businesses = Route.useLoaderData();
  const navigate = useNavigate();
  const enter = useStudioSession((s) => s.enter);
  const enterChair = useChairSession((s) => s.enter);
  const oneShop = BUSINESS.active;
  const [mode, setMode] = useState<"enter" | "create" | "chair">("enter");
  const [slug, setSlug] = useState(oneShop ? HOST_SLUG : businesses[0]?.id ?? "");
  const [chairId, setChairId] = useState<number | null>(null);
  const [chairs, setChairs] = useState<{ id: number; displayName: string; role: string; hasPin: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [niche, setNiche] = useState<Niche>("barber");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if (oneShop) setSlug(HOST_SLUG);
  }, [oneShop]);

  useEffect(() => {
    if (mode !== "chair" || !slug) return;
    void listChairs({ data: { slug } }).then(setChairs).catch(() => setChairs([]));
  }, [mode, slug]);

  async function onPin(pin: string) {
    if (!slug) {
      toast.error("Choose a studio");
      return;
    }
    setBusy(true);
    try {
      const result = await verifyStudio({ data: { slug, pin } });
      enter(result.slug, pin);
      await navigate({ to: "/studio/$slug", params: { slug: result.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PIN failed");
    } finally {
      setBusy(false);
    }
  }

  async function onChairPin(pin: string) {
    if (!slug || !chairId) {
      toast.error("Choose your chair");
      return;
    }
    setBusy(true);
    try {
      const result = await verifyChair({ data: { slug, memberId: chairId, pin } });
      enterChair(result.slug, result.memberId, pin);
      await navigate({ to: "/chair/$slug", params: { slug: result.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chair PIN failed");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate() {
    if (newPin.length !== 4) {
      toast.error("Choose a four-digit PIN");
      return;
    }
    setBusy(true);
    try {
      const result = await createStudio({ data: { name, niche, pin: newPin, tagline } });
      enter(result.slug, newPin);
      toast.success("Studio is live");
      await navigate({ to: "/studio/$slug", params: { slug: result.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open studio");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Desk</p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-display">
          {oneShop ? BUSINESS.name : "Studio key"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Owner PIN runs the shop. Chair PIN opens one person’s block and album.
        </p>
      </div>
      <div className={cn("grid gap-2", oneShop ? "grid-cols-2" : "grid-cols-3")}>
        <Button variant={mode === "enter" ? "default" : "secondary"} onClick={() => setMode("enter")}>
          Owner
        </Button>
        <Button variant={mode === "chair" ? "default" : "secondary"} onClick={() => setMode("chair")}>
          Chair
        </Button>
        {oneShop ? null : (
          <Button variant={mode === "create" ? "default" : "secondary"} onClick={() => setMode("create")}>
            Open new
          </Button>
        )}
      </div>
      {mode === "enter" ? (
        <>
          {oneShop ? (
            <p className="text-center text-sm text-muted-foreground">{BUSINESS.name}</p>
          ) : (
            <StudioPicker businesses={businesses} slug={slug} setSlug={setSlug} />
          )}
          <p className="text-center text-xs text-subtle">Owner PIN starts as 4242</p>
          <PinPad onComplete={onPin} disabled={busy || !slug} />
        </>
      ) : null}
      {mode === "chair" ? (
        <>
          {oneShop ? null : <StudioPicker businesses={businesses} slug={slug} setSlug={setSlug} />}
          <div className="flex flex-col gap-2">
            {chairs.map((chair) => (
              <button
                key={chair.id}
                type="button"
                onClick={() => setChairId(chair.id)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left",
                  chairId === chair.id ? "border-accent bg-card" : "border-border bg-card",
                )}
              >
                <p className="font-medium">{chair.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {chair.role || "Chair"} · {chair.hasPin ? "PIN set" : "Ask owner for a PIN"}
                </p>
              </button>
            ))}
            {chairs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No chairs yet. Owner adds people in Desk, then sets their PIN.
              </p>
            ) : null}
          </div>
          <PinPad onComplete={onChairPin} disabled={busy || !chairId} />
        </>
      ) : null}
      {mode === "create" && !oneShop ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {NICHE_LIST.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setNiche(key)}
                className={cn(
                  "rounded-md border px-2 py-3 text-xs font-medium",
                  niche === key ? "border-accent bg-card" : "border-border bg-muted",
                )}
              >
                {NICHES[key].label}
              </button>
            ))}
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Studio name" maxLength={48} />
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline" maxLength={80} />
          <Input
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Owner PIN"
          />
          <Button size="lg" onClick={onCreate} disabled={busy || name.trim().length < 2}>
            Open studio
          </Button>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground">After you add a barber, set their chair PIN.</p>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function StudioPicker({
  businesses,
  slug,
  setSlug,
}: {
  businesses: { id: string; name: string; niche: Niche }[];
  slug: string;
  setSlug: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {businesses.map((biz) => (
        <button
          key={biz.id}
          type="button"
          onClick={() => setSlug(biz.id)}
          className={cn(
            "rounded-lg border px-4 py-3 text-left",
            slug === biz.id ? "border-accent bg-card" : "border-border bg-card",
          )}
        >
          <p className="font-medium">{biz.name}</p>
          <p className="text-xs text-muted-foreground">{NICHES[biz.niche].label}</p>
        </button>
      ))}
    </div>
  );
}
