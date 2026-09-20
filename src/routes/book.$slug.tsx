import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { addDays, isBefore, setHours, setMinutes, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useHaloMood, useHaloTheme } from "@/components/axiom-shell";
import { Atmosphere } from "@/components/atmosphere";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDayTime, money, parseStamp } from "@/lib/axiom/format";
import { isOpenAt, parseHours } from "@/lib/axiom/hours";
import { NICHES } from "@/lib/axiom/niches";
import { askAxiom, createBooking, getBusiness } from "@/lib/axiom/server";
import { useGuestBookings } from "@/lib/axiom/store";
import type { HaloTheme, Offering } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

function readMember(search: Record<string, unknown>): number | undefined {
  const raw = search.member;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isInteger(n) ? n : undefined;
}

export const Route = createFileRoute("/book/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    member: readMember(search),
  }),
  loader: ({ params }) => getBusiness({ data: { slug: params.slug } }),
  component: BookPage,
});

function BookPage() {
  const business = Route.useLoaderData();
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  useHaloTheme((business?.haloTheme as HaloTheme | undefined) ?? "spectrum");
  useHaloMood("focus");

  const preset = search.member ?? null;
  const [offeringId, setOfferingId] = useState<number | null>(() => {
    if (!business) return null;
    if (preset) {
      const owned = business.offerings.find((o) => o.memberId === preset);
      if (owned) return owned.id;
    }
    return business.offerings[0]?.id ?? null;
  });
  const [memberId, setMemberId] = useState<number | null>(preset);
  const [dayIndex, setDayIndex] = useState(0);
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const askRef = useRef<HTMLInputElement>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const addGuest = useGuestBookings((s) => s.add);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)), []);
  const selectedDay = days[dayIndex] ?? days[0]!;

  if (!business) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">That studio is not on Axiom.</p>
      </main>
    );
  }

  const copy = NICHES[business.niche];
  const offering = business.offerings.find((o) => o.id === offeringId) ?? null;
  const lockedMember = offering?.memberId
    ? business.team.find((m) => m.id === offering.memberId) ?? null
    : null;
  const activeMemberId = lockedMember?.id ?? memberId;
  const picked = business.team.find((m) => m.id === activeMemberId);

  const slots = buildSlots(selectedDay, business.takenSlots, activeMemberId, parseHours(business.hoursJson));

  async function onAsk() {
    const typed = (
      askRef.current?.value ||
      (typeof document !== "undefined"
        ? (document.getElementById("axiom-ask") as HTMLInputElement | null)?.value
        : "") ||
      question
    ).trim();
    if (!typed) return;
    setQuestion(typed);
    setAsking(true);
    try {
      const result = await askAxiom({ data: { slug, question: typed } });
      if (result.ok) {
        setAdvice(result.text);
        const match = result.offeringTitle
          ? business?.offerings.find((o) => o.title === result.offeringTitle)
          : business?.offerings.find((o) =>
              result.text.toLowerCase().includes(o.title.toLowerCase()),
            );
        if (match) setOfferingId(match.id);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Axiom is quiet");
    } finally {
      setAsking(false);
    }
  }

  async function onBook() {
    if (!offering || !slotAt) {
      toast.error("Choose a service and a time");
      return;
    }
    setBusy(true);
    try {
      const result = await createBooking({
        data: {
          slug,
          offeringId: offering.id,
          memberId: activeMemberId,
          guestHandle: handle,
          slotAt,
          note,
        },
      });
      addGuest({
        code: result.code,
        slug: result.slug,
        businessName: result.businessName,
        offeringTitle: result.offeringTitle,
        slotAt: result.slotAt,
        guestHandle: result.guestHandle,
      });
      toast.success(`Held · ${result.code}`);
      await navigate({ to: "/booked" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not hold the time");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {business.name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-display">{copy.bookLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {picked ? `With ${picked.displayName}. Times stay open after close.` : "Times stay open after close. They confirm when they walk in."}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <Label htmlFor="axiom-ask">Ask Axiom</Label>
        <p className="text-xs text-subtle">Answers come from this studio’s book only.</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void onAsk(); }}>
          <Input id="axiom-ask" name="question" ref={askRef} defaultValue="" placeholder="Fade, flash, chili…" autoComplete="off" />
          <Button type="submit" variant="secondary" disabled={asking}>
            {asking ? "Checking the book…" : "Ask"}
          </Button>
        </form>
        {asking ? (
          <p role="status" className="text-sm text-subtle">Checking the book…</p>
        ) : advice ? (
          <p role="status" className="border-l border-border pl-3 text-sm text-muted-foreground">{advice}</p>
        ) : null}
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{copy.offeringLabel}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {business.offerings.map((item) => (
            <OfferingChoice
              key={item.id}
              offering={item}
              active={item.id === offeringId}
              niche={business.niche}
              onSelect={() => {
                setOfferingId(item.id);
                setSlotAt(null);
              }}
            />
          ))}
        </div>
      </section>

      {!lockedMember && business.niche !== "food_truck" && business.team.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{copy.teamLabel}</h2>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <Button type="button" size="sm" variant={memberId == null ? "default" : "secondary"} className="rounded-full" onClick={() => setMemberId(null)}>Any</Button>
            {business.team.filter((m) => m.available).map((member) => (
              <Button key={member.id} type="button" size="sm" variant={memberId === member.id ? "default" : "secondary"} className="rounded-full" onClick={() => setMemberId(member.id)}>
                {member.displayName}
              </Button>
            ))}
          </div>
        </section>
      ) : lockedMember ? (
        <p className="text-sm text-muted-foreground">With {lockedMember.displayName}</p>
      ) : null}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Day</h2>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((day, i) => (
            <button key={day.toISOString()} type="button" onClick={() => { setDayIndex(i); setSlotAt(null); }} className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border text-xs transition-colors duration-quick", i === dayIndex ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground")}>
              <span className="uppercase">{day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}</span>
              <span className="tabular-nums font-medium">{day.getDate()}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Time</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button key={slot.iso} type="button" disabled={slot.taken} onClick={() => setSlotAt(slot.iso)} className={cn("h-11 rounded-sm border text-xs tabular-nums transition-colors duration-quick disabled:opacity-30", slotAt === slot.iso ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-foreground", slot.afterHours && slotAt !== slot.iso ? "text-muted-foreground" : "")}>
              {slot.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="handle">What should we call you</Label>
          <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Rin" maxLength={24} autoComplete="nickname" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">Note for the chair</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Skin fade, no skin on the sides…" maxLength={80} className="min-h-20" />
        </div>
      </section>

      <Button size="lg" onClick={onBook} disabled={busy || !offering || !slotAt}>
        {busy ? "Holding…" : slotAt ? `Hold ${formatDayTime(slotAt)}` : "Hold a time"}
      </Button>
      <Button asChild variant="ghost">
        <Link to="/b/$slug" params={{ slug }}>Back to {business.name}</Link>
      </Button>
    </main>
  );
}

function OfferingChoice({
  offering,
  active,
  niche,
  onSelect,
}: {
  offering: Offering;
  active: boolean;
  niche: "barber" | "tattoo" | "food_truck";
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className={cn("flex gap-3 overflow-hidden rounded-lg border text-left transition-colors duration-quick", active ? "border-accent bg-card" : "border-border bg-card")}>
      {offering.image ? (
        <img src={offering.image} alt="" className="h-20 w-20 shrink-0 object-cover" />
      ) : (
        <Atmosphere niche={niche} className="h-20 w-20 shrink-0" />
      )}
      <div className="min-w-0 py-3 pr-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-medium">{offering.title}</p>
          <p className="tabular-nums text-sm">{money(offering.priceCents)}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {offering.durationMin}m{offering.description ? ` · ${offering.description}` : ""}
        </p>
      </div>
    </button>
  );
}

function buildSlots(
  day: Date,
  taken: { slotAt: string; memberId: number | null }[],
  memberId: number | null,
  hours: ReturnType<typeof parseHours>,
) {
  const out: { iso: string; label: string; taken: boolean; afterHours: boolean }[] = [];
  for (let hour = 8; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute === 30) continue;
      const local = setMinutes(setHours(day, hour), minute);
      if (isBefore(local, new Date())) continue;
      const iso = local.toISOString();
      const takenHere = taken.some((slot) => {
        const a = parseStamp(slot.slotAt).getTime();
        if (Math.abs(a - local.getTime()) > 60_000) return false;
        return slot.memberId == null || memberId == null || slot.memberId === memberId;
      });
      out.push({
        iso,
        label: local.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        taken: takenHere,
        afterHours: !isOpenAt(hours, local),
      });
    }
  }
  return out;
}
